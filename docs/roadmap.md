# Development Roadmap

Updated: 2026-09-20. Status describes implementation, not final gameplay approval. Each increment must remain playable and retain its relevant automated checks. Architectural decisions belong in [ADRs](adr/README.md).

| Stage | Deliverable | Status / exit criteria |
|---|---|---|
| 1. Action laboratory | Shared ball, movement, pass, shot, tackle, animation, two participants | Implemented; human tuning continues |
| 2. Off-ball experiment | Switch away from possession and request an AI pass | Implemented; fun, fairness and timing remain under evaluation |
| 3. Squad training | Three outfield players and one keeper per team; support, cover, pressure, initial saves and distribution | Implemented as a separate practice mode; human playtests pending |
| 4. Complete match lifecycle | Four-minute authoritative clock, kickoff, goals, touchline and goal-line restarts, completion, mutual rematch | **Next implementation increment**; repeated sessions must complete without manual resets |
| 5. Gameplay and animation pass | First touch, reception, assisted aim, keeper catch/parry animations, foot contact and camera tuning | Follow squad/match playtests; assess off-ball control before retaining or redesigning it |
| 6. Multiplayer validation | Real latency/loss, reconnect/abandonment behavior, browser/gamepad coverage, performance baseline | Measure on named hardware and real networks; local tests are insufficient |
| 7. Community playtest | Contribution/license decisions, deployment scope, feedback and operating costs | Requires those decisions; no public service deployment yet |

The complete-match target remains two human participants, each managing three outfield players and an AI keeper. See [match scope](specifications/first-complete-match.md). Human 11v11, aerial actions, advanced tactics, accounts/ranking and economic integration are later tracks, not hidden requirements of the first match.

Blockchain and real-money work remains independent. NFT strength, the business model and project licensing are unresolved in [open questions](open-questions.md).

## Current playtest

Open **Train with 3 + keeper**. Check whether teammates create useful passing options, whether only one footballer pressing feels readable, and whether keeper saves look plausible with the temporary rig. Compare with **Enter the practice pitch**, which preserves the original four-player laboratory. Record observed problems before adding more AI complexity.
