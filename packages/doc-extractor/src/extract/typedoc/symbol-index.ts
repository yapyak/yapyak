import type { ReferenceManifest } from './type.ts';

export type SymbolIndex = Map<string, string>;

export function buildSymbolIndex(manifest: ReferenceManifest): SymbolIndex {
  const index: SymbolIndex = new Map();
  for (const module of manifest.modules) {
    for (const entry of module.exports) {
      const key = `${module.id}::${entry.name}`;
      index.set(key, module.id);
      if (!index.has(entry.name)) {
        index.set(entry.name, module.id);
      }
    }
  }
  return index;
}
