#!/usr/bin/env python3
"""Check the profile's declared public evidence and local links without networking.

This is a consistency check for the repository's inline Markdown/HTML format,
not a Markdown renderer, privacy scanner, or verifier of external claims.
"""

import argparse
from collections import Counter
from datetime import date, datetime
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import unicodedata
from urllib.parse import unquote, urlsplit


SECTIONS = {
    "Selected work": "selected",
    "More work": "secondary",
    "Merged upstream contributions": "upstream",
    "Research background": "research",
}
RETIRED = ("profile-summary", "system-map", "github-profile-summary-cards")
INLINE_LINK = re.compile(
    r'!?\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s()]+(?:\([^()\n]*\)[^\s()]*)*))'
    r'\s*(?:"[^"\n]*")?\s*\)'
)
EMAIL = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")


def visible_source(text):
    """Exclude examples and comments from entry, link and contact checks."""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = re.sub(r"(?ms)^\s*(```|~~~)[^\n]*\n.*?^\s*\1[^\n]*(?:\n|$)", "", text)
    return re.sub(r"(`+)[^`\n]*\1", "", text)


class HTMLLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])
        if attrs.get("srcset"):
            self.links.extend(part.strip().split()[0] for part in attrs["srcset"].split(",") if part.strip())
        for key in ("id", "name"):
            if attrs.get(key):
                self.ids.add(attrs[key])


def links(text):
    parser = HTMLLinks()
    parser.feed(text)
    return (
        [match.group(1) or match.group(2) for match in INLINE_LINK.finditer(text)]
        + re.findall(r"<((?:https?://|mailto:)[^<>\s]+)>", text)
        + parser.links
    )


def anchors(text):
    parser = HTMLLinks()
    parser.feed(text)
    result = parser.ids
    counts = Counter()
    for heading in re.findall(r"^#{1,6} +(.+?)\s*#*\s*$", text, re.M):
        heading = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", heading).lower()
        slug = "".join(c for c in heading if c in " -_" or unicodedata.category(c)[0] in "LN").replace(" ", "-")
        suffix = f"-{counts[slug]}" if counts[slug] else ""
        result.add(slug + suffix)
        counts[slug] += 1
    return result


def public_url(value):
    if not isinstance(value, str):
        return False
    try:
        parsed = urlsplit(value)
        return parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username and not parsed.password
    except ValueError:
        return False


def valid_date(value):
    try:
        return isinstance(value, str) and date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def registry_errors(registry):
    errors = []
    if not isinstance(registry, dict) or type(registry.get("version")) is not int or registry["version"] != 1:
        return ["docs/evidence-register.json: expected an object with version 1"]
    if not valid_date(registry.get("verified_on")):
        errors.append("register: verified_on must be an ISO date")
    contacts = registry.get("public_contacts")
    if not isinstance(contacts, list) or not contacts or any(not isinstance(c, str) or not EMAIL.fullmatch(c) for c in contacts):
        errors.append("register: public_contacts must be a nonempty list of email addresses")
    entries = registry.get("entries")
    if not isinstance(entries, list) or not entries:
        return errors + ["register: entries must be a nonempty list"]
    ids, urls = set(), set()
    for index, entry in enumerate(entries):
        label = f"register: entry {index + 1}"
        if not isinstance(entry, dict):
            errors.append(f"{label} must be an object")
            continue
        for field in ("id", "name", "claim"):
            if not isinstance(entry.get(field), str) or not entry[field].strip():
                errors.append(f"{label}: {field} must be a nonempty string")
        for field, seen in (("id", ids), ("url", urls)):
            value = entry.get(field)
            if isinstance(value, str):
                if value in seen:
                    errors.append(f"{label}: duplicate {field}")
                seen.add(value)
        if not public_url(entry.get("url")):
            errors.append(f"{label}: url must be public HTTPS without credentials")
        if entry.get("visibility") != "public":
            errors.append(f"{label}: visibility must be public")
        if entry.get("category") not in SECTIONS.values():
            errors.append(f"{label}: unknown category")
        if not valid_date(entry.get("verified_on")):
            errors.append(f"{label}: verified_on must be an ISO date")
        note = entry.get("status_note")
        if (note is not None or entry.get("category") == "secondary") and (not isinstance(note, str) or not note.strip()):
            errors.append(f"{label}: status_note must be a nonempty string")
        sources = entry.get("evidence")
        if not isinstance(sources, list) or not sources:
            errors.append(f"{label}: evidence must be a nonempty list")
            continue
        for source in sources:
            if not isinstance(source, dict) or not public_url(source.get("url")) or not isinstance(source.get("kind"), str) or not source["kind"].strip():
                errors.append(f"{label}: evidence requires a kind and public HTTPS url")
                continue
            if source["kind"] == "merged-pr":
                try:
                    stamp = datetime.fromisoformat(source.get("merged_at", ""))
                    merged = stamp.tzinfo is not None
                except (TypeError, ValueError):
                    merged = False
                if (
                    not merged
                    or source.get("author") != "wufei-png"
                    or not public_url(entry.get("url"))
                    or not re.fullmatch(re.escape(entry["url"]) + r"/pull/\d+", source["url"])
                ):
                    errors.append(f"{label}: merged-pr needs matching repository, author and timezone-aware merged_at")
        if entry.get("category") == "upstream" and not any(isinstance(s, dict) and s.get("kind") == "merged-pr" for s in sources):
            errors.append(f"{label}: upstream entry needs merged-pr evidence")
    return errors


