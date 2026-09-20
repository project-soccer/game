# Project Soccer — Game

A browser football experiment built with PlayCanvas, Rapier, TypeScript, and an authoritative Colyseus server. **This is an action laboratory, not yet a complete match.**

## Run with Docker

```sh
docker compose up --build
```

Open http://localhost:5173, enter the practice pitch, and use **Invite** to share the room with a second browser. Docker runs the toolchain and development services; your browser and gamepad remain on the host. No host Node.js installation is required.

See the [laboratory specification](docs/specifications/action-laboratory.md) for controls, checks, optional local setup, and limitations.

## Documentation

- [Project map](docs/game-design-and-architecture.md)
- [Architecture Decision Records](docs/adr/README.md)
- [First complete match](docs/specifications/first-complete-match.md)
- [Open questions](docs/open-questions.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)

## Modules

| Directory | Responsibility |
|---|---|
| [client](client/README.md) | Rendering, animation, input, local movement prediction, and HUD |
| [server](server/README.md) | Authoritative rooms, intent validation, tick loop, and snapshots |
| [packages/game-core](packages/game-core/README.md) | Shared protocol/movement and headless Rapier simulation |
| [docs](docs/README.md) | ADRs, specifications, open questions, and historical research |

The original test model has nine joints and seven clips, generated from editable source. Animation polish, actual gamepad validation, real-network quality, tactical AI, goalkeepers, complete match rules, and economic integration remain future work. Software and asset licensing remain undecided. All documentation is English.
