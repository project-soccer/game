# Project Soccer — Server

Planned authoritative backend for [Project Soccer](https://github.com/project-soccer).

## Responsibility

Host matches, validate inputs and control assignments, run physics and bots, resolve goals and results, and provide authentication, lobby, profile, and persistence services. A separate internal settlement component will connect validated results to the economic system.

## Boundaries

Consume declared workspace simulation and protocol dependencies from `../packages/game-core` in the same game repository. Keep database calls, blockchain requests, and signing outside the match tick. Separate production credentials and user data from source control. Contract implementation belongs in `contracts`.

The shared game repository permits independent client and server deployments. Begin with explicit internal boundaries and measure capacity before choosing hosting. Start locally, then test real networks on a small remote environment.

## Status

Planning only. This module belongs to the approved `project-soccer/game` repository; the public repository exists, but no service has been implemented. Hosting capacity, provider, expenditure, and licensing remain open. Refer to [Game Design and Architecture](../docs/game-design-and-architecture.md) for the canonical design.

All documentation must be written in English.
