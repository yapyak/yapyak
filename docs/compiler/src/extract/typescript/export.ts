import type { Node, SourceFile } from '@typescript/typescript6';

import ts from '@typescript/typescript6';

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
  const exportsByName = new Map<string, ExportEntry>();

  collectLocalExports(sourceFile, exportsByName);
  collectReExports(sourceFile, filePath, stack, exportsByName);

  stack.delete(filePath);
  exportsByFile.set(filePath, exportsByName);
  return exportsByName;
}

function collectLocalExports(
  sourceFile: SourceFile,
  out: Map<string, ExportEntry>,
): void {
  const localByName = new Map<string, ExportEntry>();
  for (const node of sourceFile.statements) {
    for (const [name, entry] of collectDeclarationEntries(node, sourceFile)) {
      localByName.set(name, entry);
    }
  }

  for (const node of sourceFile.statements) {
    if (hasExportModifier(node)) {
      for (const [name, entry] of collectDeclarationEntries(node, sourceFile)) {
        out.set(name, entry);
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

function collectDeclarationEntries(
  node: Node,
  sourceFile: SourceFile,
): [
  string,
  ExportEntry,
][] {
  if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
    return [
      [
        node.name.text,
        {
          node,
          sourceFile,
        },
      ],
    ];
  }
  if (ts.isTypeAliasDeclaration(node)) {
    return [
      [
        node.name.text,
        {
          node,
          sourceFile,
        },
      ],
    ];
  }
  if (ts.isInterfaceDeclaration(node)) {
    return [
      [
        node.name.text,
        {
          node,
          sourceFile,
        },
      ],
    ];
  }
  if (ts.isClassDeclaration(node) && node.name !== undefined) {
    return [
      [
        node.name.text,
        {
          node,
          sourceFile,
        },
      ],
    ];
  }
  if (ts.isVariableStatement(node)) {
    const entries: [
      string,
      ExportEntry,
    ][] = [];
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        entries.push([
          declaration.name.text,
          {
            node,
            sourceFile,
          },
        ]);
      }
    }
    return entries;
  }
  return [];
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
