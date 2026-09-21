# Architecture Decision Records

These ADRs are the authoritative decision record. **Accepted means chosen, not implemented or validated.** Product decisions with architectural consequences are included. Operational details and tuning live in [specifications](../specifications/action-laboratory.md).

| ADR | Decision | Status | Legacy references |
|---|---|---|---|
| 0001 | [Use three repositories](0001-use-three-repositories.md) | Accepted | D33, D34, D35, D36, D37 |
| 0002 | [Separate human control from footballer identity](0002-separate-human-control-from-footballer-identity.md) | Accepted | D01, D02, D03, D04 |
| 0003 | [Use PlayCanvas and the shared TypeScript stack for the experiment](0003-use-playcanvas-and-the-shared-typescript-stack-for-the-experiment.md) | Accepted | D12, D13 |
| 0004 | [Keep gameplay authoritative on the server](0004-keep-gameplay-authoritative-on-the-server.md) | Accepted | D13, D15, D16, D19 |
| 0005 | [Validate an action laboratory before a complete match](0005-validate-an-action-laboratory-before-a-complete-match.md) | Accepted | D06, D13, D17, D18 |
| 0006 | [Start complete matches with three outfield players and an AI goalkeeper](0006-start-complete-matches-with-three-outfield-players-and-an-ai-goalkeeper.md) | Accepted | D07, D08, D10, D20 |
| 0007 | [Prioritize gamepad with keyboard support](0007-prioritize-gamepad-with-keyboard-support.md) | Accepted | D09, D40 |
| 0008 | [Use an elevated oblique sideline camera](0008-use-an-elevated-oblique-sideline-camera.md) | Accepted | D09, D39 |
| 0009 | [Use accessible football with bounded assisted touches](0009-use-accessible-football-with-bounded-assisted-touches.md) | Accepted | D08, D11, D14, D38 |
| 0010 | [Use a shared original rig and synchronized action timing](0010-use-a-shared-original-rig-and-synchronized-action-timing.md) | Accepted | D17, D31 |
| 0011 | [Separate the economic track and defer NFT strength](0011-separate-the-economic-track-and-defer-nft-strength.md) | Accepted | D05, D11, D21–D32 |
| 0012 | [Record important decisions in ADRs](0012-record-important-decisions-in-adrs.md) | Accepted | D34; documentation governance |
| 0013 | [Keep the brand master as native SVG](0013-keep-the-brand-master-as-native-svg.md) | Accepted | D31; brand format |
| 0014 | [Use Docker Compose for development](0014-use-docker-compose-for-development.md) | Accepted | Development environment |
| 0015 | [Experiment with off-ball control and pass requests](0015-experiment-with-off-ball-control-and-pass-requests.md) | Accepted for experiment | Gameplay playtest feedback |
| 0016 | [Use server-side heuristics for initial team AI](0016-use-server-side-heuristics-for-initial-team-ai.md) | Accepted for experiment | Squad-training increment |
| 0017 | [Isolate the detailed character and motion study](0017-isolate-the-detailed-character-and-motion-study.md) | Accepted for experiment | Character quality priority; partially supersedes 0010 |
| 0018 | [Use authored animation clips as the motion baseline](0018-use-authored-animation-clips-as-the-motion-baseline.md) | Accepted for experiment | Founder rejected procedural movement quality; partially supersedes 0017 |

## Lifecycle

Use [the template](template.md) for new decisions. Proposed ADRs remain proposals until accepted. Keep accepted context stable; a material change uses a new numbered ADR and adds a supersession link to the old one. Correct factual mistakes transparently. Update specifications for routine tuning without rewriting decision history.

## Unresolved decisions

The [open questions](../open-questions.md) retain deferred topics. The [archived review](../archive/design-review-2026-09-20.md) preserves every legacy D01–D40 identifier and original source assessment; it is not the current source of truth.
