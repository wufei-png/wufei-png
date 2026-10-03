"""Exercise observable consistency failures in public profile documents."""

import copy
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


REPO = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("validate_profile", REPO / "scripts/validate_profile.py")
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class ProfileContractTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        shutil.copy(REPO / "README.md", self.root)
        shutil.copytree(REPO / "docs", self.root / "docs")
        shutil.copytree(REPO / "assets", self.root / "assets")
        self.register_path = self.root / "docs/evidence-register.json"
        self.registry = json.loads(self.register_path.read_text())

    def change_readme(self, before, after):
        path = self.root / "README.md"
        text = path.read_text()
        self.assertIn(before, text)
        path.write_text(text.replace(before, after))

    def write_registry(self):
        self.register_path.write_text(json.dumps(self.registry))

    def assert_rejected(self, reason):
        errors = validator.validate(self.root)
        self.assertTrue(any(reason in e for e in errors), errors)

    def test_current_profile_and_reordered_sections_are_valid(self):
        self.assertEqual(validator.validate(self.root), [])
        path = self.root / "README.md"
        head, sections = path.read_text().split("## Selected work", 1)
        selected, rest = sections.split("## More work", 1)
        more, rest = rest.split("## Merged upstream contributions", 1)
        path.write_text(head + "## More work" + more + "## Selected work" + selected + "## Merged upstream contributions" + rest)
        self.assertEqual(validator.validate(self.root), [])

    def test_missing_local_file_and_html_source(self):
        for target in ("[Missing](docs/missing.md)", '<img src="assets/missing.svg">', '<source srcset="assets/missing.svg 2x">'):
            with self.subTest(target=target):
                self.change_readme("## Contact", "## Contact\n" + target)
                self.assert_rejected("missing local link")
                self.change_readme("## Contact\n" + target, "## Contact")

    def test_document_fragments_and_explicit_html_anchors(self):
        self.change_readme("#selected-work", "#absent-section")
        self.assert_rejected("missing fragment")
        self.change_readme("#absent-section", "#selected-work")
        self.change_readme("## Contact", '## Contact\n<a id="extra"></a> [Extra](#extra)')
        self.assertEqual(validator.validate(self.root), [])

    def test_relative_link_is_resolved_from_its_document(self):
        self.change_readme("## Contact", "## Contact\n[Governance](docs/portfolio-governance.md#review-and-automation)")
        self.assertEqual(validator.validate(self.root), [])

    def test_local_traversal_and_symlink_escape(self):
        outside = self.root.parent / "outside.md"
        outside.write_text("# Outside")
        for url in ("../outside.md", "%2e%2e/outside.md", "docs/escape.md"):
            with self.subTest(url=url):
                if url == "docs/escape.md":
                    (self.root / url).symlink_to(outside)
                self.change_readme("## Contact", "## Contact\n[Outside](" + url + ")")
                self.assert_rejected("escapes repository")
                self.change_readme("## Contact\n[Outside](" + url + ")", "## Contact")

    def test_status_is_required_beside_the_correct_entry(self):
        note = self.registry["entries"][4]["status_note"]
        self.change_readme(note, "")
        self.change_readme("## Contact", "## Contact\n" + note)
        self.assert_rejected("reviewworthy: missing nearby status_note")

    def test_missing_register_entry_unknown_url_and_missing_display(self):
        removed = self.registry["entries"].pop(0)
        self.write_registry()
        self.assert_rejected("external link has no public evidence entry")
        self.registry["entries"].insert(0, removed)
        self.write_registry()
        self.change_readme(removed["url"], "https://example.com/unknown")
        self.assert_rejected("expected exactly one displayed entry")

    def test_duplicate_entries_and_wrong_category(self):
        first = self.registry["entries"][0]
        self.registry["entries"].append(copy.deepcopy(first))
        self.write_registry()
        self.assert_rejected("duplicate id")
        self.registry["entries"].pop()
        first["category"] = "secondary"
        first["status_note"] = "Installable"
        self.write_registry()
        self.assert_rejected("category does not match register")

    def test_duplicate_display_is_rejected(self):
        self.change_readme("## Selected work", "## Selected work\n\n- [Skills](https://github.com/wufei-png/skills)\n")
        self.assert_rejected("expected exactly one displayed entry, found 2")

    def test_evidence_link_cannot_be_used_as_an_undeclared_entry(self):
        url = self.registry["entries"][0]["evidence"][0]["url"]
        self.change_readme("## Selected work", "## Selected work\n\n- [Extra](" + url + ")\n")
        self.assert_rejected("entry has no register URL")

    def test_autolink_is_checked_and_reference_definitions_are_rejected(self):
        self.change_readme("## Contact", "## Contact\n<https://example.com/unknown>")
        self.assert_rejected("external link has no public evidence entry")
        self.change_readme("<https://example.com/unknown>", "[Local][local]\n\n[local]: docs/missing.md")
        self.assert_rejected("use inline links")

    def test_unapproved_contacts_in_text_html_and_mailto(self):
        for target in ("visitor@example.com", '<a href="mailto:visitor@example.com">Email</a>', "[Email](mailto:wufeii.sjtu@gmail.com?cc=visitor@example.com)"):
            with self.subTest(target=target):
                self.change_readme("## Contact", "## Contact\n" + target)
                self.assert_rejected("contact")
                self.change_readme("## Contact\n" + target, "## Contact")

    def test_private_or_non_https_register_is_rejected(self):
        entry = self.registry["entries"][0]
        entry["visibility"] = "private"
        self.write_registry()
        self.assert_rejected("visibility must be public")
        entry["visibility"] = "public"
        entry["evidence"][0]["url"] = "http://example.com/source"
        self.write_registry()
        self.assert_rejected("public HTTPS")

    def test_merged_proof_cannot_be_missing_or_only_closed(self):
        entry = next(e for e in self.registry["entries"] if e["category"] == "upstream")
        source = entry["evidence"][0]
        self.change_readme(source["url"], entry["url"])
        self.assert_rejected("merged-pr link is missing")
        self.change_readme(entry["url"] + "),", source["url"] + "),")
        source.pop("merged_at")
        source["state"] = "closed"
        self.write_registry()
        self.assert_rejected("timezone-aware merged_at")

    def test_retired_reference_is_rejected_but_history_and_examples_are_allowed(self):
        self.change_readme("## Contact", "## Contact\n[Old card](assets/profile-summary-light.svg)")
        self.assert_rejected("retired asset")
        self.change_readme("## Contact\n[Old card](assets/profile-summary-light.svg)", "## Contact\n```md\n[Example](assets/profile-summary-light.svg)\n```\n<!-- [Example](missing.md) -->")
        self.assertEqual(validator.validate(self.root), [])

    def test_invalid_register_shapes_report_errors(self):
        for bad in ([], {}, {"version": 1, "entries": [None]}, {**self.registry, "entries": [{**self.registry["entries"][0], "evidence": [None]}]}):
            with self.subTest(bad=type(bad).__name__):
                self.register_path.write_text(json.dumps(bad))
                self.assertTrue(validator.validate(self.root))

    def test_invalid_merged_entry_url_and_missing_date_do_not_crash(self):
        entry = next(e for e in self.registry["entries"] if e["category"] == "upstream")
        entry["url"] = None
        entry["verified_on"] = "invalid-date"
        self.write_registry()
        self.assert_rejected("url must be public HTTPS")
        self.assert_rejected("verified_on must be an ISO date")

    def test_cli_failure_is_nonzero_without_traceback(self):
        self.register_path.write_text("{broken")
        result = subprocess.run([sys.executable, str(REPO / "scripts/validate_profile.py"), "--root", str(self.root)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("docs/evidence-register.json", result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_malformed_readme_url_reports_error_without_traceback(self):
        self.change_readme(self.registry["entries"][0]["url"], "https://[broken")
        result = subprocess.run([sys.executable, str(REPO / "scripts/validate_profile.py"), "--root", str(self.root)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("README.md: malformed URL", result.stderr)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
