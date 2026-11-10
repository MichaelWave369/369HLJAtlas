# HLJ-008 · First bibliography audit (2026-11-09)

A bounded review of **19 existing Atlas references** found **16 with indexed primary-host or publisher page content that could be inspected** and **three not inspected**: `nist-time`, `mathworld-solids`, and `homeopathy-nccih`.

**This is not a real-time HTTP uptime test, a scientific review, full source-to-claim check, retraction search, or medical efficacy audit.** All 19 source entries retain `retractionCheck: not-checked` and `claimEvidenceCheck: not-independently-verified`. Even reviewed pages can later change or be corrected.

## Five actual bibliography corrections

See `site/data/source-corrections.json` for previous titles, replacement titles, evidence URLs and reasons. Changes cover the real NIST page title, two complete breathing-study titles, and two psi-study titles. In particular, the Royal Society Open Science paper about the Transparent Psi Project is a study of a **different experimental protocol** from the Ganzfeld literature. It must not be framed as a direct replication.

The source data titles in `site/data/research.json` are corrected, but existing scientific claim classifications, topic statuses, and the original `site/data/corrections.json` claim-correction ledger remain unchanged. Bibliography metadata corrections are a distinct history and do not raise evidence status.

## What a full audit still requires

1. Verify the exact source's metadata and full primary content, not just its indexed overview.
2. Search DOI/publisher notices, corrections and retractions using up-to-date authoritative records, and note the check date.
3. Evaluate each claim's operational definition, methods, sample and alternative explanations against the source.
4. Compare disagreement with independent investigations rather than accepting source count as proof.
5. Preserve a human-reviewed, evidence-linked correction PR when changing published claims.

## Browser interaction gate

The CI browser gate additionally runs a same-origin isolated test harness that clicks the real review worksheet and Living Lab, checks required input gates, and verifies at least one capture/clear cycle. This is a smoke test, not cross-browser, screen-reader, Quest or touch qualification.
