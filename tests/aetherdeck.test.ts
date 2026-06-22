import { describe, expect, it } from 'vitest';
import { parseDeckText } from '@/domain/parser';
import { manaCurve, colorSummary } from '@/domain/analysis';
import { createDeck, toDeckCard } from '@/domain/deck';
import {
  deserializeDecks,
  serializeDecks,
} from '@/providers/localDeckRepository';
import { StaticBracketRulesProvider } from '@/providers/bracketRules';
import type { CardPrinting } from '@/domain/types';
const card = (
  name: string,
  cmc: number,
  typeLine: string,
  manaCost = '',
  oracleId = name,
): CardPrinting => ({
  id: name + '-print',
  oracleId,
  name,
  typeLine,
  manaCost,
  cmc,
  colorIdentity: manaCost.includes('G') ? ['G'] : [],
  imageUrl: '',
  set: 'tst',
  collectorNumber: '1',
  lang: 'en',
  finishes: ['nonfoil'],
  prices: { usd: '1.00' },
  priceUpdatedAt: '2026-06-22T00:00:00.000Z',
  isGameChanger: false,
  legalCommander: true,
});
describe('deck parsing', () => {
  it('handles common quantity formats and sections', () => {
    const res = parseDeckText(
      'Commander\n1x Atraxa, Praetors Voice\nMainboard:\n2 Sol Ring\nx3 Forest\nSideboard\n1 Test Card (ABC) 123',
    );
    expect(res.parsed.map((p) => [p.quantity, p.name, p.section])).toEqual([
      [1, 'Atraxa, Praetors Voice', 'commander'],
      [2, 'Sol Ring', 'mainboard'],
      [3, 'Forest', 'mainboard'],
      [1, 'Test Card', 'sideboard'],
    ]);
  });
  it('reports unresolved lines', () => {
    expect(parseDeckText('not a card line').unresolved[0].reason).toContain(
      'No quantity',
    );
  });
});
describe('deterministic calculations', () => {
  it('computes mana curve excluding lands', () => {
    const d = createDeck('T');
    d.cards = [
      toDeckCard(card('Elf', 1, 'Creature', '{G}')),
      toDeckCard(card('Big', 7, 'Creature', '{5}{G}{G}')),
      toDeckCard(card('Forest', 0, 'Basic Land')),
    ];
    expect(manaCurve(d)).toEqual({ '1': 1, '7': 1 });
  });
  it('computes color requirements and land sources', () => {
    const d = createDeck('T', card('Green Commander', 2, 'Creature', '{G}'));
    d.cards = [
      toDeckCard(card('Spell', 2, 'Sorcery', '{G}{G}'), 2),
      toDeckCard(card('Forest', 0, 'Basic Land', '{G}'), 3),
    ];
    expect(colorSummary(d).requirements.G).toBe(4);
    expect(colorSummary(d).sources.G).toBe(3);
  });
});
describe('persistence and rules', () => {
  it('round trips deck serialization', () => {
    const d = createDeck('Persist');
    expect(deserializeDecks(serializeDecks([d]))[0].id).toBe(d.id);
  });
  it('excludes Game Changers by default', async () => {
    const provider = new StaticBracketRulesProvider(new Set(['gc']));
    const filtered = await provider.filterRecommendations(
      [{ oracleId: 'gc' }, { oracleId: 'safe' }],
      createDeck('x').powerPreferences,
    );
    expect(filtered).toEqual([{ oracleId: 'safe' }]);
  });
});
