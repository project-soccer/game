# ADR 0010: Use a shared original rig and synchronized action timing

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D17, D31

## Context

We need editable, redistributable animation assets immediately, without assuming a purchased motion library or final character art.

## Decision

Use a shared humanoid skeleton and original simple model/animation source for the laboratory. Export a reproducible GLB. PlayCanvas samples animations from action state; server-defined contact timing decides ball impulses. Keep collision/foot alignment review explicit.

## Consequences

The original procedural clips are technical placeholders, not production motion capture. Improve foot planting, turns, receiving, and goalkeeping before broader playtests. Third-party raw assets require redistribution rights. No general project license is selected by this decision.

## Alternatives considered

Deferring all animation would miss a core risk. Downloading or publishing commercial/raw motion assets without verified terms was not chosen.
