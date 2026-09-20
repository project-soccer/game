# Project Soccer — Server

Colyseus/WebSocket authoritative action-laboratory rooms. The server validates bounded input intents, resolves control assignments, steps the shared Rapier simulation, and broadcasts 20 Hz snapshots from a 60 Hz tick loop.

Use the root [setup guide](../docs/specifications/action-laboratory.md). Docker keeps this service internal behind the client development proxy; local fallback binds loopback by default.

Private room links are for experiments, not a production account/security model. No database, rankings, wallets, settlement, tactical AI, or complete-match rules are implemented. Decisions live in the [ADR index](../docs/adr/README.md). All documentation is English.
