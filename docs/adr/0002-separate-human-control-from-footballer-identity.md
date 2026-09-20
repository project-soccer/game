# ADR 0002: Separate human control from footballer identity

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D01, D02, D03, D04

## Context

The product is 3D football. Human 1v1 switches between footballers; future human 11v11 assigns one footballer to each participant.

## Decision

Represent footballer, team, participant, control assignment, and eventual NFT ownership separately. Team mode permits authorized switching; individual mode does not. Tag inputs with assignment revisions, and resolve switching on the server.

## Consequences

The first laboratory can test both control policies without implementing a 22-human match. Switching cannot reset a committed action or allow two controllers to act on one footballer.

## Alternatives considered

Binding a participant or NFT permanently to the currently selected footballer would prevent one of the required modes.
