# HLJ-003 — Interactive Knowledge Constellation

## What the drawing means

The graph contains **179 founding topics**, grouped by **nine established editorial realms**. Every topic has exactly one realm. The 179 faint lines from realm hubs to topic nodes indicate category membership only. The **14 dashed gold topic-to-topic edges** are pre-existing, specifically worded, provisional connections from \`site/data/connections.json\`, not fabricated semantic links. **10 outlined topics** have source-linked editorial starter dossiers; each pin derives from \`site/data/research.json\`. The visual distance between any two topics is arbitrary and does not establish scientific, historical or causal proximity.

## Interaction

- Search and select one of nine realms, or show only topics with linked dossiers.
- Click topic circles to select; title tooltips provide a mouse fallback.
- The **accessible topic index** mirrors the same filter and offers keyboard-operable buttons for all visible topics.
- Inspector shows specific relation notes and, for source-linked dossiers, outbound reference links and a link to the established research section.
- Use zoom in, zoom out and reset controls, or drag the background to pan. Reduced-motion accessibility preferences apply to CSS animations.
- A stable \`?topic=<topic-id>#constellation\` link opens the selected node and a \`?dossier=<topic-id>#research\` link opens its research dossier.
- Session notebook records text in JS memory only. No server collection, no automatic browser storage, no background sync. User-triggered export writes a portable JSON packet with notes, current selected topic, provisional relationships, and source metadata. On refresh or close, unsaved notes are lost.

## Limits and accessibility acceptance

This is a deterministic exploratory display, **not** network science, an automatically discovered ontology, a claim validation algorithm, medical advice, or an AI inference engine. It does not infer more relationships from spatial closeness. Note packets are user-authored, not reviewed evidence.

Use accessible list to navigate rather than requiring precise pointer input. Verify the graph on actual touch devices, with keyboard alone, browser zoom, and a screen reader before declaring full accessibility. A passing Node check does not prove the interface works on all browsers.

## Next proposals

Add opt-in import of validated note packets, an explicit source-to-claim relationship schema, manual editorial review workflow, and carefully tested PhiOS/XR navigation without duplicating the existing atlas modules.
