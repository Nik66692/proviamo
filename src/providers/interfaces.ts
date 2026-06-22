import type { CardPrinting, Deck, PowerPreferences } from '@/domain/types';
export interface CardDataProvider {
  searchCards(query: string): Promise<CardPrinting[]>;
  autocomplete(query: string): Promise<string[]>;
  getPrintings(oracleId: string): Promise<CardPrinting[]>;
  resolveCardName(name: string): Promise<CardPrinting | null>;
}
export interface DeckRepository {
  list(): Promise<Deck[]>;
  get(id: string): Promise<Deck | null>;
  save(deck: Deck): Promise<void>;
  delete(id: string): Promise<void>;
}
export interface ComboProvider {
  status: 'unavailable' | 'ready';
  findCombos(oracleIds: string[]): Promise<unknown[]>;
}
export interface AiAnalysisProvider {
  status: 'unavailable' | 'ready';
  explain(): Promise<never>;
}
export interface BracketRulesProvider {
  gameChangers(): Promise<Set<string>>;
  filterRecommendations<T extends { oracleId: string }>(
    cards: T[],
    prefs: PowerPreferences,
  ): Promise<T[]>;
}
