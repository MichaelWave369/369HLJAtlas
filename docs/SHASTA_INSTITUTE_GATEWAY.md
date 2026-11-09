# HLJ-005 · PhiOS + Shasta Institute vision gateway

## Status
This milestone is an **interactive desktop/mobile education preview and file-compatible passive XR scene exporter**, not a physical site or validated live headset installation. It introduces no land, building, architecture, environmental, engineering or special-use claims.

## Six-stop visitor journey
The Open Door, Geometry Garden, Resonance Studio, Evidence Library, Consciousness Observatory and Joy Commons. These are conceptual themes, not actual floor coordinates. The tour is keyboard-operable in a normal browser and all stations link to existing Atlas topic identifiers and page sections. There is no geolocation or visitor analytics.

## Source-confirmed public gateways (snapshot 2026-11-09)
- [PhiOS Web](https://phi-field.com/os/), described as a public web launch route in the PhiOS-Mobile repo; not independently live-certified by HLJ.
- [PhiOS Mobile](https://michaelwave369.github.io/PhiOS-Mobile/), browser/PWA preview, not Android firmware.
- [PhiOS XR](https://michaelwave369.github.io/PhiOS-XR/), experimental spatial shell with opt-in local scene import; physical Quest validation remains pending.
- [PhiXRCommons](https://michaelwave369.github.io/PhiXRCommons/), developer of read-only scene interchange contract.

Each opens in a distinct browser context after a user click. A link is not evidence of a native runtime dependency or automatic session transfer.

## Actual interoperability contract
- Read [PhiOS XR \`src/spatial-scene.ts\`](https://github.com/MichaelWave369/PhiOS-XR/blob/main/src/spatial-scene.ts) and [PhiXRCommons \`scene-interchange.js\`](https://github.com/MichaelWave369/PhiXRCommons/blob/main/src/spacedynamics/scene-interchange.js) at review time.
- Root keys exactly \`schema\`, \`truth\`, \`creator\`, \`title\`, \`coordinateFrame\`, \`nodes\`.
- \`schema: "phi.spatial.scene.v1"\`; \`truth: "UNVERIFIED_VISUALIZATION_ONLY"\`; right-handed, Y-up, meter, illustrative-local frame.
- 9 purely decorative realm spheres and 10 synthetic, indexed research markers. **19 static nodes**, all within bounds; no personal data, receipts, hypotheses, figures or real-world location embedded.
- Evidence marker metadata is \`synthetic\` with unit \`index\`; values are visual ordering only, **not a measured field or scientific confidence score**.
- Source declarations and method notes are unverified, as required by the upstream consumer. No physics force, collision, route, object activation, self-tracking, XR permissions, portalling, iframe or automatic browser-to-browser transfer.
- \`site/institute-scene.mjs\` locally checks the critical upstream schema requirements and enforces the 96 KB ceiling. **Its tests are contract mirrors, not an actual downstream integration test**.
- User must click **Export passive XR scene JSON**, then navigate to PhiOS XR's 2D ΦSpatial Scene Bridge and manually choose/preview/confirm the file. Existing PhiOS XR's XR Worlds hologram is noninteractive and hidden in MR, per its own documented R7 behavior.

## Manual acceptance
1. Use desktop and a narrow mobile viewport to select the six stops by mouse/touch and keyboard.
2. Export JSON, inspect it with an independent JSON parser, and ensure only 19 illustrative nodes.
3. Import file into PhiOS XR, use explicit preview and confirmation before display. Confirm it renders as passive ghosts in Worlds desktop mode.
4. On a real Quest 3, evaluate stationary readability, comfort, frame rate, camera tracking, XR World/MR visibility and manual file selection. CI green is **not** Quest qualification.
5. Confirm no network upload or hidden storage occurs; view the file in a text editor to check it contains no private data.
6. Check platform destinations are currently live and correctly labeled before announcing full release.

## Deferred
No model-based automatic ontology, claims of scientifically measured spiritual fields, live device input, embodied companion, XR locomotion, cross-origin storage, platform installs or physical construction stage.
