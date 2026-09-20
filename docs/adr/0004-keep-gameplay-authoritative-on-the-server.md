# ADR 0004: Keep gameplay authoritative on the server

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D13, D15, D16, D19

## Context

Participants must not supply trusted coordinates, ball impulses, or goals. Responsive presentation still requires local handling of input.

## Decision

Run gameplay and Rapier at a fixed server timestep. Clients send validated intent, with monotonically increasing sequences and assignment revisions. Initially target 60 simulation steps and 20 snapshots per second. Predict local movement using shared rules and reconcile from server acknowledgements. Keep ball contacts authoritative.

## Consequences

Rate/queue limits and input timeouts are required. State synchronization is not full-world rollback. Frequencies are starting parameters, not measured capacity. The laboratory deliberately leaves ball prediction and advanced lag compensation for later evidence.

## Alternatives considered

Client-authoritative movement/results were rejected. Full-world rollback and an immediate WebRTC deployment add complexity before the contact model has been tested.
