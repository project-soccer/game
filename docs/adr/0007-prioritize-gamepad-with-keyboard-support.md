# ADR 0007: Prioritize gamepad with keyboard support

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D09, D40

## Context

Analog direction suits accessible football aiming, but desktop browser users also need keyboard access.

## Decision

Make the desktop prototype gamepad-first with keyboard support. Both devices use the same legal intent model. Start with movement, sprint, pass, shot, tackle, and switch bindings documented in the laboratory specification.

## Consequences

Test actual gamepad mapping and dead zones. Normalize keyboard diagonals and clear held actions on focus/device loss. Exact remapping UI and device coverage are later work; do not promise every controller has been tested.

## Alternatives considered

Mouse-directed aiming was not selected. Touch controls need a separate design and are deferred.
