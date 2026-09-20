# ADR 0013: Keep the brand master as native SVG

- Status: Accepted
- Date: 2026-09-20
- Scope: Project Soccer
- Legacy references: D31; brand format

## Context

The approved generated football/PS emblem had excessive padding and residual internal alpha. The founder requested an SVG in the repository.

## Decision

Keep an editable SVG master in the website repository, reconstructed with a fully opaque black circular base and opaque white paths. Only the exterior is transparent. Export PNG from this master and preserve the generated image in Git history as reference.

## Consequences

The logo scales cleanly without embedded bitmap/font dependencies. Small geometric regularization is documented. Verify the PNG alpha and preview it over pink, dark, and light backgrounds. Applying the avatar on GitHub is separate from storing the asset.

## Alternatives considered

Wrapping a PNG inside SVG would not provide vector geometry or fix its internal transparency. Further generative edits were not chosen for the exact vector asset.
