import type * as ts from '@typescript/typescript6';
import type { Fragment, Position } from '../../processor';

import { offsetToOriginalPosition } from '../../processor';
import { remapOffset } from './offset';

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
  const absoluteOffset = remapOffset(position.offset, fragment);
  if (absoluteOffset === position.offset) {
    return position;
  }
  return offsetToOriginalPosition(originalSource, absoluteOffset);
}
