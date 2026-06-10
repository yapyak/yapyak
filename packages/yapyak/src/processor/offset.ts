import type { Position, Range } from './type';

/**
 * Converts a byte offset into a 1-based line/column {@link Position} in `source`.
 *
 * @remarks
 * Walks the source from the start, counting newlines. Used by framework processors when emitting diagnostics whose locations must be reported in the original file.
 *
 * @param source - The original source text.
 * @param offset - The byte offset into `source`.
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
 * Builds a {@link Range} from two byte offsets in `source`.
 *
 * @remarks
 * Resolves each offset to its 1-based line/column position via {@link offsetToOriginalPosition}.
 *
 * @param source - The original source text.
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
