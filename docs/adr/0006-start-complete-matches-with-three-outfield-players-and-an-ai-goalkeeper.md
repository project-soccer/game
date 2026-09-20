# ADR 0006: Start complete matches with three outfield players and an AI goalkeeper

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D07, D08, D10, D20

## Context

Human 1v1 needs meaningful passing and defensive support while fitting a solo prototype.

## Decision

The first complete match uses two humans, each controlling three outfield footballers and one AI goalkeeper, on an initial 40 × 26 m pitch for four minutes. Include ground pass, charged shot, sprint, standing tackle, switching, and simplified out-of-bounds restarts. Defer offside, sliding tackles, and commanded aerial actions.

## Consequences

Dimensions/duration are initial playtest parameters. Goalkeeper behavior, exact restarts, collision rules, and ending behavior require implementation and validation before calling the match complete. The ball remains 3D even without a loft button.

## Alternatives considered

Five-a-side adds AI/content before the basic loop is validated. An individual duel alone would not test the confirmed team-switching product.
