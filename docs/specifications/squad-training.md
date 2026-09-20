# Squad Training

Status: initial playable implementation; not a complete match. See [ADR 0016](../adr/0016-use-server-side-heuristics-for-initial-team-ai.md) and the [roadmap](../roadmap.md).

## Start and controls

Run the normal Docker environment, reload the browser and choose **Train with 3 + keeper**. Invite a second participant using the room link. The room carries the scenario, so the joining participant automatically sees the same eight footballers.

Each side has three outfield players and one AI keeper. Keeper kits are gold and purple. Q / LB cycles through your three outfield players. Passing, calling, shooting, sprinting and tackling use the [laboratory controls](action-laboratory.md). The original **Enter the practice pitch** button retains the four-player technical scenario for comparison.

When alone, the other side remains AI-controlled. Joining assigns control of that side's first outfield footballer. Losing a participant returns the selected footballer to AI; this remains practice, with no ranked abandonment policy.

## Initial AI

- Positional targets update every six simulation ticks (10 Hz). AI movement uses normal acceleration and at most 80% of ordinary run input; keepers use 85%. Human input is never replaced by an AI target.
- In possession, off-ball players offer two wide options and a deeper option. Without possession, the nearest outfield footballer presses while the others cover. If the nearest player is human-controlled, the AI does not take over or add a second designated presser.
- An AI carrier on a human's team holds position for the off-ball experiment. A carrier on a fully AI team advances towards goal and attempts a shot inside roughly 12 m. This is a basic practice opponent, not a tactical policy for the finished game.
- AI receivers wait during a targeted pass and for up to 2.5 seconds of ball flight. A human-controlled receiver remains free to move. There is no guaranteed delivery.
- AI standing tackles use the existing wind-up/contact rules with a one-second attempt cooldown.
- Keepers hold an initial line 1.5 m ahead of goal, shift laterally within ±1.7 m, and anticipate ball trajectory up to 1.2 seconds ahead when updating targets.
- A save uses a 0.7 m horizontal volume, reaches up to 1.6 m high, and checks the swept ball path. It cannot stop a ball behind the keeper or beyond that volume. Save attempts have a 0.4-second cooldown.
- Low balls below 0.5 m and under 11 m/s can be controlled on the ground; faster or higher reachable balls are parried sideways. These are initial technical values. Hand catches, dives, keeper fouls and realistic save clips are not implemented.
- A keeper with possession offers a normal pass request first. After two seconds, it prepares an automatic ground pass to a nearby outfield teammate. Turning and kick preparation can add delay. Distribution can be intercepted or missed; no human is switched onto the keeper.

## Remaining match work

Goals still increment a practice counter and reset the exercise. Out-of-bounds balls still reset. There is no four-minute clock, kickoff/restart state machine, last-touch restart award, result screen or mutual rematch. These follow the newly prioritized character and movement quality proof in the roadmap. Initial formation and movement values are tuning choices, not final balance decisions.

The original nine-joint model and receive clip visualize keeper actions only approximately. Player contact remains simple separation rather than full body collision. No real-network or frame-rate benchmark is claimed by these checks.

## Verification

Verified on 2026-09-20: TypeScript checks, all 29 simulation tests, client production build, the original network smoke test and both Docker browser scenarios passed. Favicon delivery and the rendered squad pitch were also inspected. Existing bundle-size and optional PlayCanvas worker-import warnings remain unchanged.

Simulation tests cover the eight-player roster, outfield-only switching, human control protection, support positions, off-ball requests, swept parries, unreachable shots, controlled distribution and 7,200 ticks of bounded play with repeated resets. Docker browser checks load two participants, eight animated models, the correct keeper roles, switching and human movement. The original laboratory regression checks remain active.
