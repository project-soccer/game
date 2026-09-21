# Project Soccer — Game

A browser football experiment built with PlayCanvas, Rapier, TypeScript, and an authoritative Colyseus server. **Squad training and an action laboratory are available; character and movement quality are the current priority.**

## Run with Docker

```sh
docker compose up --build
```

Open http://localhost:5173, enter the practice pitch, and use **Invite** to share the room with a second browser. Docker runs the toolchain and development services; your browser and gamepad remain on the host. No host Node.js installation is required.

See the [laboratory specification](docs/specifications/action-laboratory.md) for controls, checks, optional local setup, and limitations.

Choose **Character & movement study** for the new [solo quality proof](docs/specifications/character-motion.md): a detailed footballer, imported CC0 locomotion with a selector for the previous procedural version, proportional stick movement, adjustable dead zone and close inspection camera. This is the current priority; the previous animation and ball-control quality were rejected, and this new locomotion comparison awaits hands-on review.

Choose **Train with 3 + keeper** for the new [eight-player training mode](docs/specifications/squad-training.md), with initial support/pressure AI and keeper control, parries and distribution. The original practice pitch remains available for isolated action tests.

Try the [off-ball control experiment](docs/specifications/off-ball-control.md): Q / LB switches away from possession; move your receiver and press J / A to request a ground pass from the AI carrier. The pass can miss or be intercepted. This mechanic is provisional and needs gameplay feedback.

## Documentation

- [Development roadmap](docs/roadmap.md)
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

The original laboratories use a nine-joint test model. The new solo study uses a detailed CC0 graphical base with imported authored locomotion and a temporary procedural football-action fallback; see [asset notices](THIRD_PARTY_ASSETS.md). Animation polish, actual gamepad validation, real-network quality, improved tactics/keeper behavior, complete match rules, and economic integration remain future work. The general project license remains undecided. All documentation is English.
