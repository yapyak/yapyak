import type {
  Block,
  ExportKind,
  TableCellBlock,
  TableRowBlock,
} from '../../access/block';
import type { Page } from '../../build';
import type { SourceUrlConfig } from '../../config';
import type { PackageContext } from './package-context';
import type { SymbolIndex } from './symbol-index';
import type {
  ReferenceExample,
  ReferenceExport,
  ReferenceMember,
  ReferenceModule,
  ReferenceOverload,
  ReferenceParameter,
  ReferenceThrows,
  ReferenceTypeAlias,
  ReferenceTypeParameter,
  ReferenceVariable,
  TypeToken,
} from './type';

import { slugify } from '../../slug';
import { buildSymbolHref } from '../../symbol-path';
import { parseMarkdoc } from '../markdoc';
import { relative, resolve } from 'node:path';

let currentIndex: SymbolIndex = new Map();
let currentCollection = 'reference';
let currentPackageName = '';
let currentPackageSlug = '';

interface BuildSymbolPageInput {
  href: string;
  index: SymbolIndex;
  moduleId: string;
  packageDir: string;
}

interface BuildSymbolPageOptions {
  sourceUrl?: SourceUrlConfig;
}

export function buildSymbolPage(
  symbol: ReferenceExport,
  context: PackageContext,
  input: BuildSymbolPageInput,
  options: BuildSymbolPageOptions = {},
): Page {
  currentIndex = input.index;
  currentCollection = context.collectionName;
  currentPackageName = context.packageName;
  currentPackageSlug = context.packageSlug;
  const blocks: Block[] = [];

  blocks.push(
    buildEyebrowBlock(
      input.moduleId,
      symbol.kind,
      resolveSourceHref(
        symbol.location.file,
        symbol.location.line,
        input.packageDir,
        options.sourceUrl,
      ),
    ),
  );

  if (symbol.deprecated !== null) {
    blocks.push({
      children: [
        {
          children: [{ type: 'text', value: symbol.deprecated }],
          type: 'paragraph',
        },
      ],
      title: 'Deprecated',
      type: 'callout',
      variant: 'warning',
    });
  }

  if (symbol.description) {
    const parsed = parseMarkdoc(symbol.description);
    blocks.push(...parsed.blocks);
  }

  if (symbol.remarks) {
    const parsed = parseMarkdoc(symbol.remarks);
    blocks.push(...parsed.blocks);
  }

  blocks.push(buildImportSnippet(input.moduleId, symbol.name, symbol.kind));

  if (symbol.kind === 'function') {
    blocks.push(buildHeading2Block('Signature'));
    blocks.push(buildFunctionSignatureBlock(symbol.overloads));
    const typeParameters = normalizeOverloadTypeParameters(symbol.overloads);
    if (typeParameters.length > 0) {
      blocks.push(buildHeading2Block('Type Parameters'));
      blocks.push(buildTypeParametersTable(typeParameters));
    }
    const parameters = normalizeOverloadParameters(symbol.overloads);
    if (parameters.length > 0) {
      blocks.push(buildHeading2Block('Parameters'));
      blocks.push(buildParametersTable(parameters));
    }
    if (symbol.members.length > 0) {
      blocks.push(buildHeading2Block('Members'));
      blocks.push(buildMembersTable(symbol.members));
    }
  }

  if (symbol.kind === 'variable') {
    blocks.push(buildHeading2Block('Type'));
    blocks.push(buildVariableSignatureBlock(symbol));
  }

  if (symbol.kind === 'interface') {
    if (symbol.callSignatures.length > 0) {
      blocks.push(buildHeading2Block('Call signatures'));
      blocks.push({
        label: null,
        language: 'ts',
        path: null,
        source: symbol.callSignatures.map((sig) => sig.signature).join('\n'),
        type: 'code-block',
      });
    }
    if (symbol.members.length > 0) {
      blocks.push(buildHeading2Block('Members'));
      blocks.push(buildMembersTable(symbol.members));
    }
  }

  if (symbol.kind === 'type' && symbol.resolvedType.length > 0) {
    blocks.push(buildHeading2Block('Type'));
    blocks.push(buildTypeAliasBlock(symbol));
  }

  if (symbol.kind === 'class') {
    if (symbol.members.length > 0) {
      blocks.push(buildHeading2Block('Members'));
      blocks.push(buildMembersTable(symbol.members));
    }
  }

  if (symbol.throws.length > 0) {
    blocks.push(buildHeading2Block('Throws'));
    blocks.push(buildThrowsTable(symbol.throws));
  }

  if (symbol.examples.length > 0) {
    blocks.push(buildHeading2Block('Examples'));
    for (const example of symbol.examples) {
      blocks.push(...buildExampleBlocks(example));
    }
  }

  if (symbol.seeAlso.length > 0) {
    blocks.push(buildHeading2Block('See also'));
    blocks.push(buildSeeAlsoList(symbol.seeAlso));
  }

  return {
    blocks,
    description: '',
    href: input.href,
    meta: {},
    title: symbol.kind === 'function' ? `${symbol.name}()` : symbol.name,
  };
}

