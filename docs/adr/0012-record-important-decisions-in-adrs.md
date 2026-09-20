# ADR 0012: Record important decisions in ADRs

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D34; documentation governance

## Context

The growing design document mixed accepted decisions, implementation status, proposals, and source analysis. The founder requested isolated ADRs.

## Decision

Keep one important architectural/product decision per numbered ADR with context, decision, consequences, alternatives, and status. Keep the project map short. Put tunable behavior and current limitations in specifications; archive the old source review. Maintain an explicit ADR index and legacy-ID mapping.

## Consequences

Do not keep editing the archive as a competing specification. A material reversal receives a new ADR that supersedes the old one; routine tuning updates the relevant specification. Accepted decisions do not imply completed implementation.

## Alternatives considered

Continuing a single expanding architecture document was rejected. Creating ADRs for every numeric tuning change would obscure important decisions.
