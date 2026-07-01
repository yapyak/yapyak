import type { Token } from './type';

const ICU_KEYWORDS: Set<string> = new Set([
  'plural',
  'select',
  'selectordinal',
  'number',
  'date',
  'time',
  'spellout',
  'ordinal',
  'duration',
]);

export function expandTxSourcePlaceholders(tokens: Token[]) {
  const result: Token[] = [];
  for (const token of tokens) {
    if (token.kind !== 'tx-source') {
      result.push(token);
      continue;
    }
    if (!token.value.includes('{')) {
      result.push(token);
      continue;
    }
    result.push(...expandSingleSource(token.value));
  }
  return result;
}

function expandSingleSource(value: string) {
  const result: Token[] = [];
  const firstCharacter = value.charAt(0);
  const lastCharacter = value.charAt(value.length - 1);
  const isQuoted =
    (firstCharacter === "'" ||
      firstCharacter === '"' ||
      firstCharacter === '`') &&
    firstCharacter === lastCharacter &&
    value.length >= 2;

  if (isQuoted) {
    result.push({
      kind: 'tx-source',
      value: firstCharacter,
    });
    parseTextWithPlaceholders(value.slice(1, -1), result);
    result.push({
      kind: 'tx-source',
      value: lastCharacter,
    });
    return result;
  }

  parseTextWithPlaceholders(value, result);
  return result;
}

function parseTextWithPlaceholders(text: string, output: Token[]): void {
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
    if (text.charAt(index) === '{') {
      flushPlain();
      const closeIndex = findMatchingClose(text, index);
      if (closeIndex === -1) {
        output.push({
          kind: 'tx-source',
          value: text.slice(index),
        });
        return;
      }
      parsePlaceholder(text.slice(index, closeIndex + 1), output);
      index = closeIndex + 1;
      plainStart = index;
    } else {
      index++;
    }
  }

  flushPlain();
}

function parsePlaceholder(text: string, output: Token[]): void {
  output.push({
    kind: 'punct',
    value: '{',
  });

  const inner = text.slice(1, -1);
  const firstComma = findTopLevelComma(inner, 0);

  if (firstComma === -1) {
    output.push({
      kind: 'tx-placeholder',
      value: inner,
    });
    output.push({
      kind: 'punct',
      value: '}',
    });
    return;
  }

  const variableName = inner.slice(0, firstComma);
  output.push({
    kind: 'tx-placeholder',
    value: variableName,
  });
  output.push({
    kind: 'punct',
    value: ',',
  });

  const afterFirstComma = inner.slice(firstComma + 1);
  emitLeadingWhitespace(afterFirstComma, output);
  const trimmedAfterFirst = afterFirstComma.trimStart();
  const consumedFirstWhitespace =
    afterFirstComma.length - trimmedAfterFirst.length;

  const secondComma = findTopLevelComma(inner, firstComma + 1);

  if (secondComma === -1) {
    output.push({
      kind: 'tx-icu-keyword',
      value: trimmedAfterFirst,
    });
    output.push({
      kind: 'punct',
      value: '}',
    });
    return;
  }

  const keywordEnd = secondComma - (firstComma + 1) - consumedFirstWhitespace;
  const keyword = trimmedAfterFirst.slice(0, keywordEnd).trimEnd();
  output.push({
    kind: 'tx-icu-keyword',
    value: keyword,
  });
  const keywordTrailingWhitespace =
    trimmedAfterFirst.slice(0, keywordEnd).length - keyword.length;
  if (keywordTrailingWhitespace > 0) {
    output.push({
      kind: 'plain',
      value: trimmedAfterFirst.slice(
        keyword.length,
        keyword.length + keywordTrailingWhitespace,
      ),
    });
  }
  output.push({
    kind: 'punct',
    value: ',',
  });

  parseBranches(inner.slice(secondComma + 1), output);
  output.push({
    kind: 'punct',
    value: '}',
  });
}

function parseBranches(text: string, output: Token[]): void {
  let index = 0;
  while (index < text.length) {
    const leadingStart = index;
    while (index < text.length && isWhitespace(text.charAt(index))) {
      index++;
    }
    if (index > leadingStart) {
      output.push({
        kind: 'plain',
        value: text.slice(leadingStart, index),
      });
    }
    if (index >= text.length) {
      break;
    }

    const keyStart = index;
    while (
      index < text.length &&
      !isWhitespace(text.charAt(index)) &&
      text.charAt(index) !== '{'
    ) {
      index++;
    }
    const key = text.slice(keyStart, index);
    if (key.length > 0) {
      output.push({
        kind: 'tx-icu-key',
        value: key,
      });
    }

    const trailingStart = index;
    while (index < text.length && isWhitespace(text.charAt(index))) {
      index++;
    }
    if (index > trailingStart) {
      output.push({
        kind: 'plain',
        value: text.slice(trailingStart, index),
      });
    }

    if (index < text.length && text.charAt(index) === '{') {
      const closeIndex = findMatchingClose(text, index);
      if (closeIndex === -1) {
        output.push({
          kind: 'tx-source',
          value: text.slice(index),
        });
        return;
      }
      output.push({
        kind: 'punct',
        value: '{',
      });
      parseBranchText(text.slice(index + 1, closeIndex), output);
      output.push({
        kind: 'punct',
        value: '}',
      });
      index = closeIndex + 1;
    }
  }
}

function parseBranchText(text: string, output: Token[]): void {
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
    const character = text.charAt(index);
    if (character === '#') {
      flushPlain();
      output.push({
        kind: 'tx-icu-hash',
        value: '#',
      });
      index++;
      plainStart = index;
    } else if (character === '{') {
      flushPlain();
      const closeIndex = findMatchingClose(text, index);
      if (closeIndex === -1) {
        output.push({
          kind: 'tx-source',
          value: text.slice(index),
        });
        return;
      }
      parsePlaceholder(text.slice(index, closeIndex + 1), output);
      index = closeIndex + 1;
      plainStart = index;
    } else {
      index++;
    }
  }

  flushPlain();
}

function emitLeadingWhitespace(text: string, output: Token[]): void {
  let end = 0;
  while (end < text.length && isWhitespace(text.charAt(end))) {
    end++;
  }
  if (end > 0) {
    output.push({
      kind: 'plain',
      value: text.slice(0, end),
    });
  }
}

function findMatchingClose(text: string, start: number): number {
  let depth = 0;
  for (let index = start; index < text.length; index++) {
    const character = text.charAt(index);
    if (character === '{') {
      depth++;
    } else if (character === '}') {
      depth--;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function findTopLevelComma(text: string, from: number): number {
  let depth = 0;
  for (let index = from; index < text.length; index++) {
    const character = text.charAt(index);
    if (character === '{') {
      depth++;
    } else if (character === '}') {
      depth--;
    } else if (character === ',' && depth === 0) {
      return index;
    }
  }
  return -1;
}

function isWhitespace(character: string): boolean {
  return (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r'
  );
}

export const ICU_KEYWORD_SET = ICU_KEYWORDS;
