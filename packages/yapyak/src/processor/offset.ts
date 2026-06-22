import type { Position, Range } from './type';

/**
 * Converts a byte offset into a 1-based line/column position in `source`.
 *
 * @param source - The source text.
 * @param offset - The byte offset.
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
 * Builds a range from two byte offsets in `source`.
 *
 * @param source - The source text.
 * @param startOffset - The start byte offset, inclusive.
 * @param endOffset - The end byte offset, exclusive.
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
