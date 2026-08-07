import type { FragmentSegment, Position, Range } from './type';

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

/**
 * Builds the segments for a fragment code run.
 *
 * @remarks
 * Applies only when the fragment code is a verbatim run of the source file.
 *
 * @param code - The fragment code.
 * @param sourceOffset - The string index in the source file the code starts at.
 *
 * @example
 * ```ts
 * import { segmentsFromOffset } from 'yapyak/processor';
 *
 * segmentsFromOffset("t('Save changes')", 42);
 * // output: [{ codeLength: 17, sourceOffset: 42 }]
 * ```
 */
export function segmentsFromOffset(
  code: string,
  sourceOffset: number,
): FragmentSegment[] {
  return [
    {
      codeLength: code.length,
      sourceOffset,
    },
  ];
}
