import type { Token } from './type';

import { mergePlainTokens } from './plain-token';

const LOCALE_PREFIX_RX = /^([a-z]{2,3}(?:-[a-z]{2})?:[ \t]+)(.*)$/;

export function tokenizeTranslation(code: string) {
  const tokens: Token[] = [];
  const lines = code.split('\n');

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? '';
    const trailing = index < lines.length - 1 ? '\n' : '';

    if (line.length > 0) {
      const match = LOCALE_PREFIX_RX.exec(line);
      if (match) {
        const prefix = match[1] ?? '';
        const content = match[2] ?? '';
        tokens.push({
          kind: 'comment',
          value: prefix,
        });
        if (content.length > 0) {
          tokens.push({
            kind: 't-source',
            value: content,
          });
        }
      } else {
        tokens.push({
          kind: 't-source',
          value: line,
        });
      }
    }

    if (trailing.length > 0) {
      tokens.push({
        kind: 'plain',
        value: trailing,
      });
    }
  }

  return mergePlainTokens(tokens);
}
