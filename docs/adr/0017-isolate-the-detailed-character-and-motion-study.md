# ADR 0017: Isolate the detailed character and motion study

- Status: Accepted for experiment
- Date: 2026-09-21
- Scope: Game repository
- Partially supersedes: [ADR 0010](0010-use-a-shared-original-rig-and-synchronized-action-timing.md), model and rig selection for the new study only

## Context

The founder prioritizes realistic proportions, detailed characters, fluid movement and convincing ball contact before additional match rules. The original nine-joint block model cannot establish whether the intended visual quality is feasible. The immediate target is one footballer controlled with a physical Xbox Elite Series 2.

## Decision

Add a separate, single-participant character study. Keep the technical and squad laboratories as regression references. Use pinned MakeHuman graphical assets explicitly released under CC0: base mesh, morph targets, skeleton and skin weights. An original exporter produces a reproducible GLB with a simple football kit and smooth surfaces. Preserve source hashes, upstream license notices and provenance in the repository.

Drive the new skeleton with original procedural locomotion and two-bone leg placement, using travel distance for gait phase. Announce assisted touch timing from the server so the client can move a foot towards the contact. Pass and shot impulses remain authoritative. The renderer cannot move the physical ball or award possession. Shared motion rules retain local prediction and server reconciliation.

Provide analog speed control, a configurable radial dead zone and a close camera. Retain the elevated pitch camera for comparison. This is a candidate pipeline and quality proof, not selection of final art or motion capture.

## Consequences

The study makes anatomy, deformation, foot sliding and response easier to inspect. The detailed asset is lazy-loaded for this mode. The full reference skeleton is intentionally retained initially; reduce bones, materials and geometry only after profiling the eight-player case.

Procedural motion permits fast tuning but does not establish production animation quality. Dedicated receiving, planted turns, goalkeeper movement, cloth, footwear detail, facial animation and a broader character roster remain incomplete. Foot targeting is approximate and cannot guarantee contact for every moving or airborne ball. A licensed motion library or authored clips may replace parts of this controller after the founder's playtest.

No MakeHuman application code is copied. CC0 applies to the imported graphical data; it does not select a license for Project Soccer code. No asset purchase or public deployment is implied.

## Alternatives considered

Replacing every footballer immediately would mix art-pipeline risk with team AI and network behavior. Starting with a paid motion/character library before verifying raw-asset redistribution could prevent an open-source release. Keeping only the block model would not test the founder's stated quality requirement.

## Evidence

- [Pinned upstream licensing policy](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md), section C, graphical assets.
- [Official explanation of the 2020 CC0 asset transition](https://static.makehumancommunity.org/oldsite/faq/what_changed_regarding_the_license_in_2020.html).
- [Local provenance and notices](../../THIRD_PARTY_ASSETS.md).
- [Study specification and outstanding acceptance criteria](../specifications/character-motion.md).
