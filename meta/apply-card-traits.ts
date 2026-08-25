type Authority = {
	readonly cards: Readonly<Record<string, ReadonlyArray<string>>>
}

const authority = await Bun.file('/tmp/card-traits.json').json() as Authority
const generatedRoot = '/usr/src/app/generated'
const englishCards = await Bun.file(`${generatedRoot}/en/cards.json`).json() as Array<{ id: string }>
const knownIds = new Set(englishCards.map((card) => card.id))
const missing = Object.keys(authority.cards).filter((id) => !knownIds.has(id))

if (missing.length > 0) {
	throw new Error(`Trait authority contains unknown print IDs: ${missing.join(', ')}`)
}

for await (const path of new Bun.Glob('*/cards.json').scan(generatedRoot)) {
	const file = `${generatedRoot}/${path}`
	const cards = await Bun.file(file).json() as Array<{ id: string, traits?: ReadonlyArray<string> }>
	for (const card of cards) card.traits = authority.cards[card.id] ?? []
	await Bun.write(file, `${JSON.stringify(cards)}\n`)
}
