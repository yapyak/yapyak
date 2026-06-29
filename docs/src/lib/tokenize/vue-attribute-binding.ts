import type { Language, Token } from './type';

type TokenizeFn = (code: string, language: Language) => Token[];

export function expandVueAttributeBindings(
  tokens: Token[],
  tokenize: TokenizeFn,
): Token[] {
  const result: Token[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) {
      index++;
      continue;
    }

    if (
      token.kind === 'punct' &&
      (token.value === ':' || token.value === '@')
    ) {
      const identifierIndex = findNextNonWhitespace(tokens, index + 1);
      if (identifierIndex !== -1) {
        const identifier = tokens[identifierIndex];
        if (
          identifier !== undefined &&
          (identifier.kind === 'fn-call' ||
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
