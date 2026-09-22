# Development Roadmap

Updated: 2026-09-22. Status describes implementation, not final gameplay approval. Each increment must remain playable and retain its relevant automated checks. Architectural decisions belong in [ADRs](adr/README.md).

| Stage | Deliverable | Status / exit criteria |
|---|---|---|
| 1. Action laboratory | Shared ball, movement, pass, shot, tackle, animation, two participants | Implemented; human tuning continues |
| 2. Off-ball experiment | Switch away from possession and request an AI pass | Implemented; fun, fairness and timing remain under evaluation |
| 3. Squad training | Three outfield players and one keeper per team; support, cover, pressure, initial saves and distribution | Implemented as a separate practice mode; human playtests pending |
| 4. Character and movement quality proof | One detailed realistically proportioned footballer; pad response, locomotion transitions, foot contact, dribbling and reception | **Current priority**; [solo study](specifications/character-motion.md) implemented as a candidate; initial procedural quality rejected; authored locomotion improved but still insufficient; two recorded shot candidates and panelled physical ball implemented; football contact quality remains open |
| 5. Complete match lifecycle | Four-minute authoritative clock, kickoff, goals, touchline and goal-line restarts, completion, mutual rematch | Deferred until the character/movement proof is assessed; repeated sessions must complete without manual resets |
| 6. Multiplayer validation | Real latency/loss, reconnect/abandonment behavior, browser/gamepad coverage, performance baseline | Measure on named hardware and real networks; local tests are insufficient |
| 7. Community playtest | Contribution/license decisions, deployment scope, feedback and operating costs | Requires those decisions; no public service deployment yet |

The complete-match target remains two human participants, each managing three outfield players and an AI keeper. See [match scope](specifications/first-complete-match.md). Human 11v11, aerial actions, advanced tactics, accounts/ranking and economic integration are later tracks, not hidden requirements of the first match.

Blockchain and real-money work remains independent. NFT strength, the business model and project licensing are unresolved in [open questions](open-questions.md).

## Current quality proof

The founder has prioritized appearance, fluid movement and believable ball interaction before further match rules. The block-shaped nine-joint prototype is not the intended art direction. Target a detailed, realistically proportioned footballer without the current visibly faceted appearance.

The separate solo study uses pinned CC0 MakeHuman graphical data and a detailed generated kit model. After the founder rejected procedural movement and ball control, its default locomotion changed to four imported CC0 Quaternius clips, with the previous version retained as a comparison. [ADR 0018](adr/0018-use-authored-animation-clips-as-the-motion-baseline.md) records this change. [ADR 0017](adr/0017-isolate-the-detailed-character-and-motion-study.md) records the experimental pipeline. Analog starts, stops, turning, close inspection and announced dribble touches are implemented. Physical Xbox Elite Series 2 validation, dedicated receiving and production motion quality remain open. The founder is open to a small justified purchase; [candidate research](research/animation-library-evaluation.md) is recorded, but no paid asset or final rig has been selected. The founder asked to continue evaluating free options before buying. Two CMU recorded kicks can now be compared on shots, while passing, dribbling and reception still lack dedicated clips. The ball now has spherical panels and replicated physical orientation. A more detailed mesh alone does not meet this milestone.

Acceptance requires the founder's hands-on assessment, readable contacts without obvious foot sliding, responsive analog control and measured browser performance on the target Mac. Follow a successful one-character proof with the eight-player scene before claiming scalable visual quality. Do not promise a frame-rate or asset-quality target without measuring it. Keeper animation polish follows the outfield baseline.

Both existing practice modes remain available as references. Off-ball control is still experimental. Full-match rules resume after this quality assessment; the priority change does not reject their agreed scope.
