import type { CardPrinting, Deck, DeckCard, PowerPreferences } from './types';
const now = () => new Date().toISOString();
export const defaultPowerPreferences = (
  targetBracket: 1 | 2 | 3 | 4 | 5 = 2,
): PowerPreferences => ({
  targetBracket,
  allowGameChangers: false,
  allowInfiniteCombos: false,
  maximumComboCardCount: null,
  allowTutors: true,
  allowFastMana: false,
  allowExtraTurns: false,
  allowMassLandDenial: false,
  desiredGameLength: 'mid',
  desiredConsistency: 'balanced',
  desiredInteractionLevel: 'table-aware',
  budgetMode: false,
  maximumCardPrice: null,
});
export function createDeck(name: string, commander?: CardPrinting): Deck {
  const stamp = now();
  const deck: Deck = {
    id: crypto.randomUUID(),
    ownerId: null,
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    description: '',
    format: 'commander',
    commanders: [],
    cards: [],
    customCategories: [],
    tags: [],
    primer: { overview: '' },
    targetBracket: 2,
    powerPreferences: defaultPowerPreferences(),
    visibility: 'local',
    createdAt: stamp,
    updatedAt: stamp,
    version: 1,
  };
  if (commander) deck.commanders = [toDeckCard(commander, 1, 'commander')];
  return deck;
}
export function toDeckCard(
  printing: CardPrinting,
  quantity = 1,
  board: DeckCard['board'] = 'mainboard',
): DeckCard {
  return {
    id: crypto.randomUUID(),
    oracleId: printing.oracleId,
    scryfallCardId: printing.id,
    name: printing.name,
    quantity,
    board,
    customCategoryIds: [],
    notes: '',
    tags: [],
    isFoilPreference: false,
    addedAt: now(),
    printing,
  };
}
export function touch(deck: Deck): Deck {
  return { ...deck, updatedAt: now(), version: deck.version + 1 };
}
