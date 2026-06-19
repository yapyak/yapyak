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
      token.type === 'punct' &&
      (token.value === ':' || token.value === '@')
    ) {
      const identIndex = findNextNonWhitespace(tokens, index + 1);
      if (identIndex !== -1) {
        const ident = tokens[identIndex];
        if (
          ident !== undefined &&
          (ident.type === 'fn-call' ||
            ident.type === 'plain' ||
            ident.type === 'keyword')
        ) {
          const equalsIndex = findNextNonWhitespace(tokens, identIndex + 1);
          if (equalsIndex !== -1) {
            const equals = tokens[equalsIndex];
            if (equals?.type === 'punct' && equals.value === '=') {
              const stringIndex = findNextNonWhitespace(
                tokens,
                equalsIndex + 1,
              );
              if (stringIndex !== -1) {
                const str = tokens[stringIndex];
                if (str?.type === 'string' && str.value.length >= 2) {
                  for (let cursor = index; cursor < stringIndex; cursor++) {
                    const passthrough = tokens[cursor];
                    if (passthrough !== undefined) {
                      result.push(passthrough);
                    }
                  }
                  const quote = str.value[0] ?? '"';
                  const inner = str.value.slice(1, -1);
                  const innerTokens = tokenize(inner, 'ts');
                  result.push({
                    type: 'string',
                    value: quote,
                  });
                  for (const innerToken of innerTokens) {
                    result.push(innerToken);
                  }
                  result.push({
                    type: 'string',
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
    if (token.type === 'plain' && /^\s+$/.test(token.value)) {
      continue;
    }
    return index;
  }
  return -1;
}
