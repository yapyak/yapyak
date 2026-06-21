import type { Node, SourceFile } from 'typescript';
import type { ReferenceLocation } from './type';

import { relative } from 'node:path';

export function buildLocation(
  node: Node,
  sourceFile: SourceFile,
  packageDir: string,
): ReferenceLocation {
  const start = node.getStart();
  const position = sourceFile.getLineAndCharacterOfPosition(start);
  return {
    column: position.character + 1,
    file: relative(packageDir, sourceFile.fileName).split('\\').join('/'),
    line: position.line + 1,
  };
}
