import type { Token } from './type';

import { mergePlainTokens } from './plain-token';

export function tokenizeHtml(code: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let mode: 'text' | 'tag' = 'text';

  while (index < code.length) {
    if (mode === 'text') {
      if (code.startsWith('<!--', index)) {
        const end = code.indexOf('-->', index + 4);
        const stop = end === -1 ? code.length : end + 3;
        tokens.push({
          type: 'comment',
          value: code.slice(index, stop),
        });
        index = stop;
        continue;
      }

      if (code[index] === '<') {
        const match = /^<\/?[A-Za-z][\w.-]*/.exec(code.slice(index));
        if (match) {
          tokens.push({
            type: 'jsx-tag',
            value: match[0],
          });
          index += match[0].length;
          mode = 'tag';
          continue;
        }
      }

      const nextOpen = code.indexOf('<', index);
      const stop = nextOpen === -1 ? code.length : nextOpen;
      tokens.push({
        type: 'plain',
        value: code.slice(index, stop),
      });
      index = stop;
      continue;
    }

    if (code[index] === '/' && code[index + 1] === '>') {
      tokens.push({
        type: 'jsx-tag',
        value: '/>',
      });
      index += 2;
      mode = 'text';
      continue;
    }

    if (code[index] === '>') {
      tokens.push({
        type: 'jsx-tag',
        value: '>',
      });
      index++;
      mode = 'text';
      continue;
    }

    const whitespace = /^[\s]+/.exec(code.slice(index));
    if (whitespace) {
      tokens.push({
        type: 'plain',
        value: whitespace[0],
      });
      index += whitespace[0].length;
      continue;
    }

    if (code[index] === '=') {
      tokens.push({
        type: 'punct',
        value: '=',
      });
      index++;
      continue;
    }

    if (code[index] === '"' || code[index] === "'") {
      const quote = code[index];
      const regex = quote === "'" ? /^'(?:\\.|[^'\\])*'/ : /^"(?:\\.|[^"\\])*"/;
      const match = regex.exec(code.slice(index));
      if (match) {
        tokens.push({
          type: 'string',
          value: match[0],
        });
        index += match[0].length;
        continue;
      }
    }

    const attribute = /^[A-Za-z_:@][\w:.-]*/.exec(code.slice(index));
    if (attribute) {
      tokens.push({
        type: 'fn-call',
        value: attribute[0],
      });
      index += attribute[0].length;
      continue;
    }

    tokens.push({
      type: 'plain',
      value: code[index] ?? '',
    });
    index++;
  }

  return mergePlainTokens(tokens);
}
