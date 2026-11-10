# HLJ-011 · Research Workbench, local packet convergence

## Why
Several Atlas modules export useful but separate formats. This milestone provides a **read-only, user-approved reconciliation surface**, not a backend, inter-app service or scientific authority. It lives inside the existing Living Lab: the clean header remains unchanged.

## Supported incoming formats
1. **Living Lab**: \`369.hlj.educational-notebook.v1\` containing 1–12 explicitly captured \`369.hlj.educational-run.v1\` records. Recompute every known protocol with the original inputs and compare the *entire* canonical result (including text and outputs). Reject altered, stale or impossible numeric simulations. Keep personal observations and limitations for explicit export.
2. **Verification Desk**: \`369.hlj.review-packet.v1\`, with 1–20 local proposals. Match each claim, source and topic to current registries; re-run original review proposal rules, requiring author attestation and nonempty observations and limitations. The result remains **UNPUBLISHED**.
3. **Evidence Trail**: \`369.hlj.evidence-trail-export.v1\`. Rebuild the documentary trail from the currently published claim, source, inspection and correction data and compare the exported trail exactly. Reject outdated or tampered bibliographies; never treat source presence as validation of study content.
4. **Lab Bridge**: \`369.hlj.lab_bridge.reviewed_packet.v1\` with 1–12 reviewed records from the four narrowly supported original AquaCymatics and Element Spiral shapes. Validate producer/format pairs, byte fingerprints, bounded fields and optional topic associations. Retain only allowlisted source-declared descriptions and fields, not a raw lab export. **None of these signatures authenticate a producer or scientifically verify a result.**
5. **Re-import of this module's own archive**: \`369.hlj.research-workbench.v1\`; validates each embedded packet again. Cannot be used to bypass the original gates.

## Browser workflow
- User picks one local \`.json\` file no larger than **256 KiB**, decoded as strict UTF-8 and parsed entirely in the browser.
- The inspector previews every normalized record inside expandable details; unsupported keys do not enter the curated packet, and all content is inserted with \`textContent\` rather than HTML.
- User explicitly checks the review acknowledgement and clicks Add. No file is transmitted to a server, no background sync and no automatic browser storage.
- At most **eight** approved packets are retained in this page tab; duplicate normalized packets are refused.
- User can remove entries, clear the session or explicitly download a consolidated \`369.hlj.research-workbench.v1\` JSON. The file includes the personal notes that were shown in the preview, and must be reviewed before it is shared.
- SHA-256 when available is a file-byte fingerprint for human reference only; not provenance authentication.
- Future: strict support for Constellation notebooks after defining a safe large-notes interchange schema and explicit per-note consent.

## No false claims
Model computations are not lab measurements; review proposals are not published; bibliographic matches are not independent validation; producer fields and hash strings are not a digital signature. Even re-importing a bundle is not an editor's endorsement of its claims.

## Manual acceptance
Test exports from all four live modules; rejection of oversized, forged, stale and wrong-schema files; browser keyboard navigation, narrow viewport, actual JSON downloads, bundle re-import, duplicates and clearing. Test no hidden network upload in DevTools. CI smoke tests importer consent and session clear; physical touch and assistive-technology audits remain pending.
