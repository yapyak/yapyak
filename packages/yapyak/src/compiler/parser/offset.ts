import type { Position } from './position';

export function offsetToOriginalPosition(
  source: string,
  offset: number,
): Position {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset; i += 1) {
    if (source[i] === '\n') {
      line += 1;
      column = 1;
      continue;
    }
    column += 1;
  }
  return { column, line, offset };
}