def local_link_errors(root, path, text):
    errors = []
    label = str(path.relative_to(root))
    if re.search(r"^\s*\[[^]]+\]:", text, re.M):
        errors.append(f"{label}: use inline links instead of reference definitions")
    for target in links(text):
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc:
            continue
        destination = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
        if not destination.is_relative_to(root):
            errors.append(f"{label}: local link escapes repository: {target}")
        elif not destination.exists():
            errors.append(f"{label}: missing local link: {target}")
        elif parsed.fragment:
            if not destination.is_file() or unquote(parsed.fragment) not in anchors(visible_source(destination.read_text(encoding="utf-8"))):
                errors.append(f"{label}: missing fragment: {target}")
    return errors


def entry_blocks(text):
    """Entries are list items under the four presentation headings, in any order."""
    category, block = None, []
    result = []
    for line in text.splitlines() + [""]:
        if line.startswith("## ") or line.startswith("- ") or not line.strip():
            if block:
                result.append((category, "\n".join(block)))
                block = []
        if line.startswith("## "):
            category = SECTIONS.get(line[3:].strip())
        elif line.startswith("- ") and category:
            block = [line]
        elif block:
            block.append(line)
    return result


def validate(root):
    root = root.resolve()
    register_path = root / "docs/evidence-register.json"
    try:
        registry = json.loads(register_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ValueError) as exc:
        return [f"docs/evidence-register.json: cannot read register ({type(exc).__name__})"]
    errors = registry_errors(registry)
    if errors:
        return errors
    readme_path = root / "README.md"
    try:
        readme = visible_source(readme_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError) as exc:
        return [f"README.md: cannot read document ({type(exc).__name__})"]
    for path in [readme_path, *sorted((root / "docs").rglob("*.md"))]:
        try:
            errors.extend(local_link_errors(root, path, visible_source(path.read_text(encoding="utf-8"))))
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(f"{path.relative_to(root)}: cannot check links ({type(exc).__name__})")
    if any(name in readme.lower() for name in RETIRED):
        errors.append("README.md: retired asset or summary service reference")
    allowed = {entry["url"] for entry in registry["entries"]}
    allowed.update(source["url"] for entry in registry["entries"] for source in entry["evidence"])
    for target in links(readme):
        try:
            parsed = urlsplit(target)
        except ValueError:
            errors.append("README.md: malformed URL")
            continue
        if parsed.scheme == "mailto":
            if unquote(parsed.path) not in registry["public_contacts"] or parsed.query:
                errors.append("README.md: contact is not in public_contacts or includes undeclared recipients")
        elif (parsed.scheme or parsed.netloc) and target not in allowed:
            errors.append("README.md: external link has no public evidence entry")
    if set(EMAIL.findall(readme)) - set(registry["public_contacts"]):
        errors.append("README.md: displayed contact is not in public_contacts")
    blocks = [(category, block, links(block)) for category, block in entry_blocks(readme)]
    entry_urls = {entry["url"] for entry in registry["entries"]}
    for category, block, targets in blocks:
        if not targets or targets[0] not in entry_urls:
            errors.append(f"README.md: displayed {category} entry has no register URL")
    for entry in registry["entries"]:
        matches = [
            (category, block, targets)
            for category, block, targets in blocks
            if targets and targets[0] == entry["url"]
        ]
        label = f"README.md: {entry['id']}"
        if len(matches) != 1:
            errors.append(f"{label}: expected exactly one displayed entry, found {len(matches)}")
            continue
        category, block, targets = matches[0]
        if category != entry["category"]:
            errors.append(f"{label}: category does not match register")
        if entry.get("status_note") and entry["status_note"] not in block:
            errors.append(f"{label}: missing nearby status_note")
        for source in entry["evidence"]:
            if source["kind"] == "merged-pr" and source["url"] not in targets:
                errors.append(f"{label}: merged-pr link is missing from contribution entry")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    errors = validate(args.root)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    print("Profile evidence, contact and local-link checks passed (offline).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
