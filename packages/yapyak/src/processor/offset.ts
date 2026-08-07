import type { Position, Range } from './type';

/**
 * Converts a string index into a 1-based line/column position in `source`.
 *
 * @param source - The source text.
 * @param offset - The string index.
 */
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
  return {
    column,
    line,
    offset,
  };
}

/**
 * Builds a range from two string indices in `source`.
 *
 * @param source - The source text.
 * @param startOffset - The start string index, inclusive.
 * @param endOffset - The end string index, exclusive.
 */
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
