const DIRECTIVE_RX = /^\s*(['"])(use [a-z]+(?: [a-z]+)?)\1\s*;?\s*(?:\r?\n|$)/;

export function resolveDirectivePrologueEnd(source: string): number {
  let cursor = 0;
  while (cursor < source.length) {
    const slice = source.slice(cursor);
    const stripped = stripLeadingShebangAndComments(slice);
    const consumed = slice.length - stripped.length;
    const match = DIRECTIVE_RX.exec(stripped);
    if (!match) {
      return cursor;
    }
    cursor += consumed + match[0].length;
  }
  return cursor;
}

export function extractPrologueDirectives(source: string): string[] {
  const directives: string[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    const slice = source.slice(cursor);
    const stripped = stripLeadingShebangAndComments(slice);
    const consumed = slice.length - stripped.length;
    const match = DIRECTIVE_RX.exec(stripped);
    if (!match) {
      return directives;
    }
    const directive = match[2];
    if (directive !== undefined) {
      directives.push(directive);
    }
    cursor += consumed + match[0].length;
  }
  return directives;
}

function stripLeadingShebangAndComments(source: string): string {
  let cursor = 0;
  if (source.startsWith('#!')) {
    const newline = source.indexOf('\n', cursor);
    cursor = newline === -1 ? source.length : newline + 1;
  }
  while (cursor < source.length) {
    const rest = source.slice(cursor);
    const whitespaceLength = rest.length - rest.trimStart().length;
    cursor += whitespaceLength;
    if (source.startsWith('//', cursor)) {
      const newline = source.indexOf('\n', cursor);
      cursor = newline === -1 ? source.length : newline + 1;
      continue;
    }
    if (source.startsWith('/*', cursor)) {
      const close = source.indexOf('*/', cursor + 2);
      cursor = close === -1 ? source.length : close + 2;
      continue;
    }
    break;
  }
  return source.slice(cursor);
}
