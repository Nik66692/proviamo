import type { CardPrinting, Color } from '@/domain/types';
type RawCard = {
  id: string;
  oracle_id?: string;
  name: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  color_identity?: Color[];
  image_uris?: { normal?: string; art_crop?: string };
  card_faces?: { name: string; image_uris?: { normal?: string } }[];
  set?: string;
  collector_number?: string;
  lang?: string;
  finishes?: string[];
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
    eur?: string | null;
  };
  legalities?: { commander?: string };
  game_changer?: boolean;
};
const isRawCard = (v: unknown): v is RawCard =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as RawCard).id === 'string' &&
  typeof (v as RawCard).name === 'string';
const asList = (v: unknown): RawCard[] => {
  const data = (v as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.filter(isRawCard);
};
const map = (c: RawCard): CardPrinting => ({
  id: c.id,
  oracleId: c.oracle_id ?? c.id,
  name: c.name,
  typeLine: c.type_line ?? '',
  manaCost: c.mana_cost ?? '',
  cmc: c.cmc ?? 0,
  colorIdentity: c.color_identity ?? [],
  imageUrl: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal,
  faces: c.card_faces?.map((f) => ({
    name: f.name,
    imageUrl: f.image_uris?.normal,
  })),
  set: c.set ?? '',
  collectorNumber: c.collector_number ?? '',
  lang: c.lang ?? 'en',
  finishes: c.finishes ?? [],
  prices: {
    usd: c.prices?.usd,
    usdFoil: c.prices?.usd_foil,
    eur: c.prices?.eur,
  },
  priceUpdatedAt: new Date().toISOString(),
  isGameChanger: c.game_changer ?? false,
  legalCommander: c.legalities?.commander === 'legal',
});
export async function scryfall(path: string) {
  const res = await fetch(`https://api.scryfall.com${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Scryfall request failed');
  return res.json() as Promise<unknown>;
}
export async function searchCards(q: string) {
  return asList(
    await scryfall(`/cards/search?q=${encodeURIComponent(q)}&unique=cards`),
  ).map(map);
}
export async function autocomplete(q: string) {
  const data = (await scryfall(
    `/cards/autocomplete?q=${encodeURIComponent(q)}`,
  )) as { data?: unknown };
  return Array.isArray(data.data)
    ? data.data.filter((x): x is string => typeof x === 'string')
    : [];
}
export async function namedCard(name: string) {
  try {
    const raw = await scryfall(
      `/cards/named?exact=${encodeURIComponent(name)}`,
    );
    return isRawCard(raw) ? map(raw) : null;
  } catch {
    return null;
  }
}
export async function printings(oracleId: string) {
  return asList(
    await scryfall(
      `/cards/search?order=released&q=oracleid:${oracleId}&unique=prints`,
    ),
  ).map(map);
}
