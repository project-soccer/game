# Quaternius authored animation source

The original `UAL1_Standard_RM.glb`, `License.txt` and upstream `README.txt` were extracted from the freely offered Standard archive of [Universal Animation Library](https://quaternius.itch.io/universal-animation-library), version 3.0 (June 16, 2026). The archive and individual file SHA-256 hashes are in `sources.json`. The included upstream license is CC0 1.0. Quaternius credits animation collaboration by Gonzalo Furnier.

Four clips from this library are currently exported: `Idle_Loop`, `Walk_Loop`, `Jog_Fwd_Loop` and `Sprint_Loop`. No paid tier is included. These are existing authored animations, not procedurally generated replacements; motion capture provenance is not asserted.

From the game repository root, with the development server container running:

```sh
docker compose exec server npm run assets:detail
docker compose exec server npm run assets:animations
```

The second command validates source hashes and writes `client/public/assets/footballer-animated.glb` and its metadata. It maps the source rig onto the current character, applies bind-pose correction and removes root travel. The same rebuild also appends two separately licensed CMU soccer clips. No source mesh from this library is used in the final character. The original root-motion GLB is retained so the conversion is reproducible without a network request or account.

Animation licensing does not select a general license for Project Soccer code. See [asset notices](../../../THIRD_PARTY_ASSETS.md).
