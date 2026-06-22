import type { PowerPreferences } from '@/domain/types';
import type { BracketRulesProvider } from './interfaces';
export class StaticBracketRulesProvider implements BracketRulesProvider {
  constructor(private readonly ids = new Set<string>()) {}
  async gameChangers() {
    return this.ids;
  }
  async filterRecommendations<T extends { oracleId: string }>(
    cards: T[],
    prefs: PowerPreferences,
  ) {
    if (prefs.allowGameChangers) return cards;
    const ids = await this.gameChangers();
    return cards.filter((c) => !ids.has(c.oracleId));
  }
}
