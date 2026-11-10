# HLJ-007 · Research Verification Desk

## Scope
An **editorial review queue**, not autonomous truth classification. This milestone does not change the ten pre-existing dossier labels, the 179-topic registry, the source registry, or the state of a medical or extraordinary hypothesis.

## Inputs and truth boundaries
- \`site/data/verification.json\`: ten narrow questions, each tied to a pre-existing dossier and one or more of the 19 catalogued source IDs.
- Every claim starts \`reviewStatus: awaiting-primary-source-check\` and \`provenanceState: catalog-references-only\`. The presence of a URL is **not** evidence that the page resolves, describes that claim, is peer-reviewed, or has not been corrected/retracted.
- Source relationship roles: \`reports\` (source described as reporting a result), \`background\` (context not direct proof), \`qualifies\` (bounded limitation or different intervention), and \`distinct-protocol\` (must not be marketed as replication).
- No unsourced automatic link checking, no peer-review simulation, no fabricated scientific confidence scores.
- \`site/data/corrections.json\`: deliberately empty as of the initial milestone. The absence of a published correction is not validation. Future entries need claim ID, date, specific change, rationale and source references.

## Review proposal workflow
1. Filter the ten questions by category or free-text.
2. Open one claim. Read its precise scope and individual sources, including source-role explanation and limitations.
3. Select one source you **actually inspected**; choose a provisional reviewer assessment; write methods/observation notes and limitations.
4. Explicitly attest you inspected it. The app then allows a local review proposal with an optional suggested wording correction.
5. Proposal data lives **only in this browser tab's memory**. Remove it, clear all, or explicitly export up to twenty as \`369.hlj.review-packet.v1\` JSON.
6. Review packets contain ordinary user-authored observations and proposed improvements. They do **not** reclassify any public claim, push a Git commit, contact GitHub, or upload anything.

## Publication and source hygiene
Before modifying published evidence status, a human editor must (a) read the primary source, (b) verify URL, author, publication metadata, retractions/corrections and specific supported claim, (c) compare primary methods and contradicting work, (d) seek independent editorial review and (e) approve a normal PR. Published correction entries must preserve the old wording, replacement wording and rationale. Do not replace scientific caution with a simplistic green checkmark.

## Browser and safety validation
\`scripts/browser-smoke.mjs\` starts a local static server and launches installed headless Google Chrome to ensure all legacy sections boot and the new review list becomes populated. This is a browser **startup** smoke, not proof of keyboard focus, touch/Quest comfort, screen-reader quality, individual source availability, or reviewer expertise. It must pass on CI before Pages deployment. Manual browser checks remain necessary.

## Future HLJ-008
Direct primary-source link audits and publication/retraction metadata review, correction proposal approval UI with PR provenance, evidence-chain export and independent comparison review. Avoid API scraping or automatic authority upgrades based on source count.
