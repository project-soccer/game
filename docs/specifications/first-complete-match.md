# First Complete Match — Next Milestone

Status: accepted initial scope; **not implemented by the action laboratory**. See ADR 0006 in the [decision index](../adr/README.md).

- Two human participants, each switching among three outfield footballers; one AI goalkeeper per side.
- Initial 40 × 26 m pitch and four-minute period, both tunable after playtests.
- Ground pass, charged shot, sprint, standing tackle, and switching.
- Simplified touchline/goal-line restarts; no offside, sliding tackles, or commanded aerial play.
- Support, width, and cover AI; bounded goalkeeper reaction, catch/parry and distribution.
- Score, authoritative timer, restart state, completion screen, and mutual rematch.

## Details to validate

Start by evaluating 4 × 2 m goals, friendly draws, ground kick-ins, corners, goalkeeper restarts, a five-second automatic restart fallback, and a three-second keeper distribution fallback. These are tuning proposals. A full referee, cards, official back-pass rule, and ranked abandonment policy are outside this first milestone.

A goal requires whole-ball crossing inside the opening. Test posts, crossbar, last-touch attribution, simultaneous events, and the final simulation tick. Test repeated full sessions without manual repair, then assess whether human players find possession and passing readable and enjoyable.

The laboratory's automatic out-of-bounds reset, waiting target teammates, and shot counter are debugging conveniences; they are not implementations of these match rules.
