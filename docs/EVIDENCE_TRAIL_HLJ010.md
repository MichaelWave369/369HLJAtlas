# HLJ-010 · The Evidence Trail

## Intent
Make research provenance easy to follow **without** inventing more assertions or adding clutter to the compact header. The trail is embedded beneath the existing Verify Claims inspector. It listens to claim selection and maps each of ten editorial claim records to their exact referenced sources, limited metadata inspections and correction history.

## Four-step documentary path
1. **Claim:** exact narrow statement, open review question, scope boundary, and original topic ID.
2. **Source roles:** reports, background, qualifies, distinct-protocol. Each link preserves the review desk's original source role and note.
3. **Audit:** title/content inspection status and observation date pulled from the HLJ-008 bibliography audit. This does not attest to a study's validity or direct claim correspondence.
4. **Corrections:** append-only title changes per source (old and new), plus any published claim-level corrections. The current claim-level correction ledger is empty; that is not a clean bill of health.

## Interoperability
Reads the existing \`site/data/verification.json\`, \`research.json\`, \`source-audit.json\`, \`source-corrections.json\`, \`corrections.json\` and \`topics.json\`. No new authority registry. Validation fails closed on unknown source IDs, unsafe URLs, forged status, orphan correction or missing inspection record.

Selecting a claim in the Verification Desk sends a same-document \`hlj:claim-selected\` event to update the panel. Each trail includes \`?claim=claim-ID#evidence-trail\` share URL, a dossier deep link \`?dossier=topic-ID#research\`, and source audit navigation \`?source=source-ID#source-audit\`. Audit links update the already loaded panel and are also direct-load shareable.

## Export and privacy
User-triggered JSON download (\`369.hlj.evidence-trail-export.v1\`), containing only public catalog metadata and review caveats. No hidden storage, third-party API calls, automatic commits, clinical recommendation, source credibility score or claim reclassification.

## Verification
Node checks cover all ten trails, source reconciliation, missing data, false status, correction matching and export. Existing Chrome interaction harness now selects a claim, verifies the trace, follows the NIST audit link and checks correct title provenance. Manual phone/screen-reader audit and actual primary-source review remain outstanding.
