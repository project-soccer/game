# ADR 0014: Use Docker Compose for development

- Status: Accepted
- Date: 2026-09-20
- Scope: Game development environment
- Supersedes: No previous environment ADR

## Context

The founder wants reproducible tooling without installing the game toolchain and dependencies globally on each contributor's computer. Docker is available on the development machine.

## Decision

Use Docker Compose as the primary development path. Run dependency installation, the Node.js server, the Vite development server, and checks inside containers. Keep the browser and gamepad on the host. Keep an optional local Node.js 24/pnpm path for contributors who prefer it.

Bind-mount Git sources and keep each workspace's node_modules in named Docker volumes. Use the committed lockfile. Expose only the Vite endpoint on host loopback; proxy matchmaking and WebSocket traffic internally to the server. Do not require database or blockchain containers for the laboratory.

## Consequences

The host needs Docker and a browser, not a project-specific global Node toolchain. Linux dependencies are isolated from macOS dependencies. File synchronization and Docker memory have a cost. Dependency installation must complete before the development services start. The optional browser-test image is heavier and is built only when requested.

This is a development environment, not a production deployment recipe. Git remains a host workflow; do not mount SSH private keys or the Docker socket into the game containers.

## Alternatives considered

Host-only tooling is simpler but less isolated. Docker only for databases does not meet the preferred toolchain isolation. Running the interactive browser in Docker would complicate gamepad access and misrepresent the user's normal browser experience.
