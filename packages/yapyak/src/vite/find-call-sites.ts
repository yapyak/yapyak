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
  const scannable = maskInactiveRegions(code);

  const directRx = new RegExp(`(?<![\\w.$])(?:${aliasUnion})\\s*\\(`, 'g');
  let match: RegExpExecArray | null = directRx.exec(scannable);
  while (match !== null) {
    sites.push({
      argsStart: match.index + match[0].length,
      callEnd: -1,
      callStart: match.index,
      fixedLocale: undefined,
    });
    match = directRx.exec(scannable);
  }

  const localeRx = new RegExp(
    `(?<![\\w.$])(?:${aliasUnion})\\s*\\.\\s*in\\s*\\(\\s*(['"])([^'"]+)\\1\\s*\\)\\s*\\(`,
    'g',
  );
  let localeMatch: RegExpExecArray | null = localeRx.exec(scannable);
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
    localeMatch = localeRx.exec(scannable);
  }

  return dedupeAndOrder(sites);
}

function maskInactiveRegions(code: string): string {
  const chars = code.split('');
  const stack: { braceDepth: number; mode: Mode; quote: string | undefined }[] =
    [{ braceDepth: 0, mode: 'code', quote: undefined }];
  let i = 0;

  while (i < code.length) {
    const state = stack[stack.length - 1] as (typeof stack)[number];
    const ch = code[i] as string;

    if (state.mode === 'code' || state.mode === 'interp') {
      if (ch === '/' && code[i + 1] === '/') {
        const newline = code.indexOf('\n', i);
        const stop = newline === -1 ? code.length : newline;
        for (let k = i; k < stop; k++) {
          chars[k] = ' ';
        }
        i = stop;
        continue;
      }
      if (ch === '/' && code[i + 1] === '*') {
        const closing = code.indexOf('*/', i + 2);
        const stop = closing === -1 ? code.length : closing + 2;
        for (let k = i; k < stop; k++) {
          if (chars[k] !== '\n') {
            chars[k] = ' ';
          }
        }
        i = stop;
        continue;
      }
      if (ch === "'" || ch === '"') {
        stack.push({ braceDepth: 0, mode: 'string', quote: ch });
        i++;
        continue;
      }
      if (ch === '`') {
        stack.push({ braceDepth: 0, mode: 'template', quote: undefined });
        i++;
        continue;
      }
      if (state.mode === 'interp') {
        if (ch === '{') {
          state.braceDepth++;
        } else if (ch === '}') {
          state.braceDepth--;
          if (state.braceDepth === 0) {
            stack.pop();
            i++;
            continue;
          }
        }
      }
      i++;
      continue;
    }

    if (state.mode === 'string') {
      if (ch === '\\') {
        chars[i] = ' ';
        if (i + 1 < code.length && code[i + 1] !== '\n') {
          chars[i + 1] = ' ';
        }
        i += 2;
        continue;
      }
      if (ch === state.quote) {
        stack.pop();
        i++;
        continue;
      }
      if (ch !== '\n') {
        chars[i] = ' ';
      }
      i++;
      continue;
    }

    if (state.mode === 'template') {
      if (ch === '\\') {
        chars[i] = ' ';
        if (i + 1 < code.length && code[i + 1] !== '\n') {
          chars[i + 1] = ' ';
        }
        i += 2;
        continue;
      }
      if (ch === '`') {
        stack.pop();
        i++;
        continue;
      }
      if (ch === '$' && code[i + 1] === '{') {
        stack.push({ braceDepth: 1, mode: 'interp', quote: undefined });
        i += 2;
        continue;
      }
      if (ch !== '\n') {
        chars[i] = ' ';
      }
      i++;
    }
  }

  return chars.join('');
}

type Mode = 'code' | 'interp' | 'string' | 'template';

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
