# Contribution Planning

Project Soccer is currently maintained by its founder with Codex. The three repositories are public to support community participation. This document describes the proposed contribution workflow; software and asset licensing are not yet finalized.

## Language and scope

Write documentation, issue descriptions, pull-request explanations, architecture decisions, and release notes in English. Use clear language and distinguish implemented features from proposals.

Use the [ADR index](adr/README.md) for important decisions, [specifications](specifications/action-laboratory.md) for current behavior, and the [project map](game-design-and-architecture.md) for navigation. Keep the archived review historical.

## Design contributions

Use the ADR template to identify the problem, affected ADRs, proposed behavior, alternatives, consequences, and validation needed. New decisions start as Proposed; material reversals supersede an existing ADR rather than silently rewriting its rationale. Do not mark a founder decision as confirmed without explicit agreement. Record experimental findings with versions, environment, parameters, and limitations.

## Future code contributions

Prefer small changes with a clear purpose and relevant validation. The action laboratory is available; the complete match remains a later milestone. Keep related client, server, and shared simulation changes together in one game pull request. Changes affecting contracts must also identify artifact versions and cross-repository compatibility effects. Do not copy shared simulation or protocol code between repositories.

The founder reviews contributions and makes release decisions. Community participation is welcome as a direction, but no contributor capacity or review turnaround is promised.

## Assets and third-party material

Record origin and license for models, animation, audio, textures, and code. Include only material that can be redistributed under its terms. The project should provide redistributable placeholders if its production assets cannot be included.

## Before public contributions open

Settle licensing, document a reproducible setup, and establish a private security-reporting channel. Do not invent contact addresses or imply a financial audit has been completed. No reporting address has been selected yet.
