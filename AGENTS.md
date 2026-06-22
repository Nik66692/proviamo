# AGENTS.md

## Mission

Build Aetherdeck according to `SPEC.md`. Prioritize a polished, working vertical slice over broad but fake functionality.

## Product priorities

1. Engine-centric deck understanding.
2. Explainable deterministic analysis.
3. Excellent deck importing and printing/art selection.
4. Premium responsive user experience.
5. Clean abstractions for later AI, combo and cloud services.

## Non-negotiable recommendation rules

- Generic staples are not the default answer.
- Recommendations must strengthen a demonstrated engine, fix a measured bottleneck, add useful redundancy or replace an off-plan card.
- The `Allow Game Changers` preference defaults to `false`.
- When false, recommendation filtering must exclude every card currently marked as a Game Changer.
- Existing Game Changers in imported decks must still be detected and reported.
- Do not permanently hard-code volatile Commander policy. Keep bracket and Game Changer rules behind updateable configuration/provider interfaces.

## Engineering standards

- Use Next.js App Router and strict TypeScript.
- Prefer small, composable modules with explicit types.
- Keep UI components separate from domain calculations and service integrations.
- Do not expose secrets in client code.
- Do not commit generated credentials or `.env` files.
- Validate external API responses at boundaries.
- Use accessible labels, keyboard navigation and visible focus states.
- Support desktop and mobile layouts.
- Avoid `any` unless isolated and justified.
- Avoid giant components and duplicated business logic.

## Required service boundaries

Create interfaces or equivalent abstractions for:

- `CardDataProvider`
- `DeckRepository`
- `ComboProvider`
- `AiAnalysisProvider`
- `PriceProvider` if not included in card data
- bracket/power rules configuration

The first build may use local/mock implementations for services not yet integrated.

## Card identity

- Use Oracle identity for rules analysis and deduplication.
- Preserve the selected Scryfall printing ID for artwork, set, finish and price display.
- Handle double-faced and multi-image cards deliberately.

## Analysis rules

- Compute facts in deterministic code.
- AI must never invent counts, prices, legality, combo presence, bracket signals or mana statistics.
- Show calculation assumptions where probabilities or estimates are used.
- Every aggregate category must allow later user overrides.

## Testing

At minimum, add tests for:

- common decklist quantity formats
- section parsing
- unresolved card handling
- mana curve calculations
- color requirement/source calculations where implemented
- Game Changer exclusion when `allowGameChangers` is false
- persistence serialization round-trip

## Workflow

Before finishing a task:

1. Read `SPEC.md` and this file.
2. Inspect existing code before changing architecture.
3. Implement the smallest complete slice that satisfies the task.
4. Run formatter, lint, type-check, tests and production build when available.
5. Fix failures caused by the change.
6. Report commands run, results and anything unverified.

## Honesty

Do not present placeholder, mocked or future functionality as complete. Clearly label local-only persistence, mocked AI, missing credentials and incomplete integrations in both UI and documentation.
