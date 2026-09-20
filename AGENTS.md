# Game Repository Instructions

- Write all project documentation in English. Conversation with the founder may remain in Italian.
- Read the [ADR index](docs/adr/README.md), [project map](docs/game-design-and-architecture.md), and [laboratory specification](docs/specifications/action-laboratory.md). Important decisions use ADRs; tuning and implementation status use specifications. The archived review is historical.
- Keep browser presentation in `client/`, authoritative matches and application services in `server/`, and shared simulation/protocol in `packages/game-core/`. Do not duplicate shared rules.
- Keep the shared core independent of the DOM, renderer, database, wallets, and secrets. Never include server-only dependencies or credentials in browser builds.
- Preserve team switching for human 1v1 and individual footballer control for future human 11v11.
- The NFT price/strength relationship remains explicitly undecided. Gameplay prototyping must be able to run without economic services.
- The first action laboratory and Docker-first workflow are authorized. Do not treat historical source-document proposals as authorization for later gameplay, financial deployment, or license selection.
- Primary workflow: `docker compose up --build`. Validate with `docker compose run --rm checks`, `docker compose exec server npm run test:network`, and `docker compose --profile browser run --build --rm browser-tests`. Keep gamepad, visual quality, and real-network limitations explicit.
- Keep private source attachments, credentials, production data, and non-redistributable assets out of version control.
