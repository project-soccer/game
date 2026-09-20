# ADR 0011: Separate the economic track and defer NFT strength

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D05, D11, D21–D32

## Context

NFTs, blockchain, and real-money play are central to the intended product, but the founder explicitly deferred the business model and NFT price/strength relationship.

## Decision

Keep gameplay experiments off-chain and without real funds. Preserve the separate contracts repository and economic design track. Do not silently decide pay-to-win, normalization, token issuance, ownership lending, or settlement policy.

## Consequences

A playable prototype is not an economic launch. Chain, wallets, funding, disputes, fees, legal feasibility, and financial verification remain open. The server result remains trusted input to any eventual settlement contract.

## Alternatives considered

Making wallets/contracts prerequisites for a passing experiment was rejected. Removing economics from the product vision would contradict the founder’s intent.
