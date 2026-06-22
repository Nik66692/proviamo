import type { Color, Deck, DeckCard } from './types';
const colors: Color[] = ['W', 'U', 'B', 'R', 'G'];
const types = [
  'Creature',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Planeswalker',
  'Battle',
  'Land',
];
const pips = (mana: string, c: Color) =>
  [...mana.matchAll(new RegExp(c, 'g'))].length;
export function manaCurve(deck: Deck) {
  const buckets: Record<string, number> = {};
  deck.cards
    .filter((c) => !c.printing.typeLine.includes('Land'))
    .forEach((c) => {
      const key = String(Math.min(7, Math.floor(c.printing.cmc)));
      buckets[key] = (buckets[key] ?? 0) + c.quantity;
    });
  return buckets;
}
export function typeDistribution(deck: Deck) {
  const out: Record<string, number> = {};
  for (const card of [...deck.commanders, ...deck.cards])
    for (const t of types)
      if (card.printing.typeLine.includes(t))
        out[t] = (out[t] ?? 0) + card.quantity;
  return out;
}
export function colorSummary(deck: Deck) {
  const requirements = Object.fromEntries(colors.map((c) => [c, 0])) as Record<
    Color,
    number
  >;
  const sources = Object.fromEntries(colors.map((c) => [c, 0])) as Record<
    Color,
    number
  >;
  for (const c of deck.cards) {
    for (const color of colors) {
      requirements[color] += pips(c.printing.manaCost, color) * c.quantity;
      if (c.printing.typeLine.includes('Land') && c.printing.oracleId)
        sources[color] += c.printing.colorIdentity.includes(color)
          ? c.quantity
          : 0;
    }
  }
  return {
    identity: [
      ...new Set(deck.commanders.flatMap((c) => c.printing.colorIdentity)),
    ],
    requirements,
    sources,
    landCount: deck.cards
      .filter((c) => c.printing.typeLine.includes('Land'))
      .reduce((a, c) => a + c.quantity, 0),
  };
}
export function priceSummary(deck: Deck) {
  let usd = 0;
  let latest = '';
  const expensive: DeckCard[] = [];
  for (const card of [...deck.commanders, ...deck.cards]) {
    const price = Number(
      card.isFoilPreference
        ? card.printing.prices.usdFoil
        : card.printing.prices.usd,
    );
    if (Number.isFinite(price)) {
      usd += price * card.quantity;
      expensive.push(card);
    }
    if (card.printing.priceUpdatedAt > latest)
      latest = card.printing.priceUpdatedAt;
  }
  return {
    usd: Number(usd.toFixed(2)),
    updatedAt: latest || new Date().toISOString(),
    expensive: expensive
      .sort(
        (a, b) =>
          Number(b.printing.prices.usd ?? 0) -
          Number(a.printing.prices.usd ?? 0),
      )
      .slice(0, 5),
  };
}
