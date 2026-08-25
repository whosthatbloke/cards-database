# ActiveSpot provider extension

This branch stays rebased on the latest upstream `tcgdex/cards-database`
`master`. ActiveSpot adds one provider field: `Card.traits`.

`meta/card-traits.json` is the exact-print authority and records the reviewed
upstream revision and Standard seed. Every API card exposes a canonical trait
array; cards absent from the manifest expose `[]`. Do not infer traits from
names, artwork, suffixes, stages, or rules text.

Build the provider locally from the stable `activespot-traits` branch:

```bash
docker build -f Dockerfile.activespot -t tcgdex/server:activespot-local-v6 .
```

ActiveSpot local Compose uses that explicit local tag. Production must use an
immutable digest from ActiveSpot's private registry; this repository does not
publish provider images.

`Dockerfile.activespot` extends an immutable official TCGDex digest. Refreshes
must update that digest, `reviewedUpstreamCommit`, and the reviewed Standard seed
together. The image build fails if an authority print no longer exists upstream.
