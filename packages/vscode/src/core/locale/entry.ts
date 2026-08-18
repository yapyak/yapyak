import { isWhitespace, skipWhitespace } from '../whitespace';

export type LocaleEntry = {
  context?: string;
  fileId: string;
  fileOffset: number;
  keyOffset: number;
  length: number;
  offset: number;
  source: string;
};

export function collectLocaleEntries(text: string): LocaleEntry[] {
  const entries: LocaleEntry[] = [];
  const keys: string[] = [];
  const keyOffsets: number[] = [];
  let depth = 0;
  let index = 0;
  while (index < text.length) {
    const character = text[index];
    if (character === '{') {
      depth += 1;
      index += 1;
      continue;
    }
    if (character === '}') {
      depth -= 1;
      index += 1;
      continue;
    }
    if (character !== '"') {
      index += 1;
      continue;
    }
    const start = index + 1;
    const end = skipString(text, index);
    if (end === undefined) {
      return entries;
    }
    index = end;
    const value = text.slice(start, index - 1);
    if (text[skipWhitespace(text, index)] === ':') {
      keys[depth] = value;
      keyOffsets[depth] = start - 1;
      continue;
    }
    const fileId = keys[1];
    const fileOffset = keyOffsets[1];
    const source = keys[2];
    if (
      fileId === undefined ||
      fileOffset === undefined ||
      source === undefined ||
      depth < 2
    ) {
      continue;
    }
    const context = depth === 3 ? keys[3] : undefined;
    entries.push({
      ...(context === undefined
        ? {}
        : {
            context,
          }),
      fileId,
      fileOffset,
      keyOffset: keyOffsets[depth] ?? start - 1,
      length: index - 1 - start,
      offset: start,
      source,
    });
  }
  return entries;
}

export type FindEntryAtInput = {
  entries: LocaleEntry[];
  lineEnd: number;
  lineStart: number;
  offset: number;
};

export function findEntryAt(input: FindEntryAtInput): LocaleEntry | undefined {
  const inSpan = input.entries.find(
    (entry) =>
      input.offset >= entry.keyOffset &&
      input.offset <= entry.offset + entry.length,
  );
  if (inSpan !== undefined) {
    return inSpan;
  }
  return input.entries.find(
    (entry) =>
      entry.keyOffset >= input.lineStart && entry.keyOffset <= input.lineEnd,
  );
}

export type FileKey = {
  fileId: string;
  offset: number;
};

export function collectFileKeys(entries: LocaleEntry[]): FileKey[] {
  const keys: FileKey[] = [];
  const seen = new Set<number>();
  for (const entry of entries) {
    if (seen.has(entry.fileOffset)) {
      continue;
    }
    seen.add(entry.fileOffset);
    keys.push({
      fileId: entry.fileId,
      offset: entry.fileOffset,
    });
  }
  return keys;
}

export function findFileKeyAt(
  entries: LocaleEntry[],
  offset: number,
): FileKey | undefined {
  return collectFileKeys(entries).find(
    (key) =>
      offset >= key.offset && offset <= key.offset + key.fileId.length + 1,
  );
}

export type DeletionRange = {
  end: number;
  start: number;
};

export function resolveDeletionRange(
  text: string,
  entry: LocaleEntry,
): DeletionRange {
  const valueEnd = entry.offset + entry.length + 1;
  let before = entry.keyOffset - 1;
  while (before >= 0 && isWhitespace(text[before])) {
    before -= 1;
  }
  if (text[before] === ',') {
    return {
      end: valueEnd,
      start: before,
    };
  }
  let after = valueEnd;
  while (after < text.length && isWhitespace(text[after])) {
    after += 1;
  }
  if (text[after] === ',') {
    return {
      end: after + 1,
      start: entry.keyOffset,
    };
  }
  return {
    end: valueEnd,
    start: entry.keyOffset,
  };
}

function skipString(text: string, start: number): number | undefined {
  let index = start + 1;
  while (index < text.length) {
    const character = text[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    if (character === '"') {
      return index + 1;
    }
    index += 1;
  }
  return undefined;
}
