import type { Position, Range } from './type';

export function offsetToOriginalPosition(
  source: string,
  offset: number,
): Position {
  let line = 1;
  let column = 1;
  for (let index = 0; index < offset; index += 1) {
    if (source[index] === '\n') {
      line += 1;
      column = 1;
      continue;
    }
    column += 1;
  }
  return { column, line, offset };
}

export function rangeFromOffsets(
  source: string,
  startOffset: number,
  endOffset: number,
): Range {
  return {
    end: offsetToOriginalPosition(source, endOffset),
    start: offsetToOriginalPosition(source, startOffset),
  };
}
