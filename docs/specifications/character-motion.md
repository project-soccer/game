# Character and movement study

Updated: 2026-09-21. Status: the founder rejected the initial procedural animation and ball-control quality. A new authored-locomotion comparison is implemented, pending hands-on review. See [ADR 0018](../adr/0018-use-authored-animation-clips-as-the-motion-baseline.md).

## Purpose and entry

Open http://localhost:5173 and choose **Character & movement study**. This creates a solo server-authoritative room with one detailed footballer and a physical ball. The technical and eight-player squad modes retain the previous model for regression comparison. Reload the page to choose another mode.

The study checks the art pipeline and movement feel before complete-match rules. It does not constitute acceptance of final visual quality.

## Controls

| Input | Effect |
|---|---|
| Left stick | Proportional walking and running; full deflection reaches 4.8 m/s |
| RT + left stick | Sprint, up to 7 m/s |
| A | Ground pass in the facing direction; there is no teammate in this solo study |
| Hold B, release B | Charge and shoot |
| X | Standing tackle action |
| WASD, Shift, J, K, L | Keyboard equivalents |
| **Movement animation** | Compare ready-made clips (default) with the previous procedural version |
| V or **Close / pitch view** | Toggle close inspection and the elevated pitch camera |
| R or **Reset the exercise** | Return the footballer and ball to their starting positions |
| **Stick dead zone** | Set radial drift filtering from 5% to 30%; initial value 14% |

LB / Q has no switching effect in the solo study. It retains the existing switching behavior in the other laboratories. Click the page and press a gamepad button if the browser has not yet exposed the controller. The controller must report the standard Gamepad API mapping. Browser focus loss, hidden pages and disconnection clear input.

The on-screen readout shows filtered stick magnitude, current motion state and speed. The dead zone is a session setting, not saved calibration. Stick directions currently follow pitch axes, including in close view; camera-relative steering and controller remapping are not implemented. Keyboard movement uses full directional input and cannot reproduce small stick deflections.

## Character and animation

The generated model contains **23,480 triangles and 163 bones**, with smooth normals, anatomical face/hands, a simple kit, socks, footwear and short scalp hair. The GLB is approximately 0.9 MB, with uncompressed geometry and plain materials. There are no photographic skin or cloth textures. See [asset provenance](../../THIRD_PARTY_ASSETS.md) and the [source rebuild instructions](../../assets/source/makehuman/README.md).

Default locomotion now plays four authored CC0 Quaternius clips: idle, walk, jog and sprint. An offline converter adapts 50 source joints to the existing rig, corrects the bind pose, removes horizontal root travel and adjusts ground height. PlayCanvas blends synchronized movement clips and transitions to/from idle over 0.18 seconds. Reference blend speeds are provisional (1.4, 4.8 and 7 m/s). The library is not represented as motion capture or a football-specific solution.

The **Previous procedural version** selector preserves the earlier experiment for comparison. Pass, shot and tackle still temporarily invoke that controller even with imported locomotion selected. The panel identifies that fallback. Imported mode has no dribble-contact or trap clip yet. Shared movement, server touch scheduling and ball physics are unchanged; a successful locomotion comparison must not be interpreted as a solved ball-control problem.

In the existing physics experiment, dribble touches are announced six simulation ticks before contact. Their interval follows movement speed within a bounded range. In procedural comparison mode, the foot reaches towards the announced ball position; the server rechecks reach and applies a bounded velocity change. A stationary settled ball is not continuously tapped. Losing possession or starting an action cancels the scheduled touch. This remains assisted ball control, not a physical foot collider.

## Verification and limits

Automated coverage checks radial stick filtering, speed ranges, stopping, turn limits, solo capacity/switching, touch scheduling/reset, and snapshot isolation. A renderer-side transform test loads the generated skeleton and checks reachable stationary pass contact in four headings. This is an approximate toe-to-ball test, not proof of contact across every pose.

The Docker browser test loads the actual GLB, supplies a synthetic standard gamepad, verifies walking/running/sprinting/stopping and a server-confirmed pass, and saves screenshots in the ignored `test-results/` folder. Software-rendered browser checks are not representative of Mac GPU performance or the physical Xbox controller. Build and automated checks do not establish animation realism. The initial verification passed 35 automated tests, type checking, the production build, the existing two-client network smoke test and all three browser scenarios. The software browser did not sample a rendered frame within the pass contact window, so there is no end-to-end visual contact measurement from that run.

Known limits: generic imported movement may not match the desired football posture; playback speed and foot sliding still need calibration; the fallback into old football actions can snap; tight turns and correction after network updates can cause foot sliding; receiving uses the first assisted touch rather than a dedicated trap animation; the sagittal leg solver is approximate; clothes are simple fitted surfaces with unfinished seams; footwear is not a finished boot asset; no goalkeeper or aerial animation work is included. The contact window may be missed visually at very low frame rates. Eight detailed players, real-network behavior, Safari and physical controller behavior have not yet been validated.

## Founder playtest

1. Compare **Ready-made animations** and **Previous procedural version**, then compare small stick deflections with full movement and RT sprint. Release the stick, reverse direction and make circles.
2. Repeat while carrying the ball. Observe whether the ball feels attached, escapes too easily, or appears to move without a plausible touch.
3. Reset, pass and shoot; inspect the wind-up, support leg, contact and recovery from both cameras.
4. Assess proportions, silhouette, face/hands, kit and overall style. Identify where the body still looks stiff or unnatural.
5. Record the Mac model, browser, controller connection and any visible stutter before drawing performance conclusions.

The initial procedural version did not pass the founder's quality review. Acceptance of the imported comparison remains open until a new hands-on review. Refine the one-character baseline first; then test the same pipeline with eight footballers before resuming full-match rules.

## Animation acquisition

See the [candidate evaluation](../research/animation-library-evaluation.md) for free and paid football-specific options, verified prices, licensing limits and what has actually been tested. No paid asset has been purchased. Rebuild the imported GLB with `npm run assets:animations` inside the server container after rebuilding the base character.

The authored-locomotion increment passed 37 automated tests, the production build, the two-client network smoke test and all three browser scenarios, including switching both ways between imported and procedural movement. The legacy pass diagnostic sampled a frame about three ticks before contact, not the exact contact instant; it does not validate ball-contact quality. Physical pad assessment remains pending.
