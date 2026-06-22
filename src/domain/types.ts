export type Color = 'W' | 'U' | 'B' | 'R' | 'G';
export type BoardSection =
  | 'commander'
  | 'mainboard'
  | 'sideboard'
  | 'maybeboard'
  | 'considering';
export type TargetBracket = 1 | 2 | 3 | 4 | 5;
export interface CardFace {
  name: string;
  imageUrl?: string;
}
export interface CardPrinting {
  id: string;
  oracleId: string;
  name: string;
  typeLine: string;
  manaCost: string;
  cmc: number;
  colorIdentity: Color[];
  imageUrl?: string;
  faces?: CardFace[];
  set: string;
  collectorNumber: string;
  lang: string;
  finishes: string[];
  prices: { usd?: string | null; usdFoil?: string | null; eur?: string | null };
  priceUpdatedAt: string;
  isGameChanger: boolean;
  legalCommander: boolean;
}
export interface DeckCard {
  id: string;
  oracleId: string;
  scryfallCardId: string;
  name: string;
  quantity: number;
  board: BoardSection;
  customCategoryIds: string[];
  notes: string;
  tags: string[];
  isFoilPreference: boolean;
  addedAt: string;
  printing: CardPrinting;
}
export interface PowerPreferences {
  targetBracket: TargetBracket;
  allowGameChangers: boolean;
  allowInfiniteCombos: boolean;
  maximumComboCardCount: number | null;
  allowTutors: boolean;
  allowFastMana: boolean;
  allowExtraTurns: boolean;
  allowMassLandDenial: boolean;
  desiredGameLength: string;
  desiredConsistency: string;
  desiredInteractionLevel: string;
  budgetMode: boolean;
  maximumCardPrice: number | null;
}
export interface Deck {
  id: string;
  ownerId: string | null;
  name: string;
  slug: string;
  description: string;
  format: 'commander';
  commanders: DeckCard[];
  cards: DeckCard[];
  customCategories: { id: string; name: string }[];
  tags: string[];
  primer: Record<string, string>;
  targetBracket: TargetBracket;
  powerPreferences: PowerPreferences;
  visibility: 'local' | 'private' | 'public';
  createdAt: string;
  updatedAt: string;
  version: number;
}
export interface ParsedLine {
  raw: string;
  quantity: number;
  name: string;
  section: BoardSection;
}
export interface UnresolvedLine {
  raw: string;
  reason: string;
}
