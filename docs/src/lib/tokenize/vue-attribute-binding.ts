import type { Language, Token } from './type';

type TokenizeFn = (code: string, language: Language) => Token[];

const MARKS = new Set([
  '#',
  '@',
  ':',
]);

export function expandVueAttributeBindings(
  rawTokens: Token[],
  tokenize: TokenizeFn,
) {
  const tokens = markDirectiveMarks(rawTokens);
  const result: Token[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) {
      index++;
      continue;
    }

    if (token.kind === 'jsx-attribute' && MARKS.has(token.value)) {
      const identifierIndex = findNextNonWhitespace(tokens, index + 1);
      if (identifierIndex !== -1) {
        const identifier = tokens[identifierIndex];
        if (
          identifier !== undefined &&
          (identifier.kind === 'fn-call' ||
            identifier.kind === 'jsx-attribute' ||
            identifier.kind === 'plain' ||
            identifier.kind === 'keyword')
        ) {
          const equalsIndex = findNextNonWhitespace(
            tokens,
            identifierIndex + 1,
          );
          if (equalsIndex !== -1) {
            const equals = tokens[equalsIndex];
            if (equals?.kind === 'punct' && equals.value === '=') {
              const stringIndex = findNextNonWhitespace(
                tokens,
                equalsIndex + 1,
              );
              if (stringIndex !== -1) {
                const stringToken = tokens[stringIndex];
                if (
                  stringToken?.kind === 'string' &&
                  stringToken.value.length >= 2
                ) {
                  for (let cursor = index; cursor < stringIndex; cursor++) {
                    const passthrough = tokens[cursor];
                    if (passthrough !== undefined) {
                      result.push(passthrough);
                    }
                  }
                  const quote = stringToken.value[0] ?? '"';
                  const inner = stringToken.value.slice(1, -1);
                  const innerTokens = tokenize(inner, 'ts');
                  result.push({
                    kind: 'string',
                    value: quote,
                  });
                  for (const innerToken of innerTokens) {
                    result.push(innerToken);
                  }
                  result.push({
                    kind: 'string',
                    value: quote,
                  });
                  index = stringIndex + 1;
                  continue;
                }
              }
            }
          }
        }
      }
    }

    result.push(token);
    index++;
  }

  return result;
}

function markDirectiveMarks(tokens: Token[]): Token[] {
  const result: Token[] = [];

  for (const [index, token] of tokens.entries()) {
    const next = tokens[index + 1];
    if (
      token.kind === 'decorator' &&
      token.value.startsWith('@') &&
      token.value.length > 1
    ) {
      result.push({
        kind: 'jsx-attribute',
        value: '@',
      });
      result.push({
        kind: 'jsx-attribute',
        value: token.value.slice(1),
      });
      continue;
    }
    if (next?.kind !== 'jsx-attribute') {
      result.push(token);
      continue;
    }
    if (token.kind === 'punct' && MARKS.has(token.value)) {
      result.push({
        kind: 'jsx-attribute',
        value: token.value,
      });
      continue;
    }
    if (token.kind === 'plain' && token.value.endsWith('#')) {
      const head = token.value.slice(0, -1);
      if (head.length > 0) {
        result.push({
          kind: 'plain',
          value: head,
        });
      }
      result.push({
        kind: 'jsx-attribute',
        value: '#',
      });
      continue;
    }
    result.push(token);
  }

  return result;
}

function findNextNonWhitespace(tokens: Token[], from: number): number {
  for (let index = from; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (token.kind === 'plain' && /^\s+$/.test(token.value)) {
      continue;
    }
    return index;
  }
  return -1;
}
