# Off-ball Control Experiment

Status: implemented in the action laboratory; awaiting human playtest feedback. See [ADR 0015](../adr/0015-experiment-with-off-ball-control-and-pass-requests.md).

## Try it

1. Reload the local game and enter a new practice pitch. The blue side starts with the ball.
2. Press Q / LB to control the other blue footballer. A gold ring marks the AI carrier.
3. Move into a receiving position with WASD / left stick. The carrier holds position and keeps the ball nearby when unpressured.
4. Press J / A to call for a ground pass. Stay ready to receive or move into its committed trajectory. Human control stays with your receiver.
5. Repeat with a caller behind the carrier, a changing run, and an opponent in the passing lane. Use R to reset between attempts. Invite a second human to test tackles and interceptions.

The same button passes normally when the selected footballer owns the ball. Calling is unavailable if possession is loose or opposing, the carrier is human-controlled or busy, or the target is more than 22 m away. There is no aerial pass or overhead-kick command yet.

## Current behavior and tuning

- The server handles requests through the existing pass intent. Clients cannot identify arbitrary carriers or supply an authoritative destination.
- One pending request per controller, with a 30-tick / 0.5 s request cooldown. An unstarted request expires after 90 ticks / 1.5 s.
- The AI turns at up to 6 radians per second. It continues ordinary guided ball touches and waits for the ball to be in front and within the usual reachable volume.
- A target less than 1.2 m away does not trigger a kick; the request may proceed if the caller moves away before expiry.
- At action start the target position determines direction. Contact occurs 10 ticks later. Existing distance-based pass power applies; it does not continually retarget or guarantee reception.
- Possession loss, excessive ball distance/height, another switch, disconnect, reset, or explicit input cancellation prevents a pending AI pass. Range and expiry are checked until action start. Once kicked, the ball continues normally even if control changes.
- The carrier may be tackled and has no extra invulnerability, stronger touch, or special ball ownership rule. Non-carrier teammates still wait; tactical support and pressure-aware shielding are not implemented.
- HUD text explains the pass meaning and reports a requested, unavailable, or cancelled call. A successful request means an attempt, not guaranteed arrival.

## Playtest questions

Compare ordinary pass-and-handoff with switching first and calling for the ball. Try both against a defending human.

- Can you tell who you control and who has possession without looking away from play?
- Does the turn and pass preparation feel responsive while leaving time to defend?
- Can you place the receiver where intended? Does committing aim at action start feel fair when you keep running?
- Do interceptions and lost-possession cancellations make sense?
- Is AI possession too safe? Does calling become the only sensible way to attack?
- Would a separate call button, input buffer or different switching rule help?

The simple carrier AI and four-player laboratory cannot answer full-match balance questions. Keep the mechanic experimental through the next match milestone.

## Verification

Simulation scenarios cover positioning and reception, a backward request, an interception, committed trajectories, cancellation during wind-up, request limits, and preservation of individual/human control. The browser test uses keyboard inputs in two isolated Docker Chromium contexts to switch, run, call, and receive without a control handoff. Physical gamepads and real-network responsiveness still require human testing.
