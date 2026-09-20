# Contribution Planning

Project Soccer is currently maintained by its founder with Codex. The three repositories are public to support community participation. This document describes the proposed contribution workflow; software and asset licensing are not yet finalized.

## Language and scope

Write documentation, issue descriptions, pull-request explanations, architecture decisions, and release notes in English. Use clear language and distinguish implemented features from proposals.

The canonical cross-project specification is [Game Design and Architecture](game-design-and-architecture.md). Keep implementation-specific setup instructions in the repository that owns the implementation.

## Design contributions

Identify the problem, affected decision IDs, proposed behavior, alternatives, and validation needed. Do not mark a founder decision as confirmed without explicit agreement. Record experimental findings with versions, environment, parameters, and limitations.

## Future code contributions

Once repositories and implementation work are available, prefer small changes with a clear purpose and relevant validation. Keep related client, server, and shared simulation changes together in one game pull request. Changes affecting contracts must also identify artifact versions and cross-repository compatibility effects. Do not copy shared simulation or protocol code between repositories.

The founder reviews contributions and makes release decisions. Community participation is welcome as a direction, but no contributor capacity or review turnaround is promised.

## Assets and third-party material

Record origin and license for models, animation, audio, textures, and code. Include only material that can be redistributed under its terms. The project should provide redistributable placeholders if its production assets cannot be included.

## Before public contributions open

Settle licensing, document a reproducible setup, and establish a private security-reporting channel. Do not invent contact addresses or imply a financial audit has been completed. No reporting address has been selected yet.
