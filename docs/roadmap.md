# Development Roadmap

Updated: 2026-09-20. Status describes implementation, not final gameplay approval. Each increment must remain playable and retain its relevant automated checks. Architectural decisions belong in [ADRs](adr/README.md).

| Stage | Deliverable | Status / exit criteria |
|---|---|---|
| 1. Action laboratory | Shared ball, movement, pass, shot, tackle, animation, two participants | Implemented; human tuning continues |
| 2. Off-ball experiment | Switch away from possession and request an AI pass | Implemented; fun, fairness and timing remain under evaluation |
| 3. Squad training | Three outfield players and one keeper per team; support, cover, pressure, initial saves and distribution | Implemented as a separate practice mode; human playtests pending |
| 4. Character and movement quality proof | One detailed realistically proportioned footballer; pad response, locomotion transitions, foot contact, dribbling and reception | **Current priority**, ahead of further match rules; founder must assess appearance and feel on a physical controller |
| 5. Complete match lifecycle | Four-minute authoritative clock, kickoff, goals, touchline and goal-line restarts, completion, mutual rematch | Deferred until the character/movement proof is assessed; repeated sessions must complete without manual resets |
| 6. Multiplayer validation | Real latency/loss, reconnect/abandonment behavior, browser/gamepad coverage, performance baseline | Measure on named hardware and real networks; local tests are insufficient |
| 7. Community playtest | Contribution/license decisions, deployment scope, feedback and operating costs | Requires those decisions; no public service deployment yet |

The complete-match target remains two human participants, each managing three outfield players and an AI keeper. See [match scope](specifications/first-complete-match.md). Human 11v11, aerial actions, advanced tactics, accounts/ranking and economic integration are later tracks, not hidden requirements of the first match.

Blockchain and real-money work remains independent. NFT strength, the business model and project licensing are unresolved in [open questions](open-questions.md).

## Current quality proof

The founder has prioritized appearance, fluid movement and believable ball interaction before further match rules. The block-shaped nine-joint prototype is not the intended art direction. Target a detailed, realistically proportioned footballer without the current visibly faceted appearance.

Start with one footballer on the technical pitch. Evaluate a suitable model, skeleton and animation source together; verify redistribution terms before placing external assets in the public repository. No asset purchase, provider or final rig has been selected. Validate starts, stops, turning and slow movement with an Xbox Elite Series 2, then coordinate foot placement and touch timing with the authoritative ball simulation. A more detailed mesh alone does not meet this milestone.

Acceptance requires the founder's hands-on assessment, readable contacts without obvious foot sliding, responsive analog control and measured browser performance on the target Mac. Follow a successful one-character proof with the eight-player scene before claiming scalable visual quality. Do not promise a frame-rate or asset-quality target without measuring it. Keeper animation polish follows the outfield baseline.

Both existing practice modes remain available as references. Off-ball control is still experimental. Full-match rules resume after this quality assessment; the priority change does not reject their agreed scope.
