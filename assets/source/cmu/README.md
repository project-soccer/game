# CMU recorded soccer kicks

Source: [CMU Graphics Lab Motion Capture Database](https://mocap.cs.cmu.edu/), subject 10, takes 01 and 02 (soccer — kick ball), acquired 2026-09-22. The original ASF skeleton and two AMC recordings are retained unmodified. URLs and SHA-256 hashes are in [sources.json](sources.json).

The database's [FAQ](https://mocap.cs.cmu.edu/faqs.php) explicitly permits copying, modification and redistribution without permission. Its [homepage](https://mocap.cs.cmu.edu/) permits inclusion in commercially sold products but prohibits direct resale of the data, including converted data. These are CMU's own terms, **not CC0**, and remain separate from the project's unresolved code license. No standalone animation resale is offered here.

The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.

## Conversion

Run `docker compose exec server npm run assets:animations` from the game repository. This first rebuilds Quaternius locomotion and then appends the CMU kicks. No network download is performed during rebuilds.

`scripts/lib/cmu-asf.mjs` is an original, deliberately narrow reader for the pinned XYZ/degree ASF/AMC files. It converts lengths using the CMU FAQ's scale (0.0254 / 0.45 metres per source unit). Acclaim rotation conventions are documented by [UW Graphics](https://research.cs.wisc.edu/graphics/Courses/cs-838-1999/Jeff/ASF-AMC.html). `scripts/retarget-soccer.mjs` maps 20 body joints to the existing detailed character, aligns bind directions, removes horizontal root travel and adjusts floor height. Hand/finger detail is not captured by this trial.

Original frame rate: 120 Hz. Output: 60 Hz, 0.85 seconds per take. Take A uses frames 563–665 of 10_01; B uses frames 317–419 of 10_02. Provisional contact annotations are frames 599 and 353 respectively, both at 0.30 seconds in the exported clip. They were selected from the foot trajectory, **not** from measured ball collision data. Metadata lives in `client/public/assets/footballer-soccer.json`.

The runtime adapts preparation and recovery to the existing server shot schedule. These two right-foot kicks are experiments; they are not an inside-foot pass, a dribble loop, or a complete football animation set. The static reachable-contact check does not prove foot planting or contact for moving balls.
