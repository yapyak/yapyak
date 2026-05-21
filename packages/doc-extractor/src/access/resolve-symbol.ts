import type { Manifest, SymbolEntry } from '../types/manifest.ts';

export function resolveSymbol(
  manifest: Manifest,
  symbolName: string,
): SymbolEntry | null {
  return manifest.symbols[symbolName] ?? null;
}
