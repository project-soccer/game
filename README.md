# Project Soccer — Game

The approved home for the browser client, authoritative server, shared simulation, and canonical documentation of [Project Soccer](https://github.com/project-soccer).

## Modules

| Directory | Responsibility |
|---|---|
| [client](client/README.md) | Browser input, graphics, audio, camera, prediction, and match interfaces |
| [server](server/README.md) | Authoritative matches, bots, application services, persistence, and settlement integration |
| [packages/game-core](packages/game-core/README.md) | Shared simulation, control assignments, and network protocol |
| [docs](docs/README.md) | Canonical design, decisions, roadmap, and contribution planning |

Client, server, and shared-core changes can be reviewed together in one commit. Separate build targets and dependency boundaries must keep server-only code out of the browser. The public website and blockchain contracts belong to separate repositories.

## Start here

Read [Game Design and Architecture](docs/game-design-and-architecture.md), [Contribution Planning](docs/CONTRIBUTING.md), and [Agent Instructions](AGENTS.md).

## Status

Planning scaffold for the public [project-soccer/game](https://github.com/project-soccer/game) repository, created with the founder’s authorization on 2026-09-20. Git operations use SSH. No runnable game or build/test commands exist yet. Technical choices remain proposals where marked in the design; licensing remains open. All documentation must be in English.
