# ADR 0003: Use PlayCanvas and the shared TypeScript stack for the experiment

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D12, D13

## Context

We need animated browser football, a headless authoritative simulation, and a local workflow suitable for one maintainer with Codex. The founder asked for comparison with Phaser and Three.js and then approved the recommended experiment.

## Decision

Use TypeScript, standalone PlayCanvas, Vite, Rapier 3D, Node.js 24 LTS, and Colyseus over WebSocket. Use a pnpm workspace and lockfile. Start with in-memory private rooms and a simple DOM HUD. Treat this as an experimental baseline, subject to the rig/pass/shot/two-browser gate.

## Consequences

Rapier must be integrated explicitly; do not run Ammo on the same objects. Colyseus provides room/transport services but does not establish good football prediction. Dependency versions must be pinned and verified together. Database, Redis, React menus, and paid hosting are not required for the laboratory.

## Alternatives considered

Phaser is 2D and lacks built-in 3D physics/rendering. Three.js supports animation and blending but leaves more game infrastructure to maintain. Babylon.js is a strong fallback if concrete asset/animation tooling issues justify a switch; no performance ranking has been measured.

## Evidence

- [PlayCanvas standalone](https://developer.playcanvas.com/user-manual/engine/standalone/) and [animation](https://developer.playcanvas.com/user-manual/animation/).
- [Phaser scope](https://docs.phaser.io/phaser/getting-started/what-is-phaser).
- [Three.js animation actions](https://threejs.org/docs/pages/AnimationAction.html).
- [Babylon.js capabilities](https://www.babylonjs.com/specifications/).
- [Rapier](https://rapier.rs/docs/user_guides/javascript/getting_started_js/) and [Colyseus rooms](https://docs.colyseus.io/room).
