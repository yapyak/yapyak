export type SymbolIndexEntry = {
  href: string;
  hrefsByMemberName: Map<string, string>;
  moduleId: string;
  name: string;
  packageSlug: string;
};

export type SymbolIndex = Map<string, SymbolIndexEntry>;

export function buildSymbolIndex(entries: SymbolIndexEntry[]): SymbolIndex {
  const index: SymbolIndex = new Map();
  for (const entry of entries) {
    index.set(`${entry.moduleId}::${entry.name}`, entry);
    if (!index.has(entry.name)) {
      index.set(entry.name, entry);
    }
  }
  return index;
}

const MEMBER_PATH_RX = /[.#]/;

export function resolveSymbolLink(
  index: SymbolIndex,
  reference: string,
): SymbolIndexEntry | undefined {
  const trimmed = reference.trim();
  if (trimmed === '') {
    return undefined;
  }
  const direct = index.get(trimmed);
  if (direct) {
    return direct;
  }
  const split = trimmed.search(MEMBER_PATH_RX);
  if (split === -1) {
    return undefined;
  }
  const base = trimmed.slice(0, split);
  const member = trimmed.slice(split + 1);
  const baseEntry = index.get(base);
  if (baseEntry === undefined) {
    return undefined;
  }
  const memberHref = baseEntry.hrefsByMemberName.get(member);
  if (memberHref === undefined) {
    return undefined;
  }
  return {
    ...baseEntry,
    href: memberHref,
    name: `${baseEntry.name}.${member}`,
  };
}
