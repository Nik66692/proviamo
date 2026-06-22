# Aetherdeck — Product Specification

## 1. Product vision

Aetherdeck is a stylish, modern Commander deckbuilding and deck-library web app inspired by the best parts of Archidekt, Moxfield and dedicated deck-analysis tools, but designed around a deeper understanding of how a deck actually works.

The product must not treat a deck as a pile of generic categories. It should model engines, enablers, payoffs, redundancy, interaction, resource flow and win conditions, then use deterministic analysis plus optional AI assistance to explain weaknesses and suggest coherent changes.

The user is experienced and will judge suggestions critically. Recommendations must therefore be transparent, evidence-based, dismissible and easy to tune.

## 2. Core principles

1. **Engine-first analysis**
   - Prefer cards that strengthen the deck's actual engines and game plan.
   - Avoid defaulting to generic Commander staples.
   - Every recommendation must explain what role it fills and which existing cards it connects to.

2. **Deterministic before generative**
   - Calculate deck facts in code first: mana curve, color requirements, land/ramp ratios, card types, prices, interaction counts, combo matches, bracket-relevant signals and role distribution.
   - AI may interpret those facts, write explanations and propose changes, but must not invent deck statistics.

3. **User-controlled power intent**
   - The user selects desired play experience, target bracket and tolerance for combos, tutors, fast mana, mass land denial, extra turns and Game Changers.
   - Suggestions must respect these constraints.

4. **Game Changers require explicit consent**
   - Add a checkbox labelled `Allow Game Changers`.
   - Default: unchecked.
   - When unchecked, Game Changers must be excluded from recommendations.
   - Existing Game Changers in an imported deck are still detected and displayed.
   - When checked, suggestions may include them only when compatible with the selected target bracket and strategy.
   - Never hard-code the list permanently; obtain current status from card data or an updateable rules source.

5. **Explainability and feedback**
   - Every AI suggestion includes: add, optional cut, role, reason, engine connections, expected benefit, trade-off and confidence.
   - The user can approve, dismiss or mark a suggestion as bad/irrelevant.
   - Store feedback locally initially and later per account to improve future rankings.

6. **Art is part of deck identity**
   - A card may use any available Scryfall printing or artwork selected by the user.
   - Deck identity must preserve the selected printing, not only the Oracle card.

## 3. Target platform and initial stack

### Milestone 1

- Next.js with App Router
- TypeScript in strict mode
- Tailwind CSS
- Accessible component system
- Local persistence using IndexedDB or a clean storage adapter
- Scryfall integration through a server-side proxy/cache layer
- No mandatory authentication
- No paid AI dependency required for the first usable build

### Later milestones

- Supabase authentication and PostgreSQL persistence
- User profiles and private/public deck sharing
- AI provider abstraction supporting OpenAI first and other providers later
- Background metadata refresh jobs
- Social features, comments and deck version history

The architecture must keep external services behind interfaces so local/mock implementations can be replaced without rewriting UI components.

## 4. Main user journeys

### 4.1 Create a deck

- Start from a Commander search.
- Choose the Commander printing/art.
- Set deck name, description, tags, target bracket and deck intent.
- Add cards through autocomplete, search filters or bulk text paste.
- Organize cards into custom categories and system-generated roles.

### 4.2 Import a deck

Supported initial inputs:

- Plain text decklist
- Arena-style quantities
- MTGO-style text
- Common `1 Card Name` and `1x Card Name` formats
- Sections such as Commander, Mainboard, Sideboard, Maybeboard and Considering
- URLs or structured imports from other deck sites in later iterations

Import behavior:

- Resolve names robustly through Scryfall.
- Report unresolved or ambiguous lines instead of silently dropping them.
- Preserve quantities, section and chosen printing when identifiers are provided.
- Offer a post-import review screen.

### 4.3 Edit card artwork/printing

- Clicking a card opens a detailed drawer/modal.
- Show all printings grouped by artwork where practical.
- Display set, collector number, language, frame, finish availability and price.
- Allow filtering by paper availability, language, border/frame and promotional treatment.
- Selecting a printing updates the deck entry while preserving the Oracle identity used for analysis.

### 4.4 Analyze a deck

The analysis page combines charts, factual diagnostics and optional AI interpretation.

### 4.5 Write a primer

- Rich, structured primer editor rather than one giant text box.
- Sections can be reordered, hidden and published.
- Auto-generated first draft from actual deck analysis, always editable.
- Export as Markdown and printable HTML/PDF later.

