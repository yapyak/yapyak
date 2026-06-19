import { relative } from 'node:path';

import { collectExports } from './export';
import { extractJsDoc } from './jsdoc';
import { parseSourceFile } from './source-file';
import { buildSymbol } from './symbol';
import type { ReferenceExport, ReferenceModule } from './type';

export type ExtractModuleInput = {
  entryFile: string;
  moduleId: string;
  packageDir: string;
  subpath: string;
};

export function extractModule(input: ExtractModuleInput): ReferenceModule {
  const { entryFile, moduleId, packageDir, subpath } = input;
  const exports = collectExports(entryFile);

  const symbols: ReferenceExport[] = [];
  for (const [name, entry] of exports) {
    const symbol = buildSymbol({
      name,
      node: entry.node,
      packageDir,
      sourceFile: entry.sourceFile,
    });
    if (symbol !== undefined) {
      symbols.push(symbol);
    }
  }
  symbols.sort((left, right) => left.name.localeCompare(right.name));

  return {
    description: readModuleDescription(entryFile),
    exports: symbols,
    id: moduleId,
    sourcePath: relative(packageDir, entryFile).split('\\').join('/'),
    subpath,
  };
}

function readModuleDescription(entryFile: string): string {
  const sourceFile = parseSourceFile(entryFile);
  for (const statement of sourceFile.statements) {
    const jsDoc = extractJsDoc(statement);
    if (jsDoc.description !== '') {
      return jsDoc.description;
    }
  }
  return '';
}