function resolveSourceHref(
  file: string,
  line: number,
  packageDir: string,
  sourceUrl: SourceUrlConfig | undefined,
): string | null {
  if (sourceUrl === undefined || file === '') {
    return null;
  }
  const absolute = resolve(packageDir, file);
  const path = relative(sourceUrl.workspaceRoot, absolute).replaceAll(
    '\\',
    '/',
  );
  return sourceUrl.template
    .replaceAll('{path}', path)
    .replaceAll('{line}', String(line));
}

interface BuildModulePageInput {
  href: string;
  index: SymbolIndex;
  label: string;
}

interface BuildPackageIndexPageInput {
  href: string;
  label: string;
  subpaths: ReadonlyArray<{
    description: string;
    href: string;
    subpath: string;
  }>;
}

export function buildTypedocPackageIndexPage(
  context: PackageContext,
  input: BuildPackageIndexPageInput,
): Page {
  const blocks: Block[] = [];

  blocks.push({
    kind: null,
    module: context.packageName,
    sourceHref: null,
    type: 'eyebrow',
  });

  if (input.subpaths.length > 0) {
    blocks.push(buildHeading2Block('Subpaths'));
    blocks.push(buildSubpathsTable(input.subpaths));
  }

  return {
    blocks,
    description: '',
    href: input.href,
    meta: {},
    title: input.label,
  };
}

function buildSubpathsTable(
  subpaths: ReadonlyArray<{
    description: string;
    href: string;
    subpath: string;
  }>,
): Block {
  return {
    body: subpaths.map((entry) => ({
      children: [
        buildTableBodyCell([
          {
            children: [{ type: 'inline-code', value: entry.subpath }],
            href: entry.href,
            kind: 'internal',
            type: 'link',
          },
        ]),
        buildTableBodyCell(
          markdownToInline(getFirstSentence(entry.description)),
        ),
      ],
      type: 'table-row',
    })),
    head: buildTableHeaderRow(['Subpath', 'Description']),
    type: 'table',
  };
}

export function buildModulePage(
  module: ReferenceModule,
  context: PackageContext,
  input: BuildModulePageInput,
): Page {
  currentIndex = input.index;
  currentCollection = context.collectionName;
  currentPackageName = context.packageName;
  currentPackageSlug = context.packageSlug;
  const blocks: Block[] = [];

  blocks.push({
    kind: null,
    module: module.id,
    sourceHref: null,
    type: 'eyebrow',
  });

  if (module.description) {
    const parsed = parseMarkdoc(module.description);
    blocks.push(...parsed.blocks);
  }

  if (module.exports.length > 0) {
    blocks.push(buildHeading2Block('Exports'));
    blocks.push(buildExportsTable(module.exports, module.id));
  }

  return {
    blocks,
    description: '',
    href: input.href,
    meta: {},
    title: input.label,
  };
}

function buildExportsTable(
  exports: ReferenceExport[],
  moduleId: string,
): Block {
  return {
    body: exports.map((entry) => buildExportRow(entry, moduleId)),
    head: buildTableHeaderRow(['Name', 'Kind', 'Description']),
    type: 'table',
  };
}

function buildExportRow(
  entry: ReferenceExport,
  moduleId: string,
): TableRowBlock {
  const label = entry.kind === 'function' ? `${entry.name}()` : entry.name;
  const href = resolveSymbolHref(moduleId, entry.name);
  return {
    children: [
      buildTableBodyCell([
        {
          children: [{ type: 'inline-code', value: label }],
          href,
          kind: 'internal',
          type: 'link',
        },
      ]),
      buildTableBodyCell([{ type: 'text', value: entry.kind }]),
      buildTableBodyCell(markdownToInline(getFirstSentence(entry.description))),
    ],
    type: 'table-row',
  };
}

function getFirstSentence(text: string): string {
  if (text === '') {
    return '';
  }
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/);
  return match ? match[0].trim() : trimmed;
}

