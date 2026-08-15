import type { Range } from '../../../processor';

import { rangeFromOffsets } from '../../../processor';

type JsonString = {
  end: number;
  start: number;
  value: string;
};

const ESCAPES: Record<string, string> = {
  '"': '"',
  '/': '/',
  '\\': '\\',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
};

const UNICODE_ESCAPE_LENGTH = 6;

export function findEntryRange(
  content: string,
  fileId: string,
  source: string,
  context?: string,
): Range | undefined {
  const fileValue = findMember(content, 0, fileId);
  if (fileValue === undefined) {
    return undefined;
  }
  const sourceValue = findMember(content, fileValue, source);
  if (sourceValue === undefined) {
    return undefined;
  }
  if (context === undefined) {
    return toStringRange(content, sourceValue);
  }
  const contextValue = findMember(content, sourceValue, context);
  if (contextValue === undefined) {
    return undefined;
  }
  return toStringRange(content, contextValue);
}

function toStringRange(content: string, index: number): Range | undefined {
  const token = scanString(content, index);
  if (token === undefined) {
    return undefined;
  }
  return rangeFromOffsets(content, token.start, token.end);
}

function findMember(
  content: string,
  from: number,
  key: string,
): number | undefined {
  let index = skipWhitespace(content, from);
  if (content[index] !== '{') {
    return undefined;
  }
  index = skipWhitespace(content, index + 1);
  let found: number | undefined;
  while (index < content.length && content[index] !== '}') {
    const token = scanString(content, index);
    if (token === undefined) {
      return found;
    }
    index = skipWhitespace(content, token.end);
    if (content[index] !== ':') {
      return found;
    }
    const value = skipWhitespace(content, index + 1);
    if (token.value === key) {
      found = value;
    }
    index = skipWhitespace(content, skipValue(content, value));
    if (content[index] === ',') {
      index = skipWhitespace(content, index + 1);
    }
  }
  return found;
}

function skipValue(content: string, from: number): number {
  const character = content[from];
  if (character === '"') {
    return scanString(content, from)?.end ?? content.length;
  }
  if (character === '{' || character === '[') {
    return skipContainer(content, from);
  }
  let index = from;
  while (index < content.length) {
    const next = content[index];
    if (next === ',' || next === '}' || next === ']') {
      return index;
    }
    index += 1;
  }
  return index;
}

function skipContainer(content: string, from: number): number {
  let depth = 0;
  let index = from;
  while (index < content.length) {
    const character = content[index];
    if (character === '"') {
      index = scanString(content, index)?.end ?? content.length;
      continue;
    }
    if (character === '{' || character === '[') {
      depth += 1;
    } else if (character === '}' || character === ']') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return index;
}

function scanString(content: string, start: number): JsonString | undefined {
  if (content[start] !== '"') {
    return undefined;
  }
  let index = start + 1;
  let value = '';
  while (index < content.length) {
    const character = content[index];
    if (character === '"') {
      return {
        end: index + 1,
        start,
        value,
      };
    }
    if (character !== '\\') {
      value += character;
      index += 1;
      continue;
    }
    const escapeCharacter = content[index + 1];
    if (escapeCharacter === 'u') {
      const code = Number.parseInt(
        content.slice(index + 2, index + UNICODE_ESCAPE_LENGTH),
        16,
      );
      if (Number.isNaN(code)) {
        return undefined;
      }
      value += String.fromCharCode(code);
      index += UNICODE_ESCAPE_LENGTH;
      continue;
    }
    const decoded =
      escapeCharacter === undefined ? undefined : ESCAPES[escapeCharacter];
    if (decoded === undefined) {
      return undefined;
    }
    value += decoded;
    index += 2;
  }
  return undefined;
}

function skipWhitespace(content: string, from: number): number {
  let index = from;
  while (index < content.length) {
    const character = content[index];
    if (
      character !== ' ' &&
      character !== '\n' &&
      character !== '\r' &&
      character !== '\t'
    ) {
      return index;
    }
    index += 1;
  }
  return index;
}
