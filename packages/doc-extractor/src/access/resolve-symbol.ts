import type { Manifest, SymbolEntry } from '../types/manifest.ts';

export function resolveSymbol(
  manifest: Manifest,
  symbolName: string,
): SymbolEntry | null {
  const direct = manifest.symbols[symbolName];
  if (direct !== undefined) {
    return direct;
  }
  // Allow bare-name lookup that finds any matching qualified key.
  // Returns null if multiple packages export the same name (ambiguous).
  let match: SymbolEntry | null = null;
  for (const [key, entry] of Object.entries(manifest.symbols)) {
    const slashIndex = key.lastIndexOf('/');
    const tail = slashIndex === -1 ? key : key.slice(slashIndex + 1);
    if (tail !== symbolName) {
      continue;
    }
    if (match !== null) {
      return null;
    }
    match = entry;
  }
  return match;
}
