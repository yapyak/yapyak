import type { Token } from './type';

export function markTaggedTemplates(tokens: Token[]): void {
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined || token.type !== 'template') {
      continue;
    }
    let cursor = index - 1;
    while (cursor >= 0) {
      const previous = tokens[cursor];
      if (previous === undefined) {
        break;
      }
      if (previous.type === 'plain' && /^\s+$/.test(previous.value)) {
        break;
      }
      if (
        previous.type === 'plain' ||
        previous.type === 'fn-call' ||
        previous.type === 'type'
      ) {
        previous.type = 'fn-call';
        cursor--;
        continue;
      }
      if (previous.type === 'punct' && previous.value === '.') {
        cursor--;
        continue;
      }
      break;
    }
  }
}
