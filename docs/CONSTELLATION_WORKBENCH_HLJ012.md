# HLJ-012 · Constellation notebooks in the unified Workbench

## Purpose
The original Constellation research packet (schema 369-hlj-research-packet/v1) is now accepted in the Local Research Workbench. This is the fifth producer family. It extends the existing review-before-apply workflow without creating new public claims or changing the compact navigation.

## Format and strict validations
- Original Constellation scope and schema; generated date and selected topic metadata must be recognizable.
- Current topic ID, title, realm and review status must match the catalog.
- All existing provisional relationships touching the selected topic must match current public registry entries exactly. No invented connections.
- The optional editorial dossier and every source metadata record must match their published entries.
- Every note must identify a registered topic and contain nonempty text of at most 8,000 characters. Duplicate note topics are rejected. Zero-note exports remain valid as selected-topic reference packets.
- At most 179 note entries (one per founding topic) are accepted, subject to the Workbench's 256 KiB whole-file limit. Oversize exports are visibly refused, never silently truncated.
- Each note is copied as author-supplied text, not peer-reviewed evidence, source authentication or proof of scientific results. Catalog consistency does not verify authorship.

## User workflow and privacy
The visitor writes notes in the Constellation, clicks Export research packet JSON, then follows the Workbench shortcut and manually selects that downloaded file. The Workbench previews the entire normalized note content before requesting an explicit acknowledgement and adding it to a browser-memory-only collection of up to eight packets. Exported collections contain the notes the user approved, so they should be checked carefully before sharing. No automatic persistence, backend upload, tracking or GitHub change occurs.

## In-page topic navigation
Approved and previewed packets link to their exact catalog topic IDs. Clicking a link dispatches a local selection event to the existing Constellation inspector, updates the URL to a normal topic deep link and scrolls to the Constellation without page reload. This preserves all current tab-only notes and workbench packets. Fallback anchor destinations are also supplied.

## Acceptance
Node tests validate empty and multiple notes, long-note preservation, tampered topic IDs, source titles, dossier text, relationships, dates, duplicate notes and five-family archive roundtrip. The Chrome interaction harness exercises file selection, preview, consent, approval, topic navigation and clearing. Phone touch, screen reader and manual import of actual exported files remain additional release qualifications.