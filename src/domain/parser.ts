import type { BoardSection, ParsedLine, UnresolvedLine } from './types';
const sectionMap: Record<string, BoardSection> = {
  commander: 'commander',
  commanders: 'commander',
  mainboard: 'mainboard',
  deck: 'mainboard',
  sideboard: 'sideboard',
  maybeboard: 'maybeboard',
  considering: 'considering',
};
export function parseDeckText(input: string) {
  let section: BoardSection = 'mainboard';
  const parsed: ParsedLine[] = [];
  const unresolved: UnresolvedLine[] = [];
  for (const rawLine of input.split(/\r?\n/)) {
    const raw = rawLine.trim();
    if (!raw || raw.startsWith('//')) continue;
    const header = raw.replace(/:$/, '').toLowerCase();
    if (sectionMap[header]) {
      section = sectionMap[header];
      continue;
    }
    const cleaned = raw.replace(/^SB:\s*/i, '');
    const match = cleaned.match(/^(?:(\d+)\s*x?\s+|x(\d+)\s+)(.+)$/i);
    if (!match) {
      unresolved.push({ raw, reason: 'No quantity/name pattern found' });
      continue;
    }
    const quantity = Number(match[1] ?? match[2]);
    let name = match[3].replace(/\s*\([^)]*\)\s*\d*.*$/, '').trim();
    name = name.replace(/\s+\[.*\]$/, '').trim();
    if (!name || quantity < 1)
      unresolved.push({ raw, reason: 'Missing card name or valid quantity' });
    else parsed.push({ raw, quantity, name, section });
  }
  return { parsed, unresolved };
}
