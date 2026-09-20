# Project Soccer — Game Core

Shared TypeScript protocol, role-based rosters, validated intents, movement, control-assignment types, server-side squad heuristics, and headless Rapier simulation for both practice scenarios.

The default export path contains browser-safe protocol/movement utilities. The `/simulation` entry point owns the authoritative physics world. Keep this package independent of PlayCanvas, DOM, hosting, database, and wallet APIs.

The laboratory implements bounded touches and scheduled action contacts, not final football rules or a deterministic replay guarantee. See [current scope](../../docs/specifications/action-laboratory.md) and [ADRs](../../docs/adr/README.md). All documentation is English.
