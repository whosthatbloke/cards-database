# ActiveSpot provider extension

This branch stays rebased on the latest upstream `tcgdex/cards-database`
`master`. ActiveSpot adds one provider field: `Card.traits`.

`meta/card-traits.json` is the exact-print authority and records the reviewed
upstream revision and Standard seed. Every API card exposes a canonical trait
array; cards absent from the manifest expose `[]`. Do not infer traits from
names, artwork, suffixes, stages, or rules text.

Push the stable `activespot-traits` branch to the ActiveSpot fork. Its dedicated
workflow publishes `ghcr.io/<repository-owner>/tcgdex` and reports the immutable
image digest in the GitHub Actions summary. ActiveSpot Compose must use that
digest, never a mutable branch or local tag.

`Dockerfile.activespot` extends an immutable official TCGDex digest. Refreshes
must update that digest, `reviewedUpstreamCommit`, and the reviewed Standard seed
together. The image build fails if an authority print no longer exists upstream.
