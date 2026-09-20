# Project Soccer — Client

PlayCanvas/Vite browser client for the technical laboratory and squad training. It renders the original GLB footballers, collects keyboard/gamepad intent, predicts local movement, displays authoritative ball state, and presents private-room controls. Favicon deployment copies come from the website repository's canonical brand exports.

Use the root [setup guide](../docs/specifications/action-laboratory.md). The client connects through Vite's same-origin matchmaking/WebSocket proxy. It never authorizes goals or supplies trusted ball coordinates.

The full match, production ball prediction, remapping interface, and final character art are not implemented. Decisions live in the [ADR index](../docs/adr/README.md). All documentation is English.
