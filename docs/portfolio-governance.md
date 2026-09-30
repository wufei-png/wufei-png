# Portfolio governance

The profile helps open-source users choose a tool or collaboration entry point.
Inspectable engineering evidence also serves technical readers evaluating the work.
The approved scope and delivery record are in the [refresh plan](plans/profile-refresh-2026-09-30.md).

## Selection and status

- Selected work should solve a clear user problem, have a public entry point and
  supporting implementation or contract evidence, and add a distinct capability.
  Four entries are the current content budget, not a permanent promotion rule.
- More work may include early foundations, experiments, benchmarks, or systems
  with incomplete operational gates. State the relevant boundary beside the entry.
- Reassess or remove an entry when it is superseded, archived, no longer matches
  its documented runtime, or cannot support its profile claims publicly.
- Stars, activity counts, and repository counts do not establish usability or
  maturity. A project can be worth using without being production-complete.

`Early open-source foundation` means an implemented initial slice with important
follow-up work. `Implementation / contract hardening` means contracts and provider
coverage are still being established. `Experimental` does not promise supported
production behavior. `Pilot not approved (no-go)` must remain visible until the
project's operational acceptance evidence changes. `Benchmark and reference tasks`
describes an evaluation asset; it makes no claim about generators' results or
ownership of a baseline compiler. `Current runtime has documented limits` directs
readers to an application's supported runtime and known gaps.

## Evidence and disclosure

[evidence-register.json](evidence-register.json) is the current source register.
It contains only public project, contribution, and research claims, with source
URLs, status notes, and dates of manual source inspection. Historical decisions in
the refresh plan are snapshots; update the register when current claims change.

- Documentation and test/eval contracts demonstrate what can be inspected or
  checked. Their existence does not establish that the checks passed.
- Provider-free tests do not prove live provider, database, deployment, or
  production behavior. A live claim needs a dated, public receipt or result for
  the same architecture and scope.
- Upstream contributions require a specific PR with a verified merge date and
  contributor identity; a closed PR alone is insufficient.
- Research background is the profile author's self-description. Paper metadata
  can confirm a title, year and author name without independently binding that
  name to a GitHub account. Do not infer first/lead author roles.
- Do not add private repositories, local workspace paths, credentials, internal
  metrics, organization/customer facts, or private receipts to public documents
  or CI output. A `public` field records the human check; it is not proof of
  current anonymous accessibility or a comprehensive privacy scanner.
- The allowed public contact list is `public_contacts` in the register. Changes
  to that list require an intentional review of which addresses should be public.

## Review and automation

At publication and at least quarterly, open the project, PR and paper links;
compare claims and status with current sources; check entry selection, contact,
disclosure and desktop/mobile presentation. Advance verification dates only after
actually inspecting the relevant sources, and record unavailable sources in the
entry's `limits`. CI success alone does not refresh evidence dates.

The offline validator checks the supported README link syntax, entry membership,
nearby status notes, contact allowlist, local paths/anchors and retired references.
It does not judge semantic truth or query external link availability. Keep the
README's entry links as inline Markdown links and each entry as one list item;
status notes belong in that item. Do not hide entry links in code or comments.

CI runs deterministic checks with repository read permission. It must not publish,
select projects, promote maturity, rewrite content, or refresh data. External
links remain part of manual review; there is no scheduled checker.

Run the deterministic checks from the repository root with Python 3.11 or newer:

```bash
python3 -m unittest discover -s tests -v
python3 scripts/validate_profile.py
git diff --check
```

Inline Markdown links (including angle-wrapped paths), URL autolinks, HTML
`href`/`src`/`srcset`, and local Markdown heading or HTML ID fragments are supported.
Reference-style link definitions are rejected explicitly. Examples in fenced code
blocks, inline code, and HTML comments are excluded from displayed-entry checks.
