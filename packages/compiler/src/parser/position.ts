import type * as ts from 'typescript';
import type { Fragment, Position } from './type';

import { offsetToOriginalPosition } from './offset';

export function toPosition(
  sourceFile: ts.SourceFile,
  offset: number,
): Position {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(offset);
  return {
    column: character + 1,
    line: line + 1,
    offset,
  };
}

export function remapPosition(
  position: Position,
  fragment: Fragment,
  originalSource: string,
): Position {
  if (fragment.originalOffset === 0) {
    return position;
  }
  const absoluteOffset = position.offset + fragment.originalOffset;
  return offsetToOriginalPosition(originalSource, absoluteOffset);
}