### 4.6 Export a deck

Initial formats:

- Plain text
- MTGO-compatible text where possible
- Arena-style text
- Markdown decklist
- JSON backup preserving categories, primer, tags, selected printings and analysis preferences

Later:

- Direct integrations or site-specific formats where permitted and technically stable

## 5. Deck data model

### Deck

- id
- ownerId nullable for local mode
- name
- slug
- description
- format (`commander` initially)
- commanders
- cards
- customCategories
- tags
- primer
- targetBracket
- powerPreferences
- budgetPreferences
- visibility
- createdAt
- updatedAt
- version

### DeckCard

- id
- oracleId
- scryfallCardId for selected printing
- name
- quantity
- board/section
- customCategoryIds
- userRoleOverrides
- notes
- tags
- isFoilPreference
- addedAt

### PowerPreferences

- targetBracket
- allowGameChangers: boolean, default false
- allowInfiniteCombos
- maximumComboCardCount
- allowTutors
- allowFastMana
- allowExtraTurns
- allowMassLandDenial
- desiredGameLength
- desiredConsistency
- desiredInteractionLevel
- budgetMode
- maximumCardPrice nullable

### Primer

Structured blocks:

- overview
- deckPhilosophy
- powerAndRuleZero
- primaryGamePlan
- secondaryGamePlans
- enginePackages
- openingHandsAndMulligans
- earlyGame
- midGame
- lateGame
- interactionGuide
- comboLines
- winConditions
- weaknesses
- matchupNotes
- budgetAlternatives
- changelog
- custom sections

## 6. Card role ontology

A card can have multiple roles with confidence scores and evidence.

### Strategic roles

- Commander
- Engine
- Enabler
- Payoff
- Finisher
- Win condition
- Combo piece
- Tutor
- Recursion
- Protection
- Removal
- Countermagic
- Board wipe
- Stax/disruption
- Card draw
- Card selection
- Ramp
- Ritual/temporary mana
- Cost reduction
- Land/ramp fixing
- Sacrifice outlet
- Token generator
- Graveyard setup
- Blink enabler
- Copy effect
- Untap effect
- Life gain
- Life loss/drain
- Aristocrats payoff
- Tribal support
- Equipment/aura support
- Other extensible role

### Engine graph model

Represent the deck as a directed graph where nodes are cards or abstract resources and edges describe relationships:

- produces
- consumes
- enables
- triggers
- protects
- tutors
- recurs
- copies
- amplifies
- converts resource A into resource B
- finishes through

Example abstract resources:

- cards in hand
- mana
- creatures
- tokens
- artifacts
- enchantments
- sacrifice fodder
- graveyard cards
- counters
- life
- opponent life loss
- cast triggers
- death triggers

Analysis should identify engine packages rather than evaluating each card in isolation.

## 7. Deterministic deck analysis

### 7.1 Deck legality and integrity

- Commander color identity
- Singleton exceptions
- Exact deck count
- Banned cards
- Partner/background/doctor/companion-style commander rules where supported
- Unresolved cards
- Duplicates

### 7.2 Mana analysis

- Mana value curve
- Mana value curve excluding lands
- Commander-inclusive and commander-exclusive views
- Pip/color requirement distribution
- Colored source estimates by turn
- Land count
- MDFC handling
- Ramp count and ramp mana values
- Fast mana count
- Average mana value
- Median mana value
- Opening-hand land probabilities
- Probability of reaching key mana thresholds, using clearly labelled assumptions
- Separate permanent ramp, rituals, cost reducers and land-fetch ramp

### 7.3 Type and subtype analysis

- Main card types
- Creature/noncreature split
- Permanent/nonpermanent split
- Subtypes and tribal density
- Artifact/enchantment density
- Legendary density
- Token and counter themes

### 7.4 Functional category analysis

- Draw and selection
- Ramp and fixing
- Spot interaction
- Board wipes
- Protection
- Recursion
- Tutors
- Graveyard interaction
- Win conditions
- Engine pieces
- Enablers
- Payoffs
- Redundancy

Counts must show the rule/evidence used and allow manual user corrections.

### 7.5 Engine health analysis

For each detected engine package, calculate:

- number of engines
- number of enablers
- number of payoffs
- number of redundant pieces
- tutor access
- recursion/protection
- cards that only function when another specific card is present
- bottlenecks and single points of failure
- competing packages that dilute each other
- cards supporting multiple packages
- likely dead draws

