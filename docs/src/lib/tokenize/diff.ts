import type { Token } from './type';

import { mergePlainTokens } from './plain-token';

export function tokenizeDiff(code: string) {
  const tokens: Token[] = [];
  const lines = code.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? '';
    const trailing = index < lines.length - 1 ? '\n' : '';
    if (line.startsWith('@@')) {
      tokens.push({
        kind: 'diff-hunk',
        value: line + trailing,
      });
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      tokens.push({
        kind: 'diff-add',
        value: line + trailing,
      });
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      tokens.push({
        kind: 'diff-remove',
        value: line + trailing,
      });
    } else {
      tokens.push({
        kind: 'plain',
        value: line + trailing,
      });
    }
  }
  return mergePlainTokens(tokens);
}
