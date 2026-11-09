# HLJ-004 — Locally reviewed laboratory receipt bridge

This implements **manual file handoff only**, not remote project access, automatic cross-site sync, or live API integration.

## Source contracts inspected on 2026-11-09

### AquaCymatics369
- Source: [src/lib/imageReconstruction.js](https://github.com/MichaelWave369/AquaCymatics369/blob/main/src/lib/imageReconstruction.js)
- Builder \`makeReconstructionReceipt\`, export \`downloadReceipt\`.
- Recognized fields: \`app: "AquaCymatics369"\`, \`version: "0.2-image-reconstruction-lane"\`, \`claimClass\`, \`renderControls\`, \`source\`, optional \`extractedMetrics\`, \`allowedClaim\`, \`blockedClaim\`.
- The inspector retains only a brief source-declared classification, selected controls and confidence (when present), and bounded claim language. No embedded image data is copied. **Simulated or inferred visualization is not experimental proof.**
- Aqua also exports PNG snapshots and keeps browser-local sessions, but **neither is an accepted HLJ file format** in this milestone.

### PHI369 Element Spiral Atlas
- Source: [src/phi369ElementSpiralAtlas.jsx](https://github.com/MichaelWave369/phi369-element-spiral-atlas/blob/main/src/phi369ElementSpiralAtlas.jsx)
- \`buildAtlasReceipt\` builds \`schema: "phi369.element_spiral_atlas.receipt.v1"\` with \`createdBy: "PHI369 Element Spiral Atlas"\`, ID prefix \`esa_v1_6_\`, payload \`version: "2.0"\`.
- \`buildResearchSnapshot\` builds \`schema: "phi369.element_spiral_atlas.research_snapshot.v1"\`, ID prefix \`note_\`.
- The Export JSON button sends a broader \`{app:"PHI369 Element Spiral Atlas",version:"2.0",selectedElement:{z,symbol,name,...},selectedZ,...}\` view payload. All node arrays, notebook content, detailed properties, and unknown fields are **discarded** by HLJ.
- The structured lab-report JSON is a separate shape and is **not supported yet**.
- Element Spiral representation geometry is not evidence of newly discovered element behavior or causal properties.

## Review gates and security
1. Require explicit user-selected .json file (max 512 KiB, strict UTF-8).
2. Parse locally, refuse unknown schema/version/identity and invalid required fields.
3. Extract only the known allowlisted summary; never render untrusted HTML or execute user source.
4. If browser supports crypto.subtle, compute SHA-256 of the exact original file bytes. Hash is a **byte fingerprint only**, not a trusted signature, authenticity proof, or validation of scientific claims.
5. Show the producer-declared claim limits, label the record unverified, require explicit approval, and allow optional *user-selected* topic association. No guessed links.
6. Keep at most 12 approved summaries in tab memory, never persist automatically. User may remove or clear; export is explicit JSON.
7. Export contains the **sanitized summaries only**, no source object, embedded image, detailed element nodes, hidden notebook, or private original payload.
8. All source-app launch links require a user click; no cross-origin request, iframe or write. Neither existing laboratory repo is modified.

## Manual acceptance required
- Inspect valid Aqua simulated and inferred JSON exports.
- Inspect Element Spiral receipts, research snapshots and full view JSON exports. Confirm an export really comes from each app's current UI.
- Reject renamed, malformed, huge, wrong-version and nested files; inspect console for errors.
- Inspect the review consent gate, optional topic selection, duplicate-file behavior, max-count limit, remove/clear operations and downloaded JSON.
- Verify keyboard flow on mobile and desktop.
- Check the source URLs still point at the intended public lab projects.
- Do not claim bidirectional interoperability or live scientific validation from a passing data-contract test.
