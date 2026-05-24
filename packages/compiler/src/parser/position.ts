import type * as ts from 'typescript';
import type { Position, Range } from './type';

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