Provide a deck-level `engine cohesion` score, but always show its components; never present a mysterious single number.

### 7.6 Combo analysis

- Detect known combos using an integration abstraction, initially compatible with Commander Spellbook or imported combo data.
- Show combo pieces already present, missing pieces and result.
- Distinguish infinite, deterministic win, lock, high-value loop and synergy.
- Respect user combo preferences in recommendations.
- Never label a synergy as infinite without sourced combo evidence or a deterministic rules proof.

### 7.7 Price analysis

- Total deck price by supported currency/source
- Selected-printing price and cheapest-printing alternative
- Price distribution
- Most expensive cards
- Budget replacement opportunities
- Price timestamp and source
- Toggle foil/nonfoil where data exists

Prices are volatile; always display last-updated information and never treat cached price as guaranteed.

### 7.8 Commander bracket and power analysis

Display:

- estimated bracket
- selected target bracket
- confidence
- signals that raise or lower the estimate
- Game Changer count and identities
- combo characteristics
- fast mana
- tutors
- extra turns
- mass land denial
- lock pieces
- interaction density
- consistency indicators
- expected closing turns as a rough, explicitly uncertain estimate

Do not reduce power to a single opaque score. The bracket engine must be rules/config driven and updateable because official guidance can change.

## 8. AI-assisted analysis

AI is optional and sits on top of deterministic results.

### 8.1 AI inputs

- normalized decklist
- Commander and color identity
- selected printing only when visually relevant
- role map
- engine graph summary
- deterministic statistics
- target bracket
- power preferences
- budget
- user-written deck intent
- dismissed/accepted suggestion feedback

### 8.2 AI outputs

#### Deck diagnosis

- concise summary of what the deck is trying to do
- strongest engine packages
- weak or under-supported packages
- resource bottlenecks
- likely consistency issues
- interaction/protection issues
- mismatches between stated intent and actual list

#### Suggestions

Each suggestion must include:

- card to add
- optional card to cut
- printing-independent identity
- strategic role
- engine/package affected
- exact reason
- existing cards it synergizes with
- expected improvement
- downside/trade-off
- bracket impact
- Game Changer status
- price/budget impact
- confidence

Ranking priorities:

1. Fix a demonstrated bottleneck.
2. Improve an existing engine.
3. Add redundancy to a core plan.
4. Replace an off-plan or inefficient card.
5. Improve interaction/protection consistent with deck identity.
6. Only then consider generic efficiency staples.

Hard constraints:

- No Game Changer recommendations unless `allowGameChangers` is true.
- No off-color cards.
- No illegal cards.
- No banned cards.
- Respect budget and combo preferences.
- Avoid recommending a card already present unless quantity rules permit it.
- Avoid recommending cuts essential to another detected engine without warning.

### 8.3 User feedback controls

For each suggestion:

- Accept
- Reject
- Not my style
- Too generic
- Too expensive
- Too strong
- Too weak
- Breaks theme
- Incorrect analysis
- Already tested
- Add custom note

Feedback should influence future ranking for that user but never silently rewrite objective deck statistics.

## 9. Primer system

The primer should be one of the product's strongest differentiators.

### Primer editor requirements

- Beautiful reading layout
- Block-based editing
- Autosave
- Drag-and-drop section ordering
- Card mention autocomplete
- Hover/tap card previews
- Inline combo and engine diagrams
- Reusable card packages
- Mobile-friendly
- Public preview mode
- Markdown import/export

### AI primer generation

Generate a structured draft from deck facts:

- accurately reference cards in the current list
- describe actual detected engines
- explain game plans by phase
- provide mulligan examples based on real categories
- include key interaction and protection decisions
- clearly label uncertain strategic interpretation
- regenerate individual sections without overwriting manual edits

## 10. User interface direction

The site should feel premium, modern and more visually distinctive than a spreadsheet-like deck manager.

### Visual language

- Dark-first interface with optional light theme later
- High contrast and excellent readability
- Large card artwork used tastefully
- Glass/metal/digital-fantasy accents without visual clutter
- Smooth but restrained animation
- Dense desktop workspace with a clean mobile mode
- Avoid copying Archidekt's exact visual design

### Primary screens

1. Landing page
2. Local/user deck library
3. New deck flow
4. Deck builder workspace
5. Card search and filters
6. Printing/art picker
7. Analysis dashboard
8. Engine map
9. Combo explorer
10. Primer editor and public primer view
11. Import wizard
12. Export dialog
13. User preferences

