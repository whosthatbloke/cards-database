import { createHash } from 'node:crypto'

type Authority = {
	readonly schemaVersion: number
	readonly reviewedUpstreamCommit: string
	readonly reviewedStandardSeedHash: string
	readonly reviewedSemanticHash: string
	readonly reviewedPresentationHash: string
	readonly reviewedCandidateSha256: string
	readonly reviewedAuditSha256: string
	readonly sourceTraitCommit: string
	readonly cards: Readonly<Record<string, ReadonlyArray<string>>>
}

const authorityFile = Bun.file('/tmp/card-traits.json')
const encodedAuthority = await authorityFile.arrayBuffer()
const authorityHash = createHash('sha256').update(new Uint8Array(encodedAuthority)).digest('hex')
const authority = JSON.parse(new TextDecoder().decode(encodedAuthority)) as Authority
const expected = {
	authorityHash: process.env.ACTIVESPOT_CARD_TRAITS_SHA256,
	upstreamRevision: process.env.ACTIVESPOT_UPSTREAM_REVISION,
	standardSeedHash: process.env.ACTIVESPOT_STANDARD_SEED_HASH,
	semanticHash: process.env.ACTIVESPOT_SEMANTIC_HASH,
	presentationHash: process.env.ACTIVESPOT_PRESENTATION_HASH,
	candidateSha256: process.env.ACTIVESPOT_CANDIDATE_SHA256,
	auditSha256: process.env.ACTIVESPOT_AUDIT_SHA256,
}
if (
	authority.schemaVersion !== 1 ||
	authorityHash !== expected.authorityHash ||
	authority.reviewedUpstreamCommit !== expected.upstreamRevision ||
	authority.reviewedStandardSeedHash !== expected.standardSeedHash ||
	authority.reviewedSemanticHash !== expected.semanticHash ||
	authority.reviewedPresentationHash !== expected.presentationHash ||
	authority.reviewedCandidateSha256 !== expected.candidateSha256 ||
	authority.reviewedAuditSha256 !== expected.auditSha256 ||
	!/^[a-f0-9]{40}$/u.test(authority.sourceTraitCommit)
) throw new Error('Trait authority metadata does not match the reviewed provider release')

const allowedTraits = new Set(['ancient', 'future', 'tera', 'single-strike', 'rapid-strike', 'fusion-strike'])
for (const [id, traits] of Object.entries(authority.cards)) {
	if (
		!Array.isArray(traits) ||
		traits.length < 1 ||
		traits.some((trait) => !allowedTraits.has(trait)) ||
		new Set(traits).size !== traits.length ||
		traits.some((trait, index) => index > 0 && traits[index - 1]!.localeCompare(trait) >= 0)
	) throw new Error(`Trait authority is invalid for ${id}`)
}

const generatedRoot = '/usr/src/app/generated'
const englishCards = await Bun.file(`${generatedRoot}/en/cards.json`).json() as Array<{ id: string, legal?: { standard?: boolean } }>
const knownIds = new Set(englishCards.map((card) => card.id))
const missing = Object.keys(authority.cards).filter((id) => !knownIds.has(id))

if (missing.length > 0) {
	throw new Error(`Trait authority contains unknown print IDs: ${missing.join(', ')}`)
}

const standardIds = englishCards
	.filter((card) => card.legal?.standard === true)
	.map((card) => card.id)
	.sort((left, right) => left.localeCompare(right))
const standardSeedHash = createHash('sha256').update(JSON.stringify(standardIds)).digest('hex')
if (standardSeedHash !== authority.reviewedStandardSeedHash)
	throw new Error('Latest provider Standard seed does not match the reviewed authority')

for await (const path of new Bun.Glob('*/cards.json').scan(generatedRoot)) {
	const file = `${generatedRoot}/${path}`
	const cards = await Bun.file(file).json() as Array<{ id: string, traits?: ReadonlyArray<string> }>
	for (const card of cards) card.traits = authority.cards[card.id] ?? []
	await Bun.write(file, `${JSON.stringify(cards)}\n`)
}
