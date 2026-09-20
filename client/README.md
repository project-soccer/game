# Project Soccer — Client

Planned browser game client for [Project Soccer](https://github.com/project-soccer).

## Responsibility

Render the pitch and footballers, collect keyboard/gamepad input, manage camera and audio, predict local actions, reconcile authoritative updates, and present match and account interfaces.

## Boundaries

Consume declared workspace simulation and protocol dependencies from `../packages/game-core` in the same game repository. The server decides movement validity, possession, goals, and results. Do not embed financial signing keys or duplicate server authority in the client.

Human 1v1 requires team switching; future human 11v11 assigns one footballer per participant. Preserve both control models in the design.

## Status

Planning only. This module belongs to the approved `project-soccer/game` repository; the public repository exists, but no runnable game has been created. Renderer and dependency choices remain proposals in [Game Design and Architecture](../docs/game-design-and-architecture.md). Licensing is undecided.

All documentation must be written in English.