function buildFunctionSignatureBlock(overloads: ReferenceOverload[]): Block {
  return {
    label: null,
    language: 'ts',
    path: null,
    source: overloads.map((overload) => overload.signature).join('\n'),
    type: 'code-block',
  };
}

function buildVariableSignatureBlock(symbol: ReferenceVariable): Block {
  return {
    label: null,
    language: 'ts',
    path: null,
    source: symbol.type.map((token) => token.text).join(''),
    type: 'code-block',
  };
}

function buildTypeAliasBlock(symbol: ReferenceTypeAlias): Block {
  return {
    label: null,
    language: 'ts',
    path: null,
    source: symbol.resolvedType.map((token) => token.text).join(''),
    type: 'code-block',
  };
}

function normalizeOverloadParameters(
  overloads: ReferenceOverload[],
): ReferenceParameter[] {
  if (overloads.length === 0) {
    return [];
  }
  const maxLength = Math.max(
    ...overloads.map((overload) => overload.parameters.length),
  );
  const unified: ReferenceParameter[] = [];
  for (let position = 0; position < maxLength; position++) {
    const present = overloads.filter((overload) =>
      Boolean(overload.parameters[position]),
    );
    const first = present[0]?.parameters[position];
    if (!first) {
      continue;
    }
    const isInAllOverloads = present.length === overloads.length;
    unified.push({ ...first, optional: !isInAllOverloads || first.optional });
  }
  return unified;
}

function buildEyebrowBlock(
  moduleId: string,
  kind: ExportKind,
  sourceHref: string | null,
): Block {
  return { kind, module: moduleId, sourceHref, type: 'eyebrow' };
}

function buildImportSnippet(
  moduleId: string,
  symbolName: string,
  kind: ExportKind,
): Block {
  const prefix =
    kind === 'interface' || kind === 'type' ? 'import type' : 'import';
  return {
    label: null,
    language: 'ts',
    path: null,
    source: `${prefix} { ${symbolName} } from '${moduleId}';`,
    type: 'code-block',
  };
}

function buildHeading2Block(text: string): Block {
  return {
    children: [{ type: 'text', value: text }],
    id: slugify(text),
    level: 2,
    type: 'heading',
  };
}

function normalizeOverloadTypeParameters(
  overloads: ReferenceOverload[],
): ReferenceTypeParameter[] {
  const seenNames = new Set<string>();
  const unified: ReferenceTypeParameter[] = [];
  for (const overload of overloads) {
    for (const typeParameter of overload.typeParameters) {
      if (seenNames.has(typeParameter.name)) {
        continue;
      }
      seenNames.add(typeParameter.name);
      unified.push(typeParameter);
    }
  }
  return unified;
}

function buildTypeParametersTable(
  typeParameters: ReferenceTypeParameter[],
): Block {
  return {
    body: typeParameters.map(buildTypeParameterRow),
    head: buildTableHeaderRow(['Name', 'Constraint', 'Default', 'Description']),
    type: 'table',
  };
}

function buildTypeParameterRow(
  typeParameter: ReferenceTypeParameter,
): TableRowBlock {
  return {
    children: [
      buildTableBodyCell([{ type: 'inline-code', value: typeParameter.name }]),
      buildTableBodyCell(
        typeParameter.constraint !== null
          ? tokensToBlocks(typeParameter.constraint)
          : [{ type: 'text', value: '' }],
      ),
      buildTableBodyCell(
        typeParameter.defaultType !== null
          ? tokensToBlocks(typeParameter.defaultType)
          : [{ type: 'text', value: '' }],
      ),
      buildTableBodyCell(markdownToInline(typeParameter.description)),
    ],
    type: 'table-row',
  };
}

function buildParametersTable(parameters: ReferenceParameter[]): Block {
  const hasDefault = parameters.some(
    (parameter) => parameter.defaultValue !== null,
  );
  return {
    body: parameters.map((parameter) =>
      buildParameterRow(parameter, hasDefault),
    ),
    head: buildTableHeaderRow(
      hasDefault
        ? ['Name', 'Type', 'Default', 'Description']
        : ['Name', 'Type', 'Description'],
    ),
    type: 'table',
  };
}

function buildMembersTable(members: ReferenceMember[]): Block {
  const hasDefault = members.some((member) => member.defaultValue !== null);
  return {
    body: members.map((member) => buildMemberRow(member, hasDefault)),
    head: buildTableHeaderRow(
      hasDefault
        ? ['Name', 'Type', 'Default', 'Description']
        : ['Name', 'Type', 'Description'],
    ),
    type: 'table',
  };
}

