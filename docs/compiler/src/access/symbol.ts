import type { Manifest, SymbolEntry } from '../build';

export function resolveSymbol(
  manifest: Manifest,
  symbolName: string,
): SymbolEntry | undefined {
  const direct = manifest.symbols[symbolName];
  if (direct) {
    return direct;
  }
  let match: SymbolEntry | undefined;
  for (const [key, entry] of Object.entries(manifest.symbols)) {
    const slashIndex = key.lastIndexOf('/');
    const tail = slashIndex === -1 ? key : key.slice(slashIndex + 1);
    if (tail !== symbolName) {
      continue;
    }
    if (match !== undefined) {
      return undefined;
    }
    match = entry;
  }
  return match;
}
