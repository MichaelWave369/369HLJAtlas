# HLJ-013 · Research Project Workspaces

## Why
Turn the five existing Atlas packet streams into **question-centered** research projects without a sixth silo, cloud account, new API, or crowded header. Projects are a sub-panel of the existing Local Research Workbench.

## Local creation and limits
- Explicit user-entered project title (3–90 characters), research question (20–500), working hypothesis (15–500) and limitations/next checks (20–750). These fields are not endorsed scientific claims.
- Select **one to eight** already-reviewed Workbench packets. Only the selected normalized packet contents are included, not everything else in the visitor's session.
- Create up to **three** session projects. A project holds its own copy of included packets; clearing the main packet queue does not silently destroy projects that have been explicitly created.
- Projects exist only in memory. On tab close, they disappear unless explicitly exported. A dedicated export button for each project downloads its complete JSON.
- Portable format: `369.hlj.research-project.v1`. The maximum serialized file size is **1 MiB**. The exported file may include personal observations or review notes, so users must review it before sharing.

## Re-import
A separate local file input accepts a JSON project up to 1 MiB. Parsing uses strict UTF-8. No upload occurs. Import rejects unknown root fields, invalid dates, missing research question/limitations, unsupported or duplicate packet formats, incorrect packet kinds, stale source titles, forged computational results, and any claim status outside the five existing validators. All included records are reconstructed and compared to current registry constraints; no project status upgrades are trusted. User-authored notes are structurally checked but **not cryptographically authenticated**.

The import UI expands each packet and its note fields for human inspection. A checkbox and explicit **Add reviewed project** action are required before the project enters session memory.

## Accuracy and privacy boundaries
- A project groups notes, models and bibliography. It is **not** independently peer-reviewed, verified science, medical advice or proof of a contested hypothesis.
- Original notebook and reviewer comments remain personal user text and can be modified by whoever possesses the JSON. No digital signature or author verification is implied.
- Source title, docket, relation and evidence-trail checks establish consistency with the published Atlas catalog, not independent validation of a study or retraction clearance.
- No automatic browser storage, tracking, backend, cross-application write, external source fetch or automatic PR publication.

## Tests
Node tests: multi-format projects, altered computation/claim statuses, forged source metadata, duplicate packets, missing metadata, invalid dates, 1 MiB bound, editable user-authored notes and UI security constraints.

Real Chrome: create from an approved Constellation notebook, verify its independent lifetime when the packet queue is cleared, remove a project, import a valid project file with actual file selection, inspect contents, verify consent gating, approve, and remove.

Manual acceptance remains required on physical phones and assistive technology, plus real exports from each of the five source modules.