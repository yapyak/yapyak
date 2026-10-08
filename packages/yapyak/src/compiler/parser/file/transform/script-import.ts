import type MagicString from 'magic-string';
import type {
  ImportDeclaration,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Node,
  Program,
} from 'oxc-parser';
import type { Fragment } from '../../../../processor';
import type { SourceFile } from '../../source-file';

import { YAPYAK_MODULE } from '../../binding';
import { collectChildren } from '../../child';
import { remapOffset } from '../../offset';
import { parseSourceFile } from '../../source-file';
import { isReference } from './reference';

export type TransformScriptImportsInput = {
  fileId: string;
  fragments: Fragment[];
  magicString: MagicString;
  originalSource: string;
  sourceFilesByFragment: Map<Fragment, SourceFile>;
};

export function transformScriptImports(
  input: TransformScriptImportsInput,
): void {
  const referenceSourceFiles = input.fragments
    .map((fragment) => parseFragmentReferenceSourceFile(input, fragment))
    .filter((sourceFile) => sourceFile !== undefined);
  for (const [fragment, sourceFile] of input.sourceFilesByFragment) {
    for (const declaration of extractCoreImports(sourceFile.program)) {
      transformImportDeclaration({
        declaration,
        fragment,
        fragments: input.fragments,
        magicString: input.magicString,
        originalSource: input.originalSource,
        referenceSourceFiles,
      });
    }
  }
}

function parseFragmentReferenceSourceFile(
  input: TransformScriptImportsInput,
  fragment: Fragment,
): SourceFile | undefined {
  const postTransformCode = sliceEmittedFragment(fragment, input.magicString);
  if (postTransformCode === undefined) {
    return undefined;
  }
  return parseSourceFile(input.fileId, {
    code: postTransformCode,
    language:
      fragment.type === 'template-expression' && fragment.language === 'ts'
        ? 'tsx'
        : fragment.language,
    type: fragment.type,
  });
}

function sliceEmittedFragment(
  fragment: Fragment,
  magicString: MagicString,
): string | undefined {
  try {
    return magicString.slice(
      remapOffset(0, fragment),
      remapOffset(fragment.code.length, fragment),
    );
  } catch {
    return undefined;
  }
}

function extractCoreImports(program: Program): ImportDeclaration[] {
  const result: ImportDeclaration[] = [];
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    if (statement.source.value !== YAPYAK_MODULE) {
      continue;
    }
    result.push(statement);
  }
  return result;
}

type TransformImportDeclarationInput = {
  declaration: ImportDeclaration;
  fragment: Fragment;
  fragments: Fragment[];
  magicString: MagicString;
  originalSource: string;
  referenceSourceFiles: SourceFile[];
};

type RemainingSpecifier = {
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
    fragments,
    magicString,
    originalSource,
    referenceSourceFiles,
  } = input;
  if (declaration.importKind === 'type') {
    return;
  }
  const namespaceSpecifier = declaration.specifiers.find(
    (specifier): specifier is ImportNamespaceSpecifier =>
      specifier.type === 'ImportNamespaceSpecifier',
  );
  const namedSpecifiers = declaration.specifiers.filter(
    (specifier): specifier is ImportSpecifier =>
      specifier.type === 'ImportSpecifier',
  );
  if (namespaceSpecifier === undefined && namedSpecifiers.length === 0) {
    return;
  }
  const startInOriginal = remapOffset(declaration.start, fragment);
  const endInOriginal = remapOffset(declaration.end, fragment);
  if (namespaceSpecifier) {
    const localName = namespaceSpecifier.local.name;
    if (
      !hasReference(referenceSourceFiles, localName) &&
      !hasOutsideReference(originalSource, fragments, localName, 'namespace')
    ) {
      magicString.remove(startInOriginal, endInOriginal);
    }
    return;
  }
  const remaining: RemainingSpecifier[] = [];
  for (const specifier of namedSpecifiers) {
    const importedName =
      specifier.imported.type === 'Literal'
        ? specifier.imported.value
        : specifier.imported.name;
    const localName = specifier.local.name;
    if (specifier.importKind === 'type') {
      remaining.push({
        imported: importedName,
        local: localName,
        typeOnly: true,
      });
      continue;
    }
    if (
      hasReference(referenceSourceFiles, localName) ||
      hasOutsideReference(originalSource, fragments, localName, 'call')
    ) {
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
  const moduleSpecText = originalSource.slice(
    remapOffset(declaration.source.start, fragment),
    remapOffset(declaration.source.end, fragment),
  );
  magicString.overwrite(
    startInOriginal,
    endInOriginal,
    `import { ${specList} } from ${moduleSpecText};`,
  );
}

function hasReference(
  referenceSourceFiles: SourceFile[],
  name: string,
): boolean {
  return referenceSourceFiles.some((sourceFile) =>
    hasReferenceIn(sourceFile, name),
  );
}

function hasReferenceIn(sourceFile: SourceFile, name: string): boolean {
  if (sourceFile.fatalError) {
    return true;
  }
  const stack: Node[] = [
    sourceFile.program,
  ];
  let node = stack.pop();
  while (node) {
    if (node.type === 'Identifier' && node.name === name && isReference(node)) {
      return true;
    }
    stack.push(...collectChildren(node));
    node = stack.pop();
  }
  return false;
}

function hasOutsideReference(
  originalSource: string,
  fragments: Fragment[],
  name: string,
  usage: 'call' | 'namespace',
): boolean {
  const suffix = usage === 'call' ? String.raw`\s*\(` : String.raw`\s*[.(]`;
  const nameRx = new RegExp(
    `(?<![\\w$])${name.replaceAll('$', '\\$')}${suffix}`,
  );
  return uncoveredSourceRegions(originalSource, fragments).some((region) =>
    nameRx.test(region),
  );
}

type SourceSpan = {
  end: number;
  start: number;
};

function uncoveredSourceRegions(
  originalSource: string,
  fragments: Fragment[],
): string[] {
  const spans: SourceSpan[] = [];
  for (const fragment of fragments) {
    const span = toSourceSpan(fragment);
    if (span) {
      spans.push(span);
    }
  }
  spans.sort((a, b) => a.start - b.start);
  const regions: string[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) {
      regions.push(originalSource.slice(cursor, span.start));
    }
    cursor = Math.max(cursor, span.end);
  }
  if (cursor < originalSource.length) {
    regions.push(originalSource.slice(cursor));
  }
  return regions;
}

function toSourceSpan(fragment: Fragment): SourceSpan | undefined {
  try {
    return {
      end: remapOffset(fragment.code.length, fragment),
      start: remapOffset(0, fragment),
    };
  } catch {
    return undefined;
  }
}

function renderSpecifier(specifier: RemainingSpecifier): string {
  const prefix = specifier.typeOnly ? 'type ' : '';
  const body =
    specifier.imported === specifier.local
      ? specifier.imported
      : `${specifier.imported} as ${specifier.local}`;
  return `${prefix}${body}`;
}
