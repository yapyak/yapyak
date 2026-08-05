export type SymbolIndexEntry = {
  callable: boolean;
  callableMemberNames: Set<string>;
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
  sourceModuleId?: string,
): SymbolIndexEntry | undefined {
  const trimmed = reference.trim();
  if (trimmed === '') {
    return undefined;
  }
  const direct = lookupWithModulePreference(index, trimmed, sourceModuleId);
  if (direct !== undefined) {
    return direct;
  }
  const split = trimmed.search(MEMBER_PATH_RX);
  if (split === -1) {
    return undefined;
  }
  const base = trimmed.slice(0, split);
  const member = trimmed.slice(split + 1);
  const baseEntry = lookupWithModulePreference(index, base, sourceModuleId);
  if (baseEntry === undefined) {
    return undefined;
  }
  const memberHref = baseEntry.hrefsByMemberName.get(member);
  if (memberHref === undefined) {
    return undefined;
  }
  return {
    ...baseEntry,
    callable: baseEntry.callableMemberNames.has(member),
    callableMemberNames: new Set(),
    href: memberHref,
    name: `${baseEntry.name}.${member}`,
  };
}

function lookupWithModulePreference(
  index: SymbolIndex,
  name: string,
  sourceModuleId: string | undefined,
): SymbolIndexEntry | undefined {
  if (sourceModuleId !== undefined) {
    const qualified = index.get(`${sourceModuleId}::${name}`);
    if (qualified !== undefined) {
      return qualified;
    }
  }
  return index.get(name);
}
