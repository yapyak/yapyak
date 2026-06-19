import type { Node, SourceFile } from 'typescript';

import ts from 'typescript';

import { resolveImport } from './resolve-import';
import { parseSourceFile } from './source-file';

export type ExportEntry = {
  node: Node;
  sourceFile: SourceFile;
};

const cache = new Map<string, Map<string, ExportEntry>>();

export function collectExports(entryFile: string): Map<string, ExportEntry> {
  cache.clear();
  return walk(entryFile, new Set());
}

function walk(
  filePath: string,
  stack: Set<string>,
): Map<string, ExportEntry> {
  const cached = cache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }
  if (stack.has(filePath)) {
    return new Map();
  }
  stack.add(filePath);

  const sourceFile = parseSourceFile(filePath);
  const result = new Map<string, ExportEntry>();

  collectLocal(sourceFile, result);
  collectReExports(sourceFile, filePath, stack, result);

  stack.delete(filePath);
  cache.set(filePath, result);
  return result;
}

function collectLocal(
  sourceFile: SourceFile,
  out: Map<string, ExportEntry>,
): void {
  for (const node of sourceFile.statements) {
    if (!hasExportModifier(node)) {
      continue;
    }
    if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
      out.set(node.name.text, {
        node,
        sourceFile,
      });
      continue;
    }
    if (ts.isTypeAliasDeclaration(node)) {
      out.set(node.name.text, {
        node,
        sourceFile,
      });
      continue;
    }
    if (ts.isInterfaceDeclaration(node)) {
      out.set(node.name.text, {
        node,
        sourceFile,
      });
      continue;
    }
    if (ts.isClassDeclaration(node) && node.name !== undefined) {
      out.set(node.name.text, {
        node,
        sourceFile,
      });
      continue;
    }
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          out.set(declaration.name.text, {
            node,
            sourceFile,
          });
        }
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
    const nested = walk(resolved, stack);

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
  return modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}
