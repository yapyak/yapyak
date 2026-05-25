import type { Placeholder } from './type';

export type PlaceholderKind = Placeholder['kind'];

export type PlaceholderInvalidReason = 'plural-missing-other';

export interface PlaceholderInfo {
  invalid?: PlaceholderInvalidReason;
  kind: PlaceholderKind;
  name: string;
  variants?: Record<string, string>;
}

export function parsePlaceholders(source: string): PlaceholderInfo[] {
  const results: PlaceholderInfo[] = [];
  const seen = new Set<string>();
  let i = 0;
  while (i < source.length) {
    if (source[i] !== '{') {
      i += 1;
      continue;
    }
    const close = findMatchingBrace(source, i);
    const inner = source.slice(i + 1, close);
    const info = parsePlaceholderInner(inner);
    if (info !== undefined && !seen.has(info.name)) {
      seen.add(info.name);
      results.push(info);
    }
    i = close + 1;
  }
  return results;
}

function parsePlaceholderInner(inner: string): PlaceholderInfo | undefined {
  const trimmed = inner.trim();
  const nameMatch = /^([A-Z_$a-z][\w$]*)/.exec(trimmed);
  if (nameMatch === null) {
    return undefined;
  }
  const name = nameMatch[1];
  if (name === undefined) {
    return undefined;
  }

  const afterName = trimmed.slice(name.length).trimStart();
  if (afterName === '' || !afterName.startsWith(',')) {
    return { kind: 'simple', name };
  }

  const afterComma = afterName.slice(1).trimStart();
  const typeMatch = /^(date|number|plural|select|selectordinal|time)\b/.exec(
    afterComma,
  );
  if (typeMatch === null) {
    return { kind: 'simple', name };
  }
  const type = typeMatch[1];
  if (type === undefined) {
    return undefined;
  }
  const afterType = afterComma.slice(type.length).trimStart();

  if (type === 'plural' || type === 'selectordinal') {
    return readPluralInfo(name, afterType);
  }
  if (type === 'select') {
    return readSelectInfo(name, afterType);
  }
  if (type === 'date' || type === 'number' || type === 'time') {
    return { kind: type, name };
  }
  return { kind: 'simple', name };
}

function readPluralInfo(name: string, rest: string): PlaceholderInfo {
  if (!rest.startsWith(',')) {
    return { invalid: 'plural-missing-other', kind: 'plural', name };
  }
  const branches = readBranches(rest.slice(1).trimStart());
  if (!Object.hasOwn(branches, 'other')) {
    const info: PlaceholderInfo = {
      invalid: 'plural-missing-other',
      kind: 'plural',
      name,
    };
    if (Object.keys(branches).length > 0) {
      info.variants = branches;
    }
    return info;
  }
  return { kind: 'plural', name, variants: branches };
}

function readSelectInfo(name: string, rest: string): PlaceholderInfo {
  if (!rest.startsWith(',')) {
    return { kind: 'select', name };
  }
  const branches = readBranches(rest.slice(1).trimStart());
  return { kind: 'select', name, variants: branches };
}

function readBranches(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  let i = 0;
  while (i < text.length) {
    while (i < text.length && isWhitespace(text[i])) i += 1;
    if (i >= text.length) {
      break;
    }
    const keyMatch = /^(=?\w+)/.exec(text.slice(i));
    if (keyMatch === null) {
      break;
    }
    const key = keyMatch[1];
    if (key === undefined) {
      break;
    }
    i += key.length;
    while (i < text.length && isWhitespace(text[i])) i += 1;
    if (text[i] !== '{') {
      break;
    }
    const close = findMatchingBrace(text, i);
    result[key] = text.slice(i + 1, close);
    i = close + 1;
  }
  return result;
}

function findMatchingBrace(source: string, openIdx: number): number {
  let depth = 1;
  let i = openIdx + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
    i += 1;
  }
  return source.length;
}

function isWhitespace(ch: string | undefined): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}
