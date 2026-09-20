# ADR 0016: Use server-side heuristics for initial team AI

- Status: Accepted for the squad-training experiment
- Date: 2026-09-20
- Scope: Initial teammate and goalkeeper behavior
- Related: [ADR 0004](0004-keep-gameplay-authoritative-on-the-server.md), [ADR 0006](0006-start-complete-matches-with-three-outfield-players-and-an-ai-goalkeeper.md), [ADR 0015](0015-experiment-with-off-ball-control-and-pass-requests.md)

## Context

The next playable increment needs eight footballers before the full match lifecycle. A solo-maintained project needs inspectable behavior that can be reproduced in headless tests and tuned from human feedback.

## Decision

Run simple positional heuristics on the authoritative server. Distinguish outfield and goalkeeper roles in the shared roster. Update positional targets at 10 Hz; use shared bounded movement and normal action/contact timing at 60 Hz. Only uncontrolled footballers receive AI inputs. Team switching cycles through outfield players; keepers remain AI-controlled.

Provide width and cover, choose one nearest outfield presser per team, and keep an AI carrier available for the human's off-ball request. A team without a connected human gets a basic advancing/shooting carrier. The keeper tracks the ball, uses a bounded swept save volume, controls low slow balls, parries faster/higher reachable balls, and distributes through normal passing.

Expose this as squad training while preserving the technical laboratory. It is an intermediate implementation of ADR 0006, not a completed match. Keep tunable distances, timings and limitations in the [squad specification](../specifications/squad-training.md).

## Consequences

Behavior is inspectable without an external model or service and can be tested alongside authoritative physics. Heuristics can be predictable and crude; they do not establish tactical quality. The current goalkeeper uses technical placeholder animation and ground control rather than a finished catching/diving system. Tactical perception timing and save collision are separate: collision is evaluated each simulation step, not only on the target-update tick.

## Alternatives considered

Stationary teammates are useful for the isolated laboratory but insufficient for squad play. Behavior trees or utility scoring can follow if heuristics become difficult to maintain. Learned or generative runtime AI adds cost and unpredictability without resolving the current movement and contact problems.
