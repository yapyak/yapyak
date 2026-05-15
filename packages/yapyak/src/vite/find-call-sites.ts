export interface CallSite {
  argsStart: number;
  callEnd: number;
  callStart: number;
  fixedLocale: string | undefined;
}

export function findCallSites(code: string): CallSite[] {
  const aliases = collectAliases(code);
  if (aliases.size === 0) {
    return [];
  }
  const sites: CallSite[] = [];
  const aliasUnion = [...aliases].map(escapeRegex).join('|');

  const directRx = new RegExp(`(?<![\\w.$])(?:${aliasUnion})\\s*\\(`, 'g');
  let match: RegExpExecArray | null = directRx.exec(code);
  while (match !== null) {
    sites.push({
      argsStart: match.index + match[0].length,
      callEnd: -1,
      callStart: match.index,
      fixedLocale: undefined,
    });
    match = directRx.exec(code);
  }

  const localeRx = new RegExp(
    `(?<![\\w.$])(?:${aliasUnion})\\s*\\.\\s*in\\s*\\(\\s*(['"])([^'"]+)\\1\\s*\\)\\s*\\(`,
    'g',
  );
  let localeMatch: RegExpExecArray | null = localeRx.exec(code);
  while (localeMatch !== null) {
    const fixedLocale = localeMatch[2];
    if (fixedLocale !== undefined) {
      sites.push({
        argsStart: localeMatch.index + localeMatch[0].length,
        callEnd: -1,
        callStart: localeMatch.index,
        fixedLocale,
      });
    }
    localeMatch = localeRx.exec(code);
  }

  return dedupeAndOrder(sites);
}

function collectAliases(code: string): Set<string> {
  const aliases = new Set<string>();
  const importRx =
    /import\s*(?:type\s+)?\{\s*([^}]+)\s*\}\s*from\s*(['"])(yapyak(?:\/[^'"]+)?)\2/g;
  let match: RegExpExecArray | null = importRx.exec(code);
  while (match !== null) {
    const inside = match[1];
    if (inside !== undefined) {
      for (const part of inside.split(',')) {
        const aliasName = parseImportSpecifier(part);
        if (aliasName !== null) {
          aliases.add(aliasName);
        }
      }
    }
    match = importRx.exec(code);
  }
  return aliases;
}

function parseImportSpecifier(part: string): string | null {
  const trimmed = part.trim();
  if (trimmed === '') {
    return null;
  }
  const asMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
  if (asMatch !== null) {
    const original = asMatch[1];
    const alias = asMatch[2];
    if (original === 't' && alias !== undefined) {
      return alias;
    }
    return null;
  }
  if (trimmed === 't') {
    return 't';
  }
  return null;
}

function dedupeAndOrder(sites: CallSite[]): CallSite[] {
  const seen = new Set<number>();
  const ordered = sites.sort((a, b) => a.callStart - b.callStart);
  const out: CallSite[] = [];
  for (const site of ordered) {
    if (seen.has(site.callStart)) {
      continue;
    }
    seen.add(site.callStart);
    out.push(site);
  }
  return out;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
