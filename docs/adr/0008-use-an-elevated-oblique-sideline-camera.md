# ADR 0008: Use an elevated oblique sideline camera

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D09, D39

## Context

Players need to read nearby passing lanes and the ball while switching footballers.

## Decision

Use an elevated oblique sideline camera following the action. Start with fixed yaw, smoothed position, restrained perspective, and framing around the controlled footballer and ball. Avoid rotations on control handoff.

## Consequences

Tune height and framing on reference displays. Individual 11v11 off-ball play requires a later camera review. The chosen view does not establish final zoom values.

## Alternatives considered

Behind-player immersion was not prioritized. A near-vertical tactical view can be revisited if oblique framing harms readability.
