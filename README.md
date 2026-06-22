# Majestic-12 TCG Studio

A browser-based card editor, template designer, card library and print-export tool for creating a complete custom trading card game.

This repository intentionally contains a dependency-free static web application. Open `index.html` directly or deploy the repository to any static host such as Vercel, GitHub Pages, Netlify or Cloudflare Pages.

## Main features

- Ten radically different card layouts:
  - Cyber Dossier
  - Classic TCG
  - Full Art Cinematic
  - Minimal Frameless
  - Split Intel
  - Artifact Blueprint
  - Propaganda Poster
  - Omega Ritual
  - Token Showcase
  - Landscape Event
- Standard, tarot, square, landscape and custom card dimensions.
- Independent typography for title, subtitle, type line, rules, flavor, statistics and footer.
- Around thirty included display, technical, terminal, serif and editorial font choices.
- Custom CSS font stack support.
- Template geometry controls for title, artwork, type line, rules box, margins, corners and frame thickness.
- Full-art and framed artwork modes with pan, zoom, fit and image filters.
- Up to six configurable resource symbols and four configurable statistics.
- Card rarity, secrecy, set, collector number, archive code, keywords and internal tags.
- Local card library using IndexedDB, including artwork.
- Reusable custom templates.
- Automatic local draft saving.
- Undo/redo and keyboard shortcuts.
- Card JSON import/export.
- Full project backup and restore.
- High-resolution PNG export.
- A4 300-DPI 3×3 print-sheet export with optional cut marks.

## Data and privacy

Cards, templates and artwork remain in the browser. Nothing is uploaded to a server by this application.

Export a project backup regularly because browser storage can be cleared by the user, browser or device.

## Keyboard shortcuts

- `Ctrl/Cmd + S`: save the current card to the local library
- `Ctrl/Cmd + Z`: undo
- `Ctrl/Cmd + Y`: redo
- `Ctrl/Cmd + E`: export PNG

## Deployment

No build command is required. The root directory is the output directory.

For Vercel:

1. Import this GitHub repository.
2. Select **Other** as the framework if needed.
3. Leave Build Command empty.
4. Leave Output Directory as `.`.
5. Deploy.

## Important implementation note

The application uses Google Fonts when an internet connection is available and falls back to compatible system fonts when it is offline.
