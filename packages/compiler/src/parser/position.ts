import type * as ts from 'typescript';
import type { Fragment, Position, Range } from './type';

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

export function toRange(node: ts.Node, sourceFile: ts.SourceFile): Range {
  return {
    end: toPosition(sourceFile, node.getEnd()),
    start: toPosition(sourceFile, node.getStart(sourceFile)),
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

function offsetToOriginalPosition(source: string, offset: number): Position {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset; i += 1) {
    if (source[i] === '\n') {
      line += 1;
      column = 1;
      continue;
    }
    column += 1;
  }
  return { column, line, offset };
}
