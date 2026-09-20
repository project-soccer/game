# ADR 0015: Experiment with off-ball control and pass requests

- Status: Accepted for the laboratory experiment; final gameplay adoption is undecided
- Date: 2026-09-20
- Scope: Team-control gameplay
- Related: [ADR 0002](0002-separate-human-control-from-footballer-identity.md), [ADR 0009](0009-use-accessible-football-with-bounded-assisted-touches.md)

## Context

The founder noticed that switching away from the ball carrier allows deliberate positioning of an off-ball footballer. This may enable interesting runs and timed receptions, but may also feel awkward or become an overly effective tactic. The idea needs actual playtesting before acceptance as a permanent mechanic.

## Decision

Allow switching away from possession in the laboratory's team-control mode. An uncontrolled carrier uses ordinary assisted touches to hold the ball nearby. The human can move the selected receiver and press the existing pass button to request a ground pass from the AI carrier. The server validates possession, ownership, distance, action availability and request lifetime. The AI turns before beginning the normal pass animation and contact window.

Retain human control of the caller throughout the requested pass. Commit aim when the pass action starts; the ball then follows physical simulation and may miss or be intercepted. Repeated requests cannot stack actions. Losing possession, switching again, leaving, or explicitly clearing input cancels an uncommitted request. Never use this mechanism to command another human-controlled footballer.

The current individual-control mode does not accept AI pass requests. Any future teammate communication in human 11v11 needs a separate design; it must not override another person's control.

## Consequences

The pass button has a contextual meaning, so the interface must distinguish passing from calling for the ball. Automated tests can establish correct control and physical outcomes, but cannot establish fun, fairness or ideal response timing. The AI currently holds position rather than tactically shielding, evading or choosing its own passes. Aerial passes and overhead kicks remain outside this experiment.

Evaluate responsiveness, failed-request feedback, interception opportunities, and whether off-ball control becomes mandatory or exploitable. Keep tuning and the playtest checklist in the [off-ball specification](../specifications/off-ball-control.md). If rejected or materially redesigned, supersede this ADR.

## Alternatives considered

Preventing possession switches is simpler but removes positional control. Automatically switching back to the carrier defeats the experiment. Guaranteed delivery would remove interception and timing decisions. A dedicated call button remains an option if contextual passing proves confusing.
