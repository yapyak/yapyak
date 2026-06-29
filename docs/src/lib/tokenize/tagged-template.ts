import type { Token } from './type';

export function markTaggedTemplates(tokens: Token[]): void {
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined || token.kind !== 'template') {
      continue;
    }
    let cursor = index - 1;
    while (cursor >= 0) {
      const previous = tokens[cursor];
      if (previous === undefined) {
        break;
      }
      if (previous.kind === 'plain' && /^\s+$/.test(previous.value)) {
        break;
      }
      if (
        previous.kind === 'plain' ||
        previous.kind === 'fn-call' ||
        previous.kind === 'type'
      ) {
        previous.kind = 'fn-call';
        cursor--;
        continue;
      }
      if (previous.kind === 'punct' && previous.value === '.') {
        cursor--;
        continue;
      }
      break;
    }
  }
}
