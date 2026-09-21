# Third-party graphical assets

## MakeHuman character base

The detailed study model uses graphical data from [MakeHuman Community](https://github.com/makehumancommunity/makehuman), pinned to commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`.

Imported data: `base.obj`, `default.mhskel`, `default_weights.mhw`, `caucasian-male-young.target` and `universal-male-young-maxmuscle-averageweight.target`. Original paths and SHA-256 hashes are recorded in [sources.json](assets/source/makehuman/sources.json).

These graphical assets are **CC0 1.0**. The upstream [licensing policy](assets/source/makehuman/LICENSE.md) explicitly separates graphical assets from AGPL application code. Both rig JSON files identify CC0; morph headers identify the CC0 release. The complete [CC0 text](assets/source/makehuman/LICENSE.ASSETS.md) is preserved locally. No MakeHuman application source code is included.

Credits: MakeHuman contributors; the rig and weight notices credit Data Collection AB, Joel Palmius and Jonas Hauquier. Attribution is retained for provenance even though CC0 does not require it.

Modifications: combine two morph targets, normalize height, retain at most four skin weights per vertex, construct a simple kit from the clothing helper surface, assign materials, create scalp and eye geometry, and export glTF. The exporter and procedural motion controller are original Project Soccer code. The exported character is `client/public/assets/footballer-detail.glb`; its metadata is the adjacent JSON file.

Upstream ethnicity and body-shape names are preserved as source filenames. They describe one temporary study model, not the intended diversity or customization limits of the game.

## Existing original assets

The earlier technical model, animation generator and brand assets are original Project Soccer work. Their presence does not imply that a general project license has been chosen. Imported CC0 graphical data retains its stated terms independently of that unresolved decision.
