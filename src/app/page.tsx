'use client';
import { useEffect, useMemo, useState } from 'react';
import type {
  CardPrinting,
  Deck,
  DeckCard,
  ParsedLine,
  UnresolvedLine,
} from '@/domain/types';
import { createDeck, toDeckCard, touch } from '@/domain/deck';
import {
  manaCurve,
  typeDistribution,
  colorSummary,
  priceSummary,
} from '@/domain/analysis';
import { parseDeckText } from '@/domain/parser';
import { LocalDeckRepository } from '@/providers/localDeckRepository';
const repo = typeof window === 'undefined' ? null : new LocalDeckRepository();
async function api<T>(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Request failed');
  return r.json() as Promise<T>;
}
export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [active, setActive] = useState<Deck | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CardPrinting[]>([]);
  const [importText, setImportText] = useState(
    "Commander\n1 Atraxa, Praetors' Voice\nMainboard\n1 Sol Ring\n1 Command Tower",
  );
  const [review, setReview] = useState<{
    parsed: ParsedLine[];
    unresolved: UnresolvedLine[];
  } | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [drawer, setDrawer] = useState<DeckCard | null>(null);
  const [prints, setPrints] = useState<CardPrinting[]>([]);
  useEffect(() => {
    repo?.list().then((d) => {
      setDecks(d);
      setActive(d[0] ?? null);
    });
  }, []);
  const save = async (d: Deck) => {
    const next = touch(d);
    await repo?.save(next);
    const all = (await repo?.list()) ?? [];
    setDecks(all);
    setActive(next);
  };
  const stats = useMemo(
    () =>
      active
        ? {
            curve: manaCurve(active),
            types: typeDistribution(active),
            colors: colorSummary(active),
            price: priceSummary(active),
          }
        : null,
    [active],
  );
  async function search() {
    setResults(
      await api<CardPrinting[]>(
        `/api/scryfall/search?q=${encodeURIComponent(query + ' legal:commander')}`,
      ),
    );
  }
  async function add(card: CardPrinting, commander = false) {
    const base = active ?? createDeck(card.name, commander ? card : undefined);
    if (commander) {
      await save({
        ...base,
        commanders: [toDeckCard(card, 1, 'commander')],
        name: base.name === 'New deck' ? card.name : base.name,
      });
    } else await save({ ...base, cards: [...base.cards, toDeckCard(card)] });
  }
  async function makeDeck() {
    const d = createDeck('New deck');
    await save(d);
  }
  async function duplicate(d: Deck) {
    await save({
      ...d,
      id: crypto.randomUUID(),
      name: d.name + ' copy',
      slug: d.slug + '-copy',
      createdAt: new Date().toISOString(),
    });
  }
  async function resolveImport() {
    const parsed = parseDeckText(importText);
    setReview(parsed);
    if (!active) await makeDeck();
  }
  async function applyImport() {
    if (!review || !active) return;
    const found: DeckCard[] = [];
    const unresolved = [...review.unresolved];
    for (const line of review.parsed) {
      const card = await api<CardPrinting | null>(
        `/api/scryfall/named?name=${encodeURIComponent(line.name)}`,
      );
      if (card) found.push(toDeckCard(card, line.quantity, line.section));
      else
        unresolved.push({
          raw: line.raw,
          reason: 'Scryfall could not resolve this name',
        });
    }
    await save({
      ...active,
      commanders: found.filter((c) => c.board === 'commander'),
      cards: [...active.cards, ...found.filter((c) => c.board !== 'commander')],
    });
    setReview({ parsed: review.parsed, unresolved });
  }
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#41206d,transparent_35%),radial-gradient(circle_at_top_right,#06465a,transparent_30%),#050711] p-4 md:p-8">
      <header className="mx-auto mb-6 flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[.45em] text-cyan-200">
            Aetherdeck
          </p>
          <h1 className="text-4xl font-black md:text-6xl">
            Engine-aware Commander vault
          </h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Local-only Milestone 1. AI, cloud sync and combo integrations are
            planned and clearly unavailable.
          </p>
        </div>
        <button className="btn focusable" onClick={makeDeck}>
          Create deck
        </button>
      </header>
      <section className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[310px_1fr]">
        <aside className="glass rounded-3xl p-4">
          <h2 className="mb-3 text-xl font-bold">Local library</h2>
          {decks.map((d) => (
            <button
              key={d.id}
              className="focusable mb-2 w-full rounded-2xl border border-white/10 p-3 text-left hover:bg-white/10"
              onClick={() => setActive(d)}
            >
              <b>{d.name}</b>
              <span className="block text-sm text-slate-400">
                {d.cards.length + d.commanders.length} entries · bracket{' '}
                {d.targetBracket}
              </span>
            </button>
          ))}
          {active && (
            <div className="mt-4 flex gap-2">
              <button
                className="ghost focusable"
                onClick={() => duplicate(active)}
              >
                Duplicate
              </button>
              <button
                className="ghost focusable"
                onClick={async () => {
                  await repo?.delete(active.id);
                  const all = (await repo?.list()) ?? [];
                  setDecks(all);
                  setActive(all[0] ?? null);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </aside>
        <div className="space-y-4">
          {active && (
            <section className="glass rounded-3xl p-4 md:p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  Name
                  <input
                    className="field focusable mt-1"
                    value={active.name}
                    onChange={(e) =>
                      setActive({ ...active, name: e.target.value })
                    }
                    onBlur={() => save(active)}
                  />
                </label>
                <label>
                  Target Commander bracket
                  <select
                    className="field focusable mt-1"
                    value={active.targetBracket}
                    onChange={(e) =>
                      save({
                        ...active,
                        targetBracket: Number(
                          e.target.value,
                        ) as Deck['targetBracket'],
                        powerPreferences: {
                          ...active.powerPreferences,
                          targetBracket: Number(
                            e.target.value,
                          ) as Deck['targetBracket'],
                        },
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 p-3">
                  <input
                    type="checkbox"
                    checked={active.powerPreferences.allowGameChangers}
                    onChange={(e) =>
                      save({
                        ...active,
                        powerPreferences: {
                          ...active.powerPreferences,
                          allowGameChangers: e.target.checked,
                        },
                      })
                    }
                  />
                  Allow Game Changers (defaults off)
                </label>
                <textarea
                  className="field focusable md:col-span-2"
                  placeholder="Deck intent / notes"
                  value={active.description}
                  onChange={(e) =>
                    setActive({ ...active, description: e.target.value })
                  }
                  onBlur={() => save(active)}
                />
              </div>
            </section>
          )}
          <section className="glass rounded-3xl p-4 md:p-6">
            <h2 className="text-2xl font-bold">
              Scryfall Commander & card search
            </h2>
            <div className="mt-3 flex gap-2">
              <input
                className="field focusable"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards or commanders"
              />
              <button className="btn focusable" onClick={search}>
                Search
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {results.slice(0, 12).map((c) => (
                <article
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <img
                    src={c.imageUrl}
                    alt=""
                    className="mb-2 aspect-[5/7] w-full rounded-xl object-cover"
                  />
                  <b>{c.name}</b>
                  <p className="text-xs text-slate-400">
                    {c.set.toUpperCase()} #{c.collectorNumber}{' '}
                    {c.isGameChanger ? '· Game Changer' : ''}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="ghost focusable"
                      onClick={() => add(c, true)}
                    >
                      Commander
                    </button>
                    <button className="ghost focusable" onClick={() => add(c)}>
                      Add
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          {active && (
            <>
              <section className="glass rounded-3xl p-4 md:p-6">
                <h2 className="text-2xl font-bold">Plain-text import</h2>
                <textarea
                  className="field focusable mt-3 min-h-36"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
                <div className="mt-3 flex gap-2">
                  <button className="ghost focusable" onClick={resolveImport}>
                    Review parse
                  </button>
                  <button
                    className="btn focusable"
                    onClick={applyImport}
                    disabled={!review}
                  >
                    Resolve & import
                  </button>
                </div>
                {review && (
                  <p className="mt-3 text-sm text-slate-300">
                    Parsed {review.parsed.length} lines. Unresolved:{' '}
                    {review.unresolved.map((u) => u.raw).join(', ') || 'none'}.
                  </p>
                )}
              </section>
              <section className="glass rounded-3xl p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Deck view</h2>
                  <button
                    className="ghost focusable"
                    onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
                  >
                    {view === 'grid' ? 'Compact list' : 'Visual grid'}
                  </button>
                </div>
                <div
                  className={
                    view === 'grid'
                      ? 'mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
                      : 'mt-4 space-y-2'
                  }
                >
                  {[...active.commanders, ...active.cards].map((c) => (
                    <button
                      key={c.id}
                      className="focusable rounded-2xl border border-white/10 bg-white/5 p-3 text-left"
                      onClick={async () => {
                        setDrawer(c);
                        setPrints(
                          await api<CardPrinting[]>(
                            `/api/scryfall/printings?oracleId=${c.oracleId}`,
                          ),
                        );
                      }}
                    >
                      {view === 'grid' && (
                        <img
                          src={c.printing.imageUrl}
                          alt=""
                          className="mb-2 aspect-[5/7] w-full rounded-xl object-cover"
                        />
                      )}
                      <b>
                        {c.quantity} {c.name}
                      </b>
                      <span className="block text-xs text-slate-400">
                        {c.board} · {c.printing.set.toUpperCase()}{' '}
                        {c.printing.prices.usd
                          ? '$' + c.printing.prices.usd
                          : 'no price'}{' '}
                        {c.printing.isGameChanger ? '· Game Changer' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="grid gap-4 xl:grid-cols-4">
                <Panel title="Mana curve" data={stats?.curve} />
                <Panel title="Card types" data={stats?.types} />
                <Panel
                  title="Color & sources"
                  data={stats?.colors.requirements}
                />
                <div className="glass rounded-3xl p-4">
                  <h3 className="font-bold">Prices</h3>
                  <p className="mt-3 text-3xl font-black">
                    ${stats?.price.usd}
                  </p>
                  <p className="text-xs text-slate-400">
                    Scryfall prices last fetched {stats?.price.updatedAt}.
                    Cached prices are not guarantees.
                  </p>
                </div>
              </section>
              <section className="glass rounded-3xl p-4">
                <h2 className="text-xl font-bold">
                  Planned analysis providers
                </h2>
                <p className="text-slate-300">
                  Combo detection and AI-written diagnosis are intentionally
                  unavailable in Milestone 1; typed provider boundaries are
                  present for later connection.
                </p>
              </section>
            </>
          )}
          {drawer && (
            <div className="fixed inset-0 z-10 grid place-items-center bg-black/70 p-4">
              <div className="glass max-h-[90vh] max-w-5xl overflow-auto rounded-3xl p-5">
                <button
                  className="ghost focusable float-right"
                  onClick={() => setDrawer(null)}
                >
                  Close
                </button>
                <h2 className="text-2xl font-bold">
                  Select printing for {drawer.name}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {prints.map((p) => (
                    <button
                      key={p.id}
                      className="focusable rounded-2xl border border-white/10 p-2 text-left"
                      onClick={() =>
                        active &&
                        save({
                          ...active,
                          cards: active.cards.map((c) =>
                            c.id === drawer.id
                              ? { ...c, scryfallCardId: p.id, printing: p }
                              : c,
                          ),
                          commanders: active.commanders.map((c) =>
                            c.id === drawer.id
                              ? { ...c, scryfallCardId: p.id, printing: p }
                              : c,
                          ),
                        })
                      }
                    >
                      <img src={p.imageUrl} alt="" className="rounded-xl" />
                      <b>
                        {p.set.toUpperCase()} #{p.collectorNumber}
                      </b>
                      <span className="block text-xs text-slate-400">
                        {p.lang} · {p.finishes.join(', ')} ·{' '}
                        {p.prices.usd ? '$' + p.prices.usd : 'no price'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
function Panel({
  title,
  data,
}: {
  title: string;
  data?: Record<string, number>;
}) {
  return (
    <div className="glass rounded-3xl p-4">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-3 space-y-2">
        {Object.entries(data ?? {}).map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-sm">
              <span>{k}</span>
              <b>{v}</b>
            </div>
            <div className="h-2 rounded bg-white/10">
              <div
                className="h-2 rounded bg-cyan-300"
                style={{ width: `${Math.min(100, v * 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
