import type MagicString from 'magic-string';
import type { Fragment } from '../../../../processor';

import ts from '@typescript/typescript6';

import { YAPYAK_MODULE } from '../../binding';
import { remapOffset } from '../../offset';
import { getScriptKind } from '../../script-kind';

export type TransformScriptImportsInput = {
  fileId: string;
  fragments: Fragment[];
  magicString: MagicString;
};

export function transformScriptImports(
  input: TransformScriptImportsInput,
): void {
  const referenceAsts = input.fragments
    .map((fragment) => parseFragmentReferenceAst(input, fragment))
    .filter((ast): ast is ts.SourceFile => ast !== undefined);
  for (const fragment of input.fragments) {
    if (fragment.type !== 'script') {
      continue;
    }
    const declarationAst = ts.createSourceFile(
      input.fileId,
      fragment.code,
      ts.ScriptTarget.ESNext,
      true,
      getScriptKind(input.fileId, fragment.language),
    );
    for (const declaration of extractCoreImports(declarationAst)) {
      transformImportDeclaration({
        declaration,
        declarationAst,
        fragment,
        magicString: input.magicString,
        referenceAsts,
      });
    }
  }
}

function parseFragmentReferenceAst(
  input: TransformScriptImportsInput,
  fragment: Fragment,
): ts.SourceFile | undefined {
  let postTransformCode: string;
  try {
    postTransformCode = input.magicString.slice(
      remapOffset(0, fragment),
      remapOffset(fragment.code.length, fragment),
    );
  } catch {
    return undefined;
  }
  return ts.createSourceFile(
    input.fileId,
    postTransformCode,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(input.fileId, fragment.language),
  );
}

type TransformImportDeclarationInput = {
  declaration: ts.ImportDeclaration;
  declarationAst: ts.SourceFile;
  fragment: Fragment;
  magicString: MagicString;
  referenceAsts: ts.SourceFile[];
};

type ImportSpecifier = {
  imported: string;
  local: string;
  typeOnly: boolean;
};

function transformImportDeclaration(
  input: TransformImportDeclarationInput,
): void {
  const { declaration, declarationAst, fragment, magicString, referenceAsts } =
    input;
  if (declaration.importClause?.isTypeOnly === true) {
    return;
  }
  const namedBindings = declaration.importClause?.namedBindings;
  if (!namedBindings) {
    return;
  }
  const startInOriginal = remapOffset(
    declaration.getStart(declarationAst),
    fragment,
  );
  const endInOriginal = remapOffset(declaration.getEnd(), fragment);
  if (ts.isNamespaceImport(namedBindings)) {
    const localName = namedBindings.name.text;
    if (countReferences(referenceAsts, localName) === 0) {
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
    if (element.isTypeOnly) {
      remaining.push({
        imported: importedName,
        local: localName,
        typeOnly: true,
      });
      continue;
    }
    if (countReferences(referenceAsts, localName) > 0) {
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
  const moduleSpecText = declaration.moduleSpecifier.getText(declarationAst);
  magicString.overwrite(
    startInOriginal,
    endInOriginal,
    `import { ${specList} } from ${moduleSpecText};`,
  );
}

function renderSpecifier(specifier: ImportSpecifier): string {
  const prefix = specifier.typeOnly ? 'type ' : '';
  const body =
    specifier.imported === specifier.local
      ? specifier.imported
      : `${specifier.imported} as ${specifier.local}`;
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

function countReferences(referenceAsts: ts.SourceFile[], name: string): number {
  let total = 0;
  for (const referenceAst of referenceAsts) {
    total += countReferencesIn(referenceAst, name);
  }
  return total;
}

function countReferencesIn(sourceFile: ts.SourceFile, name: string): number {
  let count = 0;
  const walkNode = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === name && isReference(node)) {
      count += 1;
    }
    ts.forEachChild(node, walkNode);
  };
  walkNode(sourceFile);
  return count;
}

function isReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) {
    return true;
  }
  if (ts.isImportSpecifier(parent) && parent.name === node) {
    return false;
  }
  if (ts.isNamespaceImport(parent) && parent.name === node) {
    return false;
  }
  if (ts.isImportClause(parent) && parent.name === node) {
    return false;
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
