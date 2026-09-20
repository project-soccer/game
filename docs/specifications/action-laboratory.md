# Action Laboratory

Status: implemented technical scenario. This page describes the original four-player practice pitch. The separate [squad-training mode](squad-training.md) adds eight footballers and initial AI. Architecture is recorded in the [ADR index](../adr/README.md); the [complete small match](first-complete-match.md) remains a later milestone.

## Start with Docker (primary path)

Prerequisites: Docker with Compose and a desktop browser. No host Node.js installation is required.

From the game repository:

```sh
docker compose up --build
```

Open http://localhost:5173. Choose **Enter the practice pitch**, then **Invite** to copy a link. Open that link in another browser/window and choose **Join pitch**. This is a private two-participant laboratory; a single participant can also practice.

The dependency container installs the locked packages into named volumes. Server and client start after installation. The browser reaches both through the same local endpoint. Only port 5173 is exposed, on host loopback. Sources are bind-mounted for reload; host node_modules are hidden by container volumes.

```sh
docker compose run --rm checks
docker compose exec server npm run test:network
docker compose --profile browser run --build --rm browser-tests
docker compose down
```

The first browser-test build downloads Chromium and system libraries; normal startup does not. Test screenshots are written under ignored `test-results/`. Keep Docker volumes between runs to avoid reinstalling dependencies. Do not use `down --volumes` unless deliberately removing those dependency caches.

After changing package manifests, update the lockfile deliberately inside the dependency container:

```sh
docker compose run --rm dependencies pnpm install --store-dir /pnpm/store --no-frozen-lockfile
docker compose up --build
```

## Optional local path

Use Node.js 24 (at least 24.13) and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
npm run dev
```

Open http://localhost:5173. Do not run local and Compose client servers on the same port simultaneously.

Local checks: `npm run typecheck`, `npm test`, `npm run build`; with the server running, `npm run test:network`. Browser smoke tests use `npm run test:browser` after installing Playwright Chromium, or with `CHROME_PATH` pointing at an existing compatible Chromium/Chrome executable. The Docker browser-test path avoids host tooling.

## Implemented scope

- Standalone PlayCanvas pitch, sideline camera, lighting, ball, and original skinned humanoid GLB.
- Four outfield test footballers: one human-controlled footballer and one waiting target teammate per team. This is not the future eight-footballer match.
- Rapier server-side ball simulation; shared bounded movement; standing-tackle/pass/shot action phases.
- Two-participant private Colyseus rooms; intent validation, sequence/assignment checks, queue/rate bounds, input timeout, server snapshots, local movement prediction and reconciliation.
- Ground passing, charge/release shooting, sprint, manual switching, and recipient handoff after a pass contact in team mode.
- [Off-ball control experiment](off-ball-control.md): switch away from possession, position the receiver, and request a physical ground pass from the AI carrier while retaining receiver control.
- Original idle/run/sprint/pass/shot/tackle/receive animation clips; no third-party model or motion files.
- A shot counter and automatic exercise reset on an out-of-bounds ball. These are laboratory conveniences, not complete match rules.
- A core `individual` control mode that prohibits switching, checked programmatically; the current user interface starts team-control rooms.

## Controls

| Action | Keyboard | Standard mapped gamepad |
|---|---|---|
| Move/aim | WASD | Left stick |
| Sprint | Shift | Right trigger |
| Ground pass / call for a pass | J | South / A |
| Charge then shoot | Hold/release K | Hold/release east / B |
| Standing tackle | L | West / X |
| Switch outfield footballer | Q | Left bumper |
| Reset exercise | R or interface button | Interface button |

Movement is relative to the fixed sideline camera axes. At neutral input, aim uses facing. A pass can choose a nearby teammate in the forward cone, but the ball then travels freely. Input loss cancels an uncommitted shot charge. The keyboard and standard Gamepad API path are implemented; physical controller compatibility still needs human validation. Remapping UI is not implemented.

## Initial parameters

Simulation: 60 Hz. Snapshots: 20 Hz. Ground pitch: 40 × 26 m. Ball radius: 0.11 m. Run/sprint targets: 4.8/7 m/s. Acceleration: 22 m/s². Contact after action start: pass 10 ticks, shot 14 ticks, tackle 8 ticks. These are implementation tuning values, not additional ADRs or measured optimal settings.

## Known limits

The original model and clips are deliberately simple technical assets. They do not establish production animation quality, realistic foot planting, or physical skeletal collision. The server uses reachable action volumes; exact foot/ball alignment still needs visual tuning.

Only local movement is predicted. Ball presentation uses server snapshots; full ball prediction, advanced lag compensation, and complete world replay are not implemented. Corrections under real latency and packet loss remain unmeasured. Waiting target teammates do not implement tactical AI. Goalkeepers, complete match clock, restarts, possession fouls, first-time passes, advanced shot control, reconnect recovery, ranking, wallets, and payouts are absent.

A departing participant leaves the room available for a replacement during this laboratory. This is not a ranked abandonment policy. No account system or financial trust is implied by a room link. The loopback Docker configuration is for local development; a public deployment requires a separate decision.

## Asset generation

`npm run assets:player` regenerates `client/public/assets/footballer.glb` from the original editable generator in `scripts/build-player.mjs`. The rig has nine joints and seven animation clips. No downloaded motion library is embedded. General software and asset licensing is still pending.

## Verification

Verified on 2026-09-20 through Docker Compose: TypeScript checks, 21 simulation tests, production client build, the two-client network smoke test, and two isolated Chromium contexts including skeletal locomotion and off-ball control. The rendered pitch and off-ball HUD screenshots were inspected. No host application automation is needed for this workflow. The build still reports a large client bundle and browser-externalized Node worker imports in optional PlayCanvas parsers; production bundle optimization remains open.

- Simulation tests cover malformed/non-finite inputs, bounded movement despite bursts, exactly one scheduled pass contact, stale assignment rejection, lost-ball misses, individual-mode switching, timeout, whole-ball goals, and repeated resets.
- Off-ball simulation tests cover backward passes, interceptions, missed moving receivers, request expiry and cancellation, reset, and prohibiting control of another human.
- Network smoke tests use two independent SDK clients and check shared movement/events, capacity, malformed inputs, switching, reset, AI pass requests and controlled reception.
- Browser smoke tests open two isolated browser contexts, load the rigged pitch, move via keyboard, observe the same charged shot, then switch, run off the ball, call for a pass and receive while retaining control. Screenshots support visual inspection.

Automated checks are not gameplay approval. Actual gamepads, multiple browser engines, non-local network conditions, eight/22-footballer load, and animation quality require further testing.
