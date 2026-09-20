# Project Soccer — Project Map

Project Soccer is a browser-based 3D football project developed by one maintainer with Codex. This file is a navigation map, not an expanding design specification.

## Decisions

The [ADR index](adr/README.md) records accepted decisions, rationale, alternatives, and consequences. Use a new ADR to change an important decision; use specifications for routine tuning.

## Current work

- [Development roadmap](roadmap.md): implementation stages and current exit criteria.
- [Squad training](specifications/squad-training.md): eight footballers, initial teammate AI and goalkeeper behavior.
- [Action laboratory](specifications/action-laboratory.md): setup, current scope, controls, limitations, and verification.
- [Off-ball control experiment](specifications/off-ball-control.md): possession switches, pass requests, and playtest questions.
- [First complete match](specifications/first-complete-match.md): target scope; squad training is available, match lifecycle is next.
- [Open questions](open-questions.md): decisions and evidence still required.
- [Contributing](CONTRIBUTING.md): contribution and documentation workflow.

## Repository boundaries

- [game](https://github.com/project-soccer/game): client, authoritative server, shared core, and cross-project decisions.
- [website](https://github.com/project-soccer/website): website and canonical brand assets.
- [contracts](https://github.com/project-soccer/contracts): separate economic track.

Each repository contains its own AGENTS.md. All documentation is English. The NFT price/strength policy and project license remain open.

## Historical material

The [archived design review](archive/design-review-2026-09-20.md) retains the source-document critique, technical citations, and legacy D01–D40 IDs. It is explicitly historical and must not override current ADRs or specifications.
