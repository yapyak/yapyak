import type { Token } from './type';

const ICU_KEYWORDS: ReadonlySet<string> = new Set([
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

export function expandTxSourcePlaceholders(tokens: Token[]): Token[] {
  const result: Token[] = [];
  for (const token of tokens) {
    if (token.type !== 'tx-source') {
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

function expandSingleSource(value: string): Token[] {
  const result: Token[] = [];
  const firstChar = value.charAt(0);
  const lastChar = value.charAt(value.length - 1);
  const isQuoted =
    (firstChar === "'" || firstChar === '"' || firstChar === '`') &&
    firstChar === lastChar &&
    value.length >= 2;

  if (isQuoted) {
    result.push({
      type: 'tx-source',
      value: firstChar,
    });
    parseTextWithPlaceholders(value.slice(1, -1), result);
    result.push({
      type: 'tx-source',
      value: lastChar,
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
        type: 'tx-source',
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
          type: 'tx-source',
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
    type: 'punct',
    value: '{',
  });

  const inner = text.slice(1, -1);
  const firstComma = findTopLevelComma(inner, 0);

  if (firstComma === -1) {
    output.push({
      type: 'tx-placeholder',
      value: inner,
    });
    output.push({
      type: 'punct',
      value: '}',
    });
    return;
  }

  const variableName = inner.slice(0, firstComma);
  output.push({
    type: 'tx-placeholder',
    value: variableName,
  });
  output.push({
    type: 'punct',
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
      type: 'tx-icu-keyword',
      value: trimmedAfterFirst,
    });
    output.push({
      type: 'punct',
      value: '}',
    });
    return;
  }

  const keywordEnd = secondComma - (firstComma + 1) - consumedFirstWhitespace;
  const keyword = trimmedAfterFirst.slice(0, keywordEnd).trimEnd();
  output.push({
    type: 'tx-icu-keyword',
    value: keyword,
  });
  const keywordTrailingWhitespace =
    trimmedAfterFirst.slice(0, keywordEnd).length - keyword.length;
  if (keywordTrailingWhitespace > 0) {
    output.push({
      type: 'plain',
      value: trimmedAfterFirst.slice(
        keyword.length,
        keyword.length + keywordTrailingWhitespace,
      ),
    });
  }
  output.push({
    type: 'punct',
    value: ',',
  });

  parseBranches(inner.slice(secondComma + 1), output);
  output.push({
    type: 'punct',
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
        type: 'plain',
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
        type: 'tx-icu-key',
        value: key,
      });
    }

    const trailingStart = index;
    while (index < text.length && isWhitespace(text.charAt(index))) {
      index++;
    }
    if (index > trailingStart) {
      output.push({
        type: 'plain',
        value: text.slice(trailingStart, index),
      });
    }

    if (index < text.length && text.charAt(index) === '{') {
      const closeIndex = findMatchingClose(text, index);
      if (closeIndex === -1) {
        output.push({
          type: 'tx-source',
          value: text.slice(index),
        });
        return;
      }
      output.push({
        type: 'punct',
        value: '{',
      });
      parseBranchText(text.slice(index + 1, closeIndex), output);
      output.push({
        type: 'punct',
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
        type: 'tx-source',
        value: text.slice(plainStart, index),
      });
    }
  };

  while (index < text.length) {
    const char = text.charAt(index);
    if (char === '#') {
      flushPlain();
      output.push({
        type: 'tx-icu-hash',
        value: '#',
      });
      index++;
      plainStart = index;
    } else if (char === '{') {
      flushPlain();
      const closeIndex = findMatchingClose(text, index);
      if (closeIndex === -1) {
        output.push({
          type: 'tx-source',
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
      type: 'plain',
      value: text.slice(0, end),
    });
  }
}

function findMatchingClose(text: string, start: number): number {
  let depth = 0;
  for (let index = start; index < text.length; index++) {
    const char = text.charAt(index);
    if (char === '{') {
      depth++;
    } else if (char === '}') {
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
    const char = text.charAt(index);
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
    } else if (char === ',' && depth === 0) {
      return index;
    }
  }
  return -1;
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

export const ICU_KEYWORD_SET = ICU_KEYWORDS;
