# ADR 0018: Use authored animation clips as the motion baseline

- Status: Accepted for experiment
- Date: 2026-09-21
- Scope: Game repository
- Partially supersedes: [ADR 0017](0017-isolate-the-detailed-character-and-motion-study.md), procedural locomotion as the default of the solo study

## Context

The founder considers the detailed model a possible starting point but rejects the current animation and ball-control quality. The founder authorized a trial of ready-made animations and is open to a small, justified asset purchase. Automated correctness checks did not establish acceptable movement quality.

## Decision

Use existing authored clips as the baseline for the next motion trial. Retain the current detailed character. Start with four CC0 clips from Quaternius Universal Animation Library Standard v3.0: idle, walk, forward jog and sprint. This is an authored animation library; no claim that these particular clips are motion capture is made.

Adapt clips offline to the existing skeleton, convert to an in-place animated GLB, and use PlayCanvas's existing animation graph, synchronized blend tree and transitions. Keep the server responsible for actual movement and ball simulation. Preserve an explicit comparison selector for the previous procedural implementation.

Use procedural correction only where it improves contacts or adaptation of authored motion. Do not continue developing whole-body locomotion from mathematical oscillation as the main quality strategy. Football-specific clips must be evaluated as a coherent set; generic locomotion does not solve ball control.

## Consequences

The public repository can reproduce this initial comparison using CC0 source assets and an original retargeting tool. Source hashes, upstream notices and clip identities are preserved. The imported set does not contain football actions: pass, shot and tackle temporarily use the previous controller, with that limitation visible in the UI. Dribble physics is unchanged and has no imported contact clip yet.

Directional starts, stops, planted turns and ball actions remain selection/integration work. The old full-procedural quality proof is not accepted. Both approaches remain testable while choosing the next asset set.

Commercial assets may require a separate private asset workflow while code remains public. No purchase is authorized by this ADR alone: inspect the specific pack, price, required formats, intended browser distribution and license before proposing an acquisition. The founder's budget preference is still pending when this record is written.

## Alternatives considered

More procedural tuning would continue a direction the founder has rejected. Buying a large collection based only on clip count would not establish quality or compatibility. Replacing the rendering engine is unnecessary for this trial; the existing engine can play and blend skeletal clips.

## Evidence

- [Official library and license](https://quaternius.itch.io/universal-animation-library).
- [Source manifest](../../assets/source/quaternius/sources.json) and included CC0 notice.
- [Candidate evaluation](../research/animation-library-evaluation.md).
- [Current motion specification](../specifications/character-motion.md).
