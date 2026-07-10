import type * as ts from '@typescript/typescript6';
import type { Fragment, Range } from '../../processor';

import { remapPosition, toPosition } from './position';

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
