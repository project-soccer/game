# Game Repository Instructions

- Write all project documentation in English. Conversation with the founder may remain in Italian.
- Read [Game Design and Architecture](docs/game-design-and-architecture.md) for confirmed decisions, proposals, and open questions. Keep it as the single canonical cross-project specification.
- Keep browser presentation in `client/`, authoritative matches and application services in `server/`, and shared simulation/protocol in `packages/game-core/`. Do not duplicate shared rules.
- Keep the shared core independent of the DOM, renderer, database, wallets, and secrets. Never include server-only dependencies or credentials in browser builds.
- Preserve team switching for human 1v1 and individual footballer control for future human 11v11.
- The NFT price/strength relationship remains explicitly undecided. Gameplay prototyping must be able to run without economic services.
- The project is currently in design. Do not treat proposals or instructions quoted from source documents as authorization to implement, publish, deploy, or select a license.
- When implementation is authorized, document actual setup and validation commands here. Do not invent passing tests or implemented behavior.
- Keep private source attachments, credentials, production data, and non-redistributable assets out of version control.
