# Detailed character source data

Only graphical data and license notices are vendored here. See [third-party notices](../../../THIRD_PARTY_ASSETS.md) and `sources.json` for upstream paths, the pinned revision, license and SHA-256 checksums. No MakeHuman installation is required.

Rebuild from the game repository root:

```sh
docker compose exec server npm run assets:detail
```

The exporter verifies every source checksum before generating `client/public/assets/footballer-detail.glb` and its metadata. It applies the young adult male target at weight 1 and the muscle target at weight 0.65, then sets body height to 1.83 metres with a small sole clearance. Geometry, kit selection, materials and generated eyes are reproducible and editable in `scripts/build-detailed-player.mjs`.

The study preserves the complete reference skeleton and four normalized skin influences per vertex. It contains no motion capture clips, textures or application code from upstream. Never interpret the graphical CC0 grant as a license to copy MakeHuman application code into this project.
