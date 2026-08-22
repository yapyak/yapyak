import type { Token } from './type';

const BLOCKS = new Set([
  'await',
  'each',
  'if',
  'key',
  'snippet',
]);

const CONTINUATIONS = new Set([
  'catch',
  'else',
  'then',
]);

const TAGS = new Set([
  'attach',
  'const',
  'debug',
  'html',
  'render',
]);

const MARKERS = new Set([
  '#',
  '/',
  ':',
  '@',
]);

const MARKER_RX = /^([#:/@])([a-z]+)/;

const NAME_RX = /^[a-z]+/;

const BRACE_KINDS = new Set([
  'jsx-brace',
  'punct',
]);

export function markSvelteBlocks(tokens: Token[]): Token[] {
  const result: Token[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index] as Token;
    result.push(token);
    index += 1;
    if (!BRACE_KINDS.has(token.kind) || token.value !== '{') {
      continue;
    }
    const next = tokens[index];
    if (next === undefined) {
      continue;
    }
    const match = MARKER_RX.exec(next.value);
    if (match !== null && isBlockName(match[1] as string, match[2] as string)) {
      const marker = match[0];
      result.push({
        kind: 'keyword',
        value: marker,
      });
      const rest = next.value.slice(marker.length);
      if (rest.length > 0) {
        result.push({
          kind: next.kind,
          value: rest,
        });
      }
      index += 1;
      continue;
    }
    const after = tokens[index + 1];
    const name = after === undefined ? null : NAME_RX.exec(after.value);
    if (
      after !== undefined &&
      name !== null &&
      MARKERS.has(next.value) &&
      isBlockName(next.value, name[0])
    ) {
      result.push({
        kind: 'keyword',
        value: next.value + name[0],
      });
      const rest = after.value.slice(name[0].length);
      if (rest.length > 0) {
        result.push({
          kind: after.kind,
          value: rest,
        });
      }
      index += 2;
    }
  }

  return result;
}

function isBlockName(marker: string, name: string) {
  if (marker === '@') {
    return TAGS.has(name);
  }
  if (marker === ':') {
    return CONTINUATIONS.has(name);
  }
  return BLOCKS.has(name);
}
