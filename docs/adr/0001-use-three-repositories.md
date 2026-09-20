# ADR 0001: Use three repositories

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D33, D34, D35, D36, D37

## Context

One maintainer needs coordinated client/server changes while the public website and economic contracts have distinct responsibilities.

## Decision

Use `project-soccer/game` for client, server, shared core, and documentation; `project-soccer/website` for website/brand assets; and `project-soccer/contracts` for economic contracts. Each repository owns a root AGENTS.md. Documentation is English. The three repositories are public, with SSH Git remotes.

## Consequences

Game changes can be reviewed atomically. Shared core does not need early registry publication. Keep server-only dependencies out of browser builds. Public visibility does not select a software or asset license.

## Alternatives considered

Six repositories were rejected because client/server/core coordination would add early release overhead. A single repository for every product surface was not chosen.
