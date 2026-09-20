# Project Soccer — Game Core

Planned shared simulation and protocol for [Project Soccer](https://github.com/project-soccer).

## Responsibility

Own shared movement and action rules, simulation state, footballer control assignments, protocol schemas, and reproducibility/compatibility fixtures. Provide a common basis for authoritative server execution and provisional client prediction.

## Boundaries

Keep the core independent of the renderer, DOM, database, hosting provider, wallet signing, and secrets. Shared code does not give the client authority over outcomes.

This module may expose separate simulation and protocol entry points so consumers load only what they need. Client and server consume declared workspace dependencies from the same game checkout. Deployed releases must still use compatible protocol/rules versions. Registry publication is not initially required.

## Status

Planning only. This module belongs to the approved `project-soccer/game` repository under `packages/game-core/`. The public game repository exists; package implementation and registry publication have not started, and no license has been selected. Exact package names and release workflow remain open.

The canonical design is [Game Design and Architecture](../../docs/game-design-and-architecture.md). All documentation must be written in English.
