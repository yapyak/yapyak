import type MagicString from 'magic-string';
import type { Fragment } from '../../../../processor';

import ts from 'typescript';

import { YAPYAK_MODULE } from '../../binding';
import { getScriptKind } from '../../script-kind';

export type TransformScriptImportsInput = {
  fileId: string;
  fragments: Fragment[];
  magicString: MagicString;
};

export function transformScriptImports(
  input: TransformScriptImportsInput,
): void {
  const intermediate = input.magicString.toString();
  for (const fragment of input.fragments) {
    if (fragment.kind !== 'script') {
      continue;
    }
    const scriptKind = getScriptKind(input.fileId, fragment.lang);
    const sourceFile = ts.createSourceFile(
      input.fileId,
      fragment.code,
      ts.ScriptTarget.ESNext,
      true,
      scriptKind,
    );
    const coreImports = extractCoreImports(sourceFile);
    for (const declaration of coreImports) {
      transformImportDeclaration({
        declaration,
        fragment,
        intermediate,
        magicString: input.magicString,
        scriptKind,
        sourceFile,
      });
    }
  }
}

type TransformImportDeclarationInput = {
  declaration: ts.ImportDeclaration;
  fragment: Fragment;
  intermediate: string;
  magicString: MagicString;
  scriptKind: ts.ScriptKind;
  sourceFile: ts.SourceFile;
};

type ImportSpecifier = {
  imported: string;
  local: string;
  typeOnly: boolean;
};

function transformImportDeclaration(
  input: TransformImportDeclarationInput,
): void {
  const {
    declaration,
    fragment,
    intermediate,
    magicString,
    scriptKind,
    sourceFile,
  } = input;
  if (declaration.importClause?.isTypeOnly === true) {
    return;
  }
  const namedBindings = declaration.importClause?.namedBindings;
  if (!namedBindings) {
    return;
  }
  const startInOriginal =
    declaration.getStart(sourceFile) + fragment.originalOffset;
  const endInOriginal = declaration.getEnd() + fragment.originalOffset;
  if (ts.isNamespaceImport(namedBindings)) {
    const localName = namedBindings.name.text;
    const occurrences = resolveReferenceCount(
      intermediate,
      localName,
      scriptKind,
    );
    if (occurrences <= 1) {
      magicString.remove(startInOriginal, endInOriginal);
    }
    return;
  }
  if (!ts.isNamedImports(namedBindings)) {
    return;
  }
  const remaining: ImportSpecifier[] = [];
  for (const element of namedBindings.elements) {
    const importedName = (element.propertyName ?? element.name).text;
    const localName = element.name.text;
    const isTypeOnly = element.isTypeOnly;
    if (isTypeOnly) {
      remaining.push({
        imported: importedName,
        local: localName,
        typeOnly: true,
      });
      continue;
    }
    const occurrences = resolveReferenceCount(
      intermediate,
      localName,
      scriptKind,
    );
    if (occurrences > 1) {
      remaining.push({
        imported: importedName,
        local: localName,
        typeOnly: false,
      });
    }
  }
  if (remaining.length === 0) {
    magicString.remove(startInOriginal, endInOriginal);
    return;
  }
  const specList = remaining.map(renderSpecifier).join(', ');
  const moduleSpecText = declaration.moduleSpecifier.getText(sourceFile);
  magicString.overwrite(
    startInOriginal,
    endInOriginal,
    `import { ${specList} } from ${moduleSpecText};`,
  );
}

function renderSpecifier(item: ImportSpecifier): string {
  const prefix = item.typeOnly ? 'type ' : '';
  const body =
    item.imported === item.local
      ? item.imported
      : `${item.imported} as ${item.local}`;
  return `${prefix}${body}`;
}

function extractCoreImports(sourceFile: ts.SourceFile): ts.ImportDeclaration[] {
  const result: ts.ImportDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    if (statement.moduleSpecifier.text !== YAPYAK_MODULE) {
      continue;
    }
    result.push(statement);
  }
  return result;
}

function resolveReferenceCount(
  code: string,
  name: string,
  scriptKind: ts.ScriptKind,
): number {
  const sourceFile = ts.createSourceFile(
    'ref-count.ts',
    code,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  let count = 0;
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === name && isReference(node)) {
      count += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return count;
}

function isReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) {
    return true;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return false;
  }
  if (ts.isPropertyAssignment(parent) && parent.name === node) {
    return false;
  }
  if (ts.isJsxAttribute(parent) && parent.name === node) {
    return false;
  }
  return true;
}