### Deck builder layout

Desktop concept:

- left: card search and filters
- center: visual deck board/list with categories
- right: card/deck inspector
- top: deck identity, commander, save and view controls
- bottom or drawer: live analysis alerts

Support multiple deck views:

- visual grid
- compact list
- custom categories
- card type
- mana value
- role
- engine package

## 11. Scryfall integration requirements

Create a typed `CardDataProvider` interface.

Needed capabilities:

- exact/fuzzy card resolution
- autocomplete
- card search
- fetch by Scryfall ID
- fetch by Oracle ID
- retrieve all printings/art variants
- image URIs
- legality
- prices
- color identity
- mana cost and mana value
- type line and Oracle text
- set and collector metadata
- Game Changer signal when available

Implementation requirements:

- access through server routes where practical
- cache responses
- deduplicate requests
- identify the application appropriately
- handle pagination and errors
- do not hotlink or request unnecessarily at abusive rates
- preserve Scryfall attribution where required
- create graceful fallbacks for missing images and double-faced layouts

## 12. Import/export normalization

Create a parser pipeline:

1. Detect likely format.
2. Split sections.
3. Parse quantity, name and optional set/collector information.
4. Normalize card names.
5. Batch-resolve cards.
6. Surface unresolved and ambiguous entries.
7. Validate Commander deck structure.
8. Let the user confirm before saving.

Keep the normalized internal format independent from any third-party site's proprietary format.

## 13. Security and privacy

- Never expose AI API keys to the browser.
- Never commit secrets.
- Validate imported content.
- Sanitize user-generated primer HTML/Markdown.
- Apply rate limiting to expensive endpoints later.
- Decks are private by default once accounts exist.
- Public sharing must be opt-in.

## 14. Testing requirements

- Unit tests for decklist parsing
- Unit tests for mana/color calculations
- Unit tests for role aggregation
- Unit tests for recommendation constraint filtering
- Unit tests proving Game Changers are excluded when checkbox is off
- Integration tests for Scryfall provider using mocked responses
- Component tests for import review and art picker
- Basic end-to-end happy path

## 15. Milestones

### Milestone 1 — Functional local prototype

- App shell and visual system
- Local deck library
- Create/edit/delete deck
- Commander selection
- Card search through Scryfall
- Plain text import with review
- Visual/list deck views
- Printing/art selection
- Basic deterministic charts
- Local persistence
- JSON backup export

### Milestone 2 — Deep analysis

- Role classification framework
- Manual role overrides
- Engine package model
- Engine health diagnostics
- Combo provider abstraction
- Price dashboard
- Config-driven bracket analysis
- Power preference controls including `Allow Game Changers`

### Milestone 3 — Primer and AI

- Structured primer editor
- AI provider abstraction
- AI deck diagnosis
- Engine-centric suggestions
- Add/cut recommendations
- Feedback controls
- AI primer generation

### Milestone 4 — Accounts and publishing

- Supabase auth and database
- Private/public decks
- Share links
- Version history
- Public primer pages
- Import/export integrations

### Milestone 5 — Advanced product

- Collaborative editing
- Collection-aware recommendations
- Meta and matchup modules
- Deck comparison
- Playtest tools
- Mobile/PWA improvements

## 16. First Codex implementation task

Build Milestone 1 as a polished vertical slice.

Required deliverables:

- Next.js TypeScript application
- premium responsive UI
- local deck CRUD
- Scryfall-backed commander/card search
- plain text deck import and review
- deck workspace with grid/list views
- selected printing/art picker
- mana curve, type distribution, color identity/source summary and price summary
- deck settings panel containing target bracket and an unchecked `Allow Game Changers` checkbox
- clean service interfaces for storage, card data, combo data and AI
- tests for parser and core calculations
- README setup instructions
- no secrets and no fake claims of completed backend/AI features

Codex should run lint, type-check and tests before completing the task, and report anything it could not verify.

## 17. Acceptance criteria for the first milestone

- A new visitor can create a local Commander deck.
- They can paste a text list and review parsing problems.
- They can search and add cards.
- They can change a card to another Scryfall printing/art.
- Refreshing the browser preserves the deck locally.
- The deck page displays useful charts and factual summaries.
- The UI clearly exposes target bracket and the default-off Game Changer preference.
- The app works on desktop and mobile.
- Core parser/calculation tests pass.
- Architecture allows later Supabase and AI integration without replacing the whole application.