function buildParameterRow(
  parameter: ReferenceParameter,
  includeDefault: boolean,
): TableRowBlock {
  const children: TableCellBlock[] = [
    buildTableBodyCell([
      {
        type: 'inline-code',
        value: parameter.name + (parameter.optional ? '?' : ''),
      },
    ]),
    buildTableBodyCell(tokensToBlocks(parameter.type)),
  ];
  if (includeDefault) {
    children.push(
      buildTableBodyCell(
        parameter.defaultValue !== null
          ? markdownToInline(parameter.defaultValue)
          : [{ type: 'text', value: '' }],
      ),
    );
  }
  children.push(buildTableBodyCell(markdownToInline(parameter.description)));
  return { children, type: 'table-row' };
}

function buildMemberRow(
  member: ReferenceMember,
  includeDefault: boolean,
): TableRowBlock {
  const children: TableCellBlock[] = [
    buildTableBodyCell([
      {
        type: 'inline-code',
        value: member.name + (member.optional ? '?' : ''),
      },
    ]),
    buildTableBodyCell(tokensToBlocks(member.type)),
  ];
  if (includeDefault) {
    children.push(
      buildTableBodyCell(
        member.defaultValue !== null
          ? markdownToInline(member.defaultValue)
          : [{ type: 'text', value: '' }],
      ),
    );
  }
  children.push(buildTableBodyCell(markdownToInline(member.description)));
  return { children, type: 'table-row' };
}

function buildTableBodyCell(children: Block[]) {
  return { children, header: false, type: 'table-cell' as const };
}

function buildTableHeaderRow(labels: string[]): TableRowBlock {
  return {
    children: labels.map((label) => ({
      children: [{ type: 'text' as const, value: label }],
      header: true,
      type: 'table-cell' as const,
    })),
    type: 'table-row',
  };
}

function tokensToBlocks(tokens: TypeToken[]): Block[] {
  const blocks: Block[] = [];
  for (const token of tokens) {
    const resolvedModule = token.kind === 'ref' ? resolveModule(token) : null;
    if (token.kind === 'ref' && resolvedModule !== null) {
      blocks.push({
        children: [{ type: 'inline-code', value: token.text }],
        href: resolveSymbolHref(resolvedModule, token.name),
        kind: 'internal',
        type: 'link',
      });
    } else {
      blocks.push({ type: 'inline-code', value: token.text });
    }
  }
  if (blocks.length === 0) {
    blocks.push({ type: 'inline-code', value: '' });
  }
  return blocks;
}

function resolveModule(token: { module: string; name: string }): string | null {
  const exactKey = `${token.module}::${token.name}`;
  if (currentIndex.has(exactKey)) {
    return token.module;
  }
  const fallback = currentIndex.get(token.name);
  return fallback ?? null;
}

function resolveSymbolHref(moduleId: string, name: string): string {
  return buildSymbolHref(moduleId, name, {
    collectionName: currentCollection,
    packageName: currentPackageName,
    packageSlug: currentPackageSlug,
  });
}

function markdownToInline(source: string): Block[] {
  if (source === '') {
    return [{ type: 'text', value: '' }];
  }
  const parsed = parseMarkdoc(source);
  const blocks = parsed.blocks;
  if (blocks.length === 1 && blocks[0] && blocks[0].type === 'paragraph') {
    return blocks[0].children;
  }
  return blocks;
}

function buildExampleBlocks(example: ReferenceExample): Block[] {
  const result: Block[] = [];
  if (example.title !== null) {
    result.push({
      children: [{ type: 'text', value: example.title }],
      id: slugify(example.title),
      level: 3,
      type: 'heading',
    });
  }
  result.push({
    label: null,
    language: example.language,
    path: example.path,
    source: example.code,
    type: 'code-block',
  });
  return result;
}

function buildThrowsTable(throws: ReferenceThrows[]): Block {
  return {
    body: throws.map(buildThrowsRow),
    head: buildTableHeaderRow(['Error', 'When']),
    type: 'table',
  };
}

function buildThrowsRow(entry: ReferenceThrows): TableRowBlock {
  return {
    children: [
      buildTableBodyCell(
        entry.errorClass
          ? [{ type: 'inline-code', value: entry.errorClass }]
          : [{ type: 'text', value: '' }],
      ),
      buildTableBodyCell(markdownToInline(entry.condition)),
    ],
    type: 'table-row',
  };
}

function buildSeeAlsoList(entries: string[]): Block {
  return {
    children: entries.map((entry) => ({
      children: markdownToInline(entry),
      type: 'list-item',
    })),
    ordered: false,
    type: 'list',
  };
}
