# Project Soccer — Client

PlayCanvas/Vite browser client for the technical laboratory, squad training and solo character study. It renders the original laboratory GLB footballers or the detailed study asset, collects keyboard/gamepad intent, predicts local movement, displays authoritative ball state, and presents private-room controls. Favicon deployment copies come from the website repository's canonical brand exports.

Use the root [setup guide](../docs/specifications/action-laboratory.md). The client connects through Vite's same-origin matchmaking/WebSocket proxy. It never authorizes goals or supplies trusted ball coordinates.

The [character study](../docs/specifications/character-motion.md) adds a CC0 graphical base, original procedural pose controller, proportional stick input and close inspection. Its renderer-side geometry tests run in Node without launching a browser.

The full match, production ball prediction, remapping interface, and final character art are not implemented. Decisions live in the [ADR index](../docs/adr/README.md). All documentation is English.
