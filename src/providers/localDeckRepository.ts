import type { Deck } from '@/domain/types';
import type { DeckRepository } from './interfaces';
const key = 'aetherdeck.decks.v1';
export function serializeDecks(decks: Deck[]): string {
  return JSON.stringify({ version: 1, decks });
}
export function deserializeDecks(value: string | null): Deck[] {
  if (!value) return [];
  const parsed = JSON.parse(value) as { decks?: Deck[] };
  return Array.isArray(parsed.decks) ? parsed.decks : [];
}
export class LocalDeckRepository implements DeckRepository {
  async list() {
    return deserializeDecks(localStorage.getItem(key));
  }
  async get(id: string) {
    return (await this.list()).find((d) => d.id === id) ?? null;
  }
  async save(deck: Deck) {
    const decks = (await this.list()).filter((d) => d.id !== deck.id);
    decks.unshift(deck);
    localStorage.setItem(key, serializeDecks(decks));
  }
  async delete(id: string) {
    localStorage.setItem(
      key,
      serializeDecks((await this.list()).filter((d) => d.id !== id)),
    );
  }
}
