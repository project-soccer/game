# Animation library evaluation

Reviewed: 2026-09-22. Paid prices below were observed on 2026-09-21 and have not been refreshed. Prices are observations, not purchase quotes; tax, currency and storefront may change. No paid asset has been purchased. Catalog claims are separated from hands-on evidence.

## Recommendation

The founder judged the four imported locomotion clips better but still insufficient and asked to exhaust practical free candidates before purchases. Compare the two newly integrated CMU recorded shots using **Shot animation**. Continue with a coherent free dribble/pass/receive set before buying a complete collection. A candidate must produce a convincing controllable sequence: move, turn with the ball, stop it, pass, then resume movement.

## Candidates

| Candidate | Verified catalog information | Evidence and recommendation |
|---|---|---|
| [Quaternius Universal Animation Library](https://quaternius.itch.io/universal-animation-library) | Free Standard archive; CC0; GLB and FBX; version 3.0 dated June 16, 2026. Paid Pro is listed at USD 9.99 and Source at USD 14.99. | Downloaded the free Standard archive. Adapted four clips to our detailed character and rendered them in PlayCanvas. The free archive contains 43 named clips, but the selected four are generic locomotion. The paid tiers are not a football solution merely because they contain more clips. |
| [CMU Graphics Lab — subject 10](https://mocap.cs.cmu.edu/search.php?maincat=4&subcat=7) | Recorded soccer kicks; ASF/AMC at 120 Hz. The official FAQ permits copying, modification and redistribution; the homepage prohibits direct resale of the motion data, including conversions. Not CC0. | Downloaded takes 10_01 and 10_02 directly from CMU, adapted two short excerpts to the existing model and connected them to the solo shot action. Source terms, hashes and contact annotations are retained. No dribble or receiving clip in this subset. |
| [Anderson Rohr — Free mocap pack 05: Soccer](https://andersonrohr.gumroad.com/l/mocap_pack5) | Creator lists 21 clips, including three dribbles, inside-foot/power kicks, penalties, defending and keeper saves. FBX, 60 fps, Rokoko/iClone/UE5 Manny skeleton variants. USD 0 minimum; personal/commercial projects permitted; standalone redistribution prohibited. | Promising next no-cost football contact trial. Checked the actual zero-price checkout on 2026-09-22: Gumroad requires an email. Acquisition is pending the founder’s email or own download; no personal data submitted, and no motion files downloaded. Clip cleanup/loopability and browser distribution terms still need review. Raw or converted motion files must not be committed to this public repository without suitable redistribution rights. The creator's duration text differs from third-party reporting, so duration is not used as an evaluation criterion. |
| [Adobe Mixamo](https://www.mixamo.com/) | Adobe’s [official FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) confirms free access with an Adobe ID and royalty-free use in personal/commercial projects. | Alternative free catalog; no authenticated session or motion files acquired in this task. A specific football subset has not been inspected. Project-use permission is not permission to republish raw motion files; review the exact asset terms before any public inclusion. Avoid unofficial repackaged downloads. |
| [Animo — Soccer Player](https://www.fab.com/listings/0da294b9-f3c0-4911-a08a-30b76b9fef2d?lang=en) / [AA Soccer Player Animations package](https://assetstore-fallback.unity.com/packages/3d/animations/aa-soccer-player-animations-package-237656) | Fab lists 135 motions and FBX, including left/right dribble, turns, running brakes, stops, passes and shots. The Unity listing shows USD 67.99 before tax; this is not a confirmed Fab price or proof that both storefront packages contain identical files. | Broadest football coverage in this shortlist. Fab shows 2.7/5 from only three ratings; do not treat the marketing description as a quality guarantee. Preview links are available, but the automated public-video playback attempt did not produce usable footage. No files tested. Do not buy until the exact clips and format are checked. |

## What has actually been tested

The Quaternius Standard archive includes a CC0 notice and root-motion/in-place variants. The repository retains one original root-motion GLB plus notices and checksums. The offline importer maps 50 joints to the existing 163-bone rig, corrects bind-pose limb directions, removes horizontal root travel and compensates ground height. It preserves clip durations and samples at the source 30 fps cadence. The initial shipped GLB contained four locomotion clips and the existing detailed mesh; it now also contains the two separately licensed CMU excerpts.

PlayCanvas handles interpolation, clip blending and idle/movement transitions. Screenshots establish that the resulting skeleton loads and deforms the character; they do not establish fluidity or physical controller quality. Playback pace uses provisional reference speeds and has not been calibrated as a foot-sliding guarantee.

The previous procedural study was rejected for animation and ball-control quality. Generic imported locomotion was judged better but still insufficient. The new CMU trial adds actual recorded shots, mapped to the existing authoritative contact schedule. The source has no measured ball collision markers in the imported AMC files; contact labels are provisional trajectory annotations. Static rig checks establish proximity to a stationary reachable ball, not moving-ball contact or planted feet. Passing, dribbling, receiving and goalkeeper motions still require suitable clips. The two new clips are candidates, not an accepted final set.

## Purchase checklist for a concrete candidate

- Inspect real-time front and side playback, including the support foot and body weight transfer.
- Check left/right foot variants, repeatable dribble contacts, ground pass, first touch, running stop and 90/180-degree turns.
- Verify a neutral pose, skeleton mapping, units and an export format usable without adopting another game engine.
- Identify contact frames, foot trajectories, root travel and whether clips are loops or long performances requiring editing.
- Prove that direction changes remain responsive and that timing can be reproduced on the authoritative server.
- Verify raw-asset collaboration, browser build distribution and public-repository restrictions for the exact license tier.
- Confirm the final price and founder approval before any payment.

The [Fab standard license summary](https://www.fab.com/eula) permits use in finished projects and private collaboration, but prohibits standalone asset redistribution. A public source repository and a shipped browser game must be considered separately; converting FBX to GLB does not remove licensing restrictions. The general Project Soccer code license remains unresolved.
