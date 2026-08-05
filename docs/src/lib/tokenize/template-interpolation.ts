import type { Language, Token } from './type';

type TokenizeFn = (code: string, language: Language) => Token[];

export function expandTemplateInterpolations(
  tokens: Token[],
  language: Language,
  tokenize: TokenizeFn,
) {
  const result: Token[] = [];

  for (const token of tokens) {
    if (token.kind !== 'template') {
      result.push(token);
      continue;
    }

    const value = token.value;
    if (
      value.length < 2 ||
      value[0] !== '`' ||
      value[value.length - 1] !== '`'
    ) {
      result.push(token);
      continue;
    }

    const body = value.slice(1, -1);
    const segments: Token[] = [];
    let lastEnd = 0;
    let cursor = 0;
    let hasInterpolation = false;

    while (cursor < body.length) {
      if (body[cursor] === '\\') {
        cursor += 2;
        continue;
      }
      if (body[cursor] === '$' && body[cursor + 1] === '{') {
        hasInterpolation = true;
        if (cursor > lastEnd) {
          segments.push({
            kind: 'template',
            value: body.slice(lastEnd, cursor),
          });
        }
        let depth = 1;
        let end = cursor + 2;
        while (end < body.length && depth > 0) {
          if (body[end] === '\\') {
            end += 2;
            continue;
          }
          if (body[end] === '{') {
            depth++;
          } else if (body[end] === '}') {
            depth--;
            if (depth === 0) {
              break;
            }
          }
          end++;
        }
        segments.push({
          kind: 'punct',
          value: '${',
        });
        const inner = body.slice(cursor + 2, end);
        for (const innerToken of tokenize(inner, language)) {
          segments.push(innerToken);
        }
        segments.push({
          kind: 'punct',
          value: '}',
        });
        cursor = end + 1;
        lastEnd = cursor;
        continue;
      }
      cursor++;
    }

    if (!hasInterpolation) {
      result.push(token);
      continue;
    }

    if (lastEnd < body.length) {
      segments.push({
        kind: 'template',
        value: body.slice(lastEnd),
      });
    }

    result.push({
      kind: 'template',
      value: '`',
    });
    for (const segment of segments) {
      result.push(segment);
    }
    result.push({
      kind: 'template',
      value: '`',
    });
  }

  return result;
}
