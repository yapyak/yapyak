import type { Node, SourceFile } from 'typescript';

import ts from 'typescript';

import { resolveImport } from './resolve-import';
import { parseSourceFile } from './source-file';

export type ExportEntry = {
  node: Node;
  sourceFile: SourceFile;
};

const exportsByFile = new Map<string, Map<string, ExportEntry>>();

export function extractExports(entryFile: string): Map<string, ExportEntry> {
  exportsByFile.clear();
  return walkExports(entryFile, new Set());
}

function walkExports(
  filePath: string,
  stack: Set<string>,
): Map<string, ExportEntry> {
  const cached = exportsByFile.get(filePath);
  if (cached !== undefined) {
    return cached;
  }
  if (stack.has(filePath)) {
    return new Map();
  }
  stack.add(filePath);

  const sourceFile = parseSourceFile(filePath);
  const result = new Map<string, ExportEntry>();

  collectLocalExports(sourceFile, result);
  collectReExports(sourceFile, filePath, stack, result);

  stack.delete(filePath);
  exportsByFile.set(filePath, result);
  return result;
}

function collectLocalExports(
  sourceFile: SourceFile,
  out: Map<string, ExportEntry>,
): void {
  const localByName = new Map<string, ExportEntry>();
  for (const node of sourceFile.statements) {
    if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
      localByName.set(node.name.text, {
        node,
        sourceFile,
      });
    } else if (ts.isTypeAliasDeclaration(node)) {
      localByName.set(node.name.text, {
        node,
        sourceFile,
      });
    } else if (ts.isInterfaceDeclaration(node)) {
      localByName.set(node.name.text, {
        node,
        sourceFile,
      });
    } else if (ts.isClassDeclaration(node) && node.name !== undefined) {
      localByName.set(node.name.text, {
        node,
        sourceFile,
      });
    } else if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          localByName.set(declaration.name.text, {
            node,
            sourceFile,
          });
        }
      }
    }
  }

  for (const node of sourceFile.statements) {
    if (hasExportModifier(node)) {
      if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
        out.set(node.name.text, {
          node,
          sourceFile,
        });
      } else if (ts.isTypeAliasDeclaration(node)) {
        out.set(node.name.text, {
          node,
          sourceFile,
        });
      } else if (ts.isInterfaceDeclaration(node)) {
        out.set(node.name.text, {
          node,
          sourceFile,
        });
      } else if (ts.isClassDeclaration(node) && node.name !== undefined) {
        out.set(node.name.text, {
          node,
          sourceFile,
        });
      } else if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) {
            out.set(declaration.name.text, {
              node,
              sourceFile,
            });
          }
        }
      }
      continue;
    }
    if (
      ts.isExportAssignment(node) &&
      node.isExportEquals !== true &&
      ts.isIdentifier(node.expression)
    ) {
      const entry = localByName.get(node.expression.text);
      if (entry !== undefined) {
        out.set('default', entry);
      }
    }
  }
}

function collectReExports(
  sourceFile: SourceFile,
  filePath: string,
  stack: Set<string>,
  out: Map<string, ExportEntry>,
): void {
  for (const node of sourceFile.statements) {
    if (!ts.isExportDeclaration(node)) {
      continue;
    }
    const specifierNode = node.moduleSpecifier;
    if (specifierNode === undefined || !ts.isStringLiteral(specifierNode)) {
      continue;
    }
    const resolved = resolveImport(filePath, specifierNode.text);
    if (resolved === undefined) {
      continue;
    }
    const nested = walkExports(resolved, stack);

    if (node.exportClause === undefined) {
      for (const [name, entry] of nested) {
        out.set(name, entry);
      }
      continue;
    }
    if (!ts.isNamedExports(node.exportClause)) {
      continue;
    }
    for (const specifier of node.exportClause.elements) {
      const exportName = specifier.name.text;
      const sourceName = specifier.propertyName?.text ?? exportName;
      const entry = nested.get(sourceName);
      if (entry !== undefined) {
        out.set(exportName, entry);
      }
    }
  }
}

function hasExportModifier(node: Node): boolean {
  if (!ts.canHaveModifiers(node)) {
    return false;
  }
  const modifiers = ts.getModifiers(node);
  if (modifiers === undefined) {
    return false;
  }
  return modifiers.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  );
}
