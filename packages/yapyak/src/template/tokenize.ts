export type TemplateTokenKind =
  | 'branch'
  | 'keyword'
  | 'placeholder'
  | 'pound'
  | 'punctuation'
  | 'slot'
  | 'tag'
  | 'text';

export type TemplateToken = {
  kind: TemplateTokenKind;
  length: number;
  offset: number;
};

const IDENTIFIER_RX = /[0-9A-Za-z_=-]/;
const TAG_NAME_RX = /[0-9A-Za-z_-]/;

export function tokenizeTemplate(source: string): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  scanText(source, 0, source.length, tokens, false);
  return tokens;
}

function scanText(
  source: string,
  start: number,
  end: number,
  tokens: TemplateToken[],
  inBranch: boolean,
): void {
  let index = start;
  let textStart = start;
  const flushText = (until: number): void => {
    if (until > textStart) {
      tokens.push({
        kind: 'text',
        length: until - textStart,
        offset: textStart,
      });
    }
  };
  while (index < end) {
    const character = source[index] as string;
    if (character === '#' && inBranch) {
      flushText(index);
      tokens.push({
        kind: 'pound',
        length: 1,
        offset: index,
      });
      index += 1;
      textStart = index;
      continue;
    }
    if (character === '{') {
      const close = findMatchingClose(source, index, end);
      flushText(index);
      if (close === -1) {
        if (!inBranch) {
          tokens.push({
            kind: 'slot',
            length: end - index,
            offset: index,
          });
        }
        scanPlaceholder(source, index, end, tokens);
        return;
      }
      if (!inBranch) {
        tokens.push({
          kind: 'slot',
          length: close - index + 1,
          offset: index,
        });
      }
      scanPlaceholder(source, index, close, tokens);
      emitPunctuation(tokens, close);
      index = close + 1;
      textStart = index;
      continue;
    }
    if (character === '<') {
      const tagEnd = findTagEnd(source, index, end);
      if (tagEnd === -1) {
        index += 1;
        continue;
      }
      flushText(index);
      scanTag(source, index, tagEnd, tokens);
      index = tagEnd;
      textStart = index;
      continue;
    }
    index += 1;
  }
  flushText(end);
}

function findTagEnd(source: string, start: number, end: number): number {
  let index = start + 1;
  const closing = source[index] === '/';
  if (closing) {
    index += 1;
  }
  const nameStart = index;
  while (index < end && TAG_NAME_RX.test(source[index] as string)) {
    index += 1;
  }
  if (index === nameStart) {
    return -1;
  }
  index = skipSpace(source, index, end);
  if (!closing && source[index] === '/') {
    index = skipSpace(source, index + 1, end);
  }
  if (index >= end || source[index] !== '>') {
    return -1;
  }
  return index + 1;
}

function scanTag(
  source: string,
  start: number,
  end: number,
  tokens: TemplateToken[],
): void {
  let index = start;
  emitPunctuation(tokens, index);
  index += 1;
  if (source[index] === '/') {
    emitPunctuation(tokens, index);
    index += 1;
  }
  const nameStart = index;
  while (index < end && TAG_NAME_RX.test(source[index] as string)) {
    index += 1;
  }
  tokens.push({
    kind: 'tag',
    length: index - nameStart,
    offset: nameStart,
  });
  index = skipSpace(source, index, end);
  if (source[index] === '/') {
    emitPunctuation(tokens, index);
    index = skipSpace(source, index + 1, end);
  }
  emitPunctuation(tokens, index);
}

function scanPlaceholder(
  source: string,
  open: number,
  close: number,
  tokens: TemplateToken[],
): void {
  emitPunctuation(tokens, open);
  const nameStart = skipSpace(source, open + 1, close);
  const nameEnd = scanIdentifier(source, nameStart, close);
  if (nameEnd === nameStart) {
    return;
  }
  tokens.push({
    kind: 'placeholder',
    length: nameEnd - nameStart,
    offset: nameStart,
  });
  const afterName = skipSpace(source, nameEnd, close);
  if (source[afterName] !== ',') {
    return;
  }
  emitPunctuation(tokens, afterName);
  const kindStart = skipSpace(source, afterName + 1, close);
  const kindEnd = scanIdentifier(source, kindStart, close);
  if (kindEnd > kindStart) {
    tokens.push({
      kind: 'keyword',
      length: kindEnd - kindStart,
      offset: kindStart,
    });
  }
  const afterKind = skipSpace(source, kindEnd, close);
  if (source[afterKind] !== ',') {
    return;
  }
  emitPunctuation(tokens, afterKind);
  scanBranches(source, afterKind + 1, close, tokens);
}

function scanBranches(
  source: string,
  start: number,
  end: number,
  tokens: TemplateToken[],
): void {
  let index = start;
  while (index < end) {
    index = skipSpace(source, index, end);
    if (index >= end) {
      return;
    }
    if (source[index] === '{') {
      const close = findMatchingClose(source, index, end);
      emitPunctuation(tokens, index);
      if (close === -1) {
        scanText(source, index + 1, end, tokens, true);
        return;
      }
      emitPunctuation(tokens, close);
      scanText(source, index + 1, close, tokens, true);
      index = close + 1;
      continue;
    }
    const keyEnd = scanIdentifier(source, index, end);
    if (keyEnd === index) {
      index += 1;
      continue;
    }
    tokens.push({
      kind: 'branch',
      length: keyEnd - index,
      offset: index,
    });
    index = keyEnd;
  }
}

function emitPunctuation(tokens: TemplateToken[], offset: number): void {
  tokens.push({
    kind: 'punctuation',
    length: 1,
    offset,
  });
}

function findMatchingClose(source: string, start: number, end: number): number {
  let depth = 0;
  for (let index = start; index < end; index += 1) {
    const character = source[index];
    if (character === '{') {
      depth += 1;
      continue;
    }
    if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function skipSpace(source: string, start: number, end: number): number {
  let index = start;
  while (index < end && /\s/.test(source[index] as string)) {
    index += 1;
  }
  return index;
}

function scanIdentifier(source: string, start: number, end: number): number {
  let index = start;
  while (index < end && IDENTIFIER_RX.test(source[index] as string)) {
    index += 1;
  }
  return index;
}
