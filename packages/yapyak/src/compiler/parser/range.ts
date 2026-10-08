import type { Span } from 'oxc-parser';
import type { Fragment, Range } from '../../processor';
import type { SourceFile } from './source-file';

import { remapPosition, toPosition } from './position';

export function toRange(span: Span, sourceFile: SourceFile): Range {
  return {
    end: toPosition(sourceFile.lineStarts, span.end),
    start: toPosition(sourceFile.lineStarts, span.start),
  };
}

export function remapRange(
  range: Range,
  fragment: Fragment,
  originalLineStarts: number[],
): Range {
  return {
    end: remapPosition(range.end, fragment, originalLineStarts),
    start: remapPosition(range.start, fragment, originalLineStarts),
  };
}
