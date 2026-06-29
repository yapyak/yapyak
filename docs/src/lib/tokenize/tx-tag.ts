import type { Token } from './type';

export function expandTxSourceTags(tokens: Token[]): Token[] {
  const result: Token[] = [];
  for (const token of tokens) {
    if (token.kind !== 'tx-source' || !token.value.includes('<')) {
      result.push(token);
      continue;
    }
    extractTags(token.value, result);
  }
  return result;
}

function extractTags(text: string, output: Token[]): void {
  let index = 0;
  let plainStart = 0;

  const flushPlain = () => {
    if (index > plainStart) {
      output.push({
        kind: 'tx-source',
        value: text.slice(plainStart, index),
      });
    }
  };

  while (index < text.length) {
    if (text.charAt(index) !== '<') {
      index++;
      continue;
    }
    const end = matchTagEnd(text, index);
    if (end === -1) {
      index++;
      continue;
    }
    flushPlain();
    emitTag(text.slice(index, end), output);
    index = end;
    plainStart = index;
  }

  flushPlain();
}

function matchTagEnd(text: string, start: number): number {
  let index = start + 1;
  if (index >= text.length) {
    return -1;
  }
  const isClosing = text.charAt(index) === '/';
  if (isClosing) {
    index++;
  }
  const nameStart = index;
  while (index < text.length && isNameChar(text.charAt(index))) {
    index++;
  }
  if (index === nameStart) {
    return -1;
  }
  while (index < text.length && isWhitespace(text.charAt(index))) {
    index++;
  }
  if (!isClosing && text.charAt(index) === '/') {
    index++;
    while (index < text.length && isWhitespace(text.charAt(index))) {
      index++;
    }
  }
  if (index >= text.length || text.charAt(index) !== '>') {
    return -1;
  }
  return index + 1;
}

function emitTag(raw: string, output: Token[]): void {
  let position = 0;
  output.push({
    kind: 'punct',
    value: '<',
  });
  position++;
  if (raw.charAt(position) === '/') {
    output.push({
      kind: 'punct',
      value: '/',
    });
    position++;
  }
  let nameEnd = position;
  while (nameEnd < raw.length && isNameChar(raw.charAt(nameEnd))) {
    nameEnd++;
  }
  output.push({
    kind: 'tx-tag',
    value: raw.slice(position, nameEnd),
  });
  position = nameEnd;
  while (position < raw.length && isWhitespace(raw.charAt(position))) {
    position++;
  }
  if (raw.charAt(position) === '/') {
    output.push({
      kind: 'punct',
      value: '/',
    });
    position++;
  }
  output.push({
    kind: 'punct',
    value: '>',
  });
}

function isNameChar(character: string): boolean {
  return (
    (character >= 'a' && character <= 'z') ||
    (character >= 'A' && character <= 'Z') ||
    (character >= '0' && character <= '9') ||
    character === '-'
  );
}

function isWhitespace(character: string): boolean {
  return (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r'
  );
}
