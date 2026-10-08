import type { Fragment, Position } from '../../processor';

import { remapOffset } from './offset';

const LINE_BREAK_RX = /\r\n?|\n/g;

export function toPosition(lineStarts: number[], offset: number): Position {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const middleStart = lineStarts[middle];
    if (middleStart === undefined || middleStart > offset) {
      high = middle - 1;
      continue;
    }
    low = middle;
  }
  const lineStart = lineStarts[low];
  if (lineStart === undefined) {
    throw new Error(`[yapyak] Offset ${offset} has no line start.`);
  }
  return {
    column: offset - lineStart + 1,
    line: low + 1,
    offset,
  };
}

export function remapPosition(
  position: Position,
  fragment: Fragment,
  originalLineStarts: number[],
): Position {
  const absoluteOffset = remapOffset(position.offset, fragment);
  if (absoluteOffset === position.offset) {
    return position;
  }
  return toPosition(originalLineStarts, absoluteOffset);
}

export function collectLineStarts(text: string): number[] {
  const lineStarts = [
    0,
  ];
  for (const match of text.matchAll(LINE_BREAK_RX)) {
    lineStarts.push(match.index + match[0].length);
  }
  return lineStarts;
}
