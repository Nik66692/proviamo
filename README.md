# Aetherdeck

A modern, engine-aware Commander deckbuilding and deck-library application.

This repository is being developed with Codex. The initial product specification is in [`SPEC.md`](./SPEC.md), and agent instructions are in [`AGENTS.md`](./AGENTS.md).

## Initial product goals

- Import and export Commander decklists.
- Browse and select every available Scryfall printing and artwork.
- Build polished, editable deck primers.
- Show detailed mana, price, type, role, combo and Commander-bracket analysis.
- Map each deck's engines, enablers, payoffs, redundancy and win conditions.
- Provide explainable AI-assisted diagnostics and card suggestions.
- Never recommend Game Changers unless the user explicitly enables them.

## Planned first milestone

A responsive Next.js prototype with local persistence, live Scryfall card data, text import, deck editing, art selection and deterministic deck analysis. Authentication, cloud persistence and AI-provider integration follow after the core deck model is stable.
