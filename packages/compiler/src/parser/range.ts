import type * as ts from 'typescript';
import type { Fragment } from './fragment';
import type { Position } from './position';

import { offsetToOriginalPosition } from './offset';
import { remapPosition, toPosition } from './position';

export interface Range {
  end: Position;
  start: Position;
}

export function toRange(node: ts.Node, sourceFile: ts.SourceFile): Range {
  return {
    end: toPosition(sourceFile, node.getEnd()),
    start: toPosition(sourceFile, node.getStart(sourceFile)),
  };
}

export function remapRange(
  range: Range,
  fragment: Fragment,
  originalSource: string,
): Range {
  if (fragment.originalOffset === 0) {
    return range;
  }
  return {
    end: remapPosition(range.end, fragment, originalSource),
    start: remapPosition(range.start, fragment, originalSource),
  };
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
