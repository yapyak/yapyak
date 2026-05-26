import type { Block, ExportKind, TableRowBlock } from '../../types/block.ts';
import type { Page } from '../../types/manifest.ts';
import type {
  ReferenceExample,
  ReferenceExport,
  ReferenceManifest,
  ReferenceMember,
  ReferenceModule,
  ReferenceOverload,
  ReferenceParameter,
  ReferenceThrows,
  ReferenceTypeAlias,
  ReferenceTypeParameter,
  ReferenceVariable,
  TypeToken,
} from './types.ts';

import { slugify } from '../../utils/slug.ts';
import { parseMarkdoc } from '../markdoc/parse.ts';

type SymbolIndex = Map<string, string>;

let currentIndex: SymbolIndex = new Map();
let currentCollection = 'reference';
let currentPackageName = '';
let currentPackageSlug = '';

export function buildSymbolIndex(manifest: ReferenceManifest): SymbolIndex {
  const index: SymbolIndex = new Map();
  for (const module of manifest.modules) {
    for (const entry of module.exports) {
      const key = `${module.id}::${entry.name}`;
      index.set(key, module.id);
      if (!index.has(entry.name)) {
        index.set(entry.name, module.id);
      }
    }
  }
  return index;
}

interface BuildSymbolPageOptions {
  collectionName: string;
  href: string;
  index: SymbolIndex;
  moduleId: string;
  packageName: string;
  packageSlug: string;
}

export function buildSymbolPage(
  symbol: ReferenceExport,
  options: BuildSymbolPageOptions,
): Page {
  currentIndex = options.index;
  currentCollection = options.collectionName;
  currentPackageName = options.packageName;
  currentPackageSlug = options.packageSlug;
  const blocks: Block[] = [];

  blocks.push(eyebrow(options.moduleId, symbol.kind));

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

  blocks.push(importSnippet(options.moduleId, symbol.name, symbol.kind));

  if (symbol.kind === 'function') {
    blocks.push(heading2('Signature'));
    blocks.push(functionSignatureBlock(symbol.overloads));
    const typeParameters = unifyTypeParameters(symbol.overloads);
    if (typeParameters.length > 0) {
      blocks.push(heading2('Type Parameters'));
      blocks.push(typeParametersTable(typeParameters));
    }
    const parameters = unifyParameters(symbol.overloads);
    if (parameters.length > 0) {
      blocks.push(heading2('Parameters'));
      blocks.push(parametersTable(parameters));
    }
    const returnType = symbol.overloads[0]?.returnType;
    if (returnType && (!isVoidTokens(returnType) || symbol.returnDescription)) {
      blocks.push(heading2('Returns'));
      blocks.push(returnsParagraph(returnType, symbol.returnDescription));
    }
    if (symbol.members.length > 0) {
      blocks.push(heading2('Members'));
      blocks.push(membersTable(symbol.members));
    }
  }

  if (symbol.kind === 'variable') {
    blocks.push(heading2('Signature'));
    blocks.push(variableSignatureBlock(symbol));
    if (symbol.members.length > 0) {
      blocks.push(heading2('Members'));
      blocks.push(membersTable(symbol.members));
    }
  }

  if (symbol.kind === 'interface') {
    if (symbol.callSignatures.length > 0) {
      blocks.push(heading2('Call signatures'));
      blocks.push({
        label: null,
        language: 'ts',
        source: symbol.callSignatures.map((sig) => sig.signature).join('\n'),
        type: 'code-block',
      });
    }
    if (symbol.members.length > 0) {
      blocks.push(heading2('Members'));
      blocks.push(membersTable(symbol.members));
    }
  }

  if (symbol.kind === 'type' && symbol.resolvedType.length > 0) {
    blocks.push(heading2('Type'));
    blocks.push(typeAliasBlock(symbol));
  }

  if (symbol.kind === 'class') {
    if (symbol.members.length > 0) {
      blocks.push(heading2('Members'));
      blocks.push(membersTable(symbol.members));
    }
  }

  if (symbol.throws.length > 0) {
    blocks.push(heading2('Throws'));
    blocks.push(throwsTable(symbol.throws));
  }

  if (symbol.examples.length > 0) {
    blocks.push(heading2('Examples'));
    for (const example of symbol.examples) {
      blocks.push(...exampleBlocks(example));
    }
  }

  if (symbol.seeAlso.length > 0) {
    blocks.push(heading2('See also'));
    blocks.push(seeAlsoList(symbol.seeAlso));
  }

  blocks.push({
    file: symbol.location.file,
    href: null,
    line: symbol.location.line,
    type: 'code-location',
  });

  return {
    blocks,
    description: '',
    href: options.href,
    meta: {},
    title: symbol.kind === 'function' ? `${symbol.name}()` : symbol.name,
  };
}

interface BuildModulePageOptions {
  collectionName: string;
  href: string;
  index: SymbolIndex;
  label: string;
  packageName: string;
  packageSlug: string;
}

export function buildModulePage(
  module: ReferenceModule,
  options: BuildModulePageOptions,
): Page {
  currentIndex = options.index;
  currentCollection = options.collectionName;
  currentPackageName = options.packageName;
  currentPackageSlug = options.packageSlug;
  const blocks: Block[] = [];

  blocks.push({ kind: null, module: module.id, type: 'eyebrow' });

  if (module.description) {
    const parsed = parseMarkdoc(module.description);
    blocks.push(...parsed.blocks);
  }

  if (module.exports.length > 0) {
    blocks.push(heading2('Exports'));
    blocks.push(exportsTable(module.exports, module.id));
  }

  return {
    blocks,
    description: '',
    href: options.href,
    meta: {},
    title: options.label,
  };
}

function exportsTable(exports: ReferenceExport[], moduleId: string): Block {
  return {
    body: exports.map((entry) => exportRow(entry, moduleId)),
    head: tableHeaderRow(['Name', 'Kind', 'Description']),
    type: 'table',
  };
}

function exportRow(entry: ReferenceExport, moduleId: string): TableRowBlock {
  const label = entry.kind === 'function' ? `${entry.name}()` : entry.name;
  const href = symbolHref(moduleId, entry.name);
  return {
    children: [
      bodyCell([
        {
          children: [{ type: 'inline-code', value: label }],
          href,
          kind: 'internal',
          type: 'link',
        },
      ]),
      bodyCell([{ type: 'text', value: entry.kind }]),
      bodyCell(markdownToInline(firstSentence(entry.description))),
    ],
    type: 'table-row',
  };
}

function firstSentence(text: string): string {
  if (text === '') {
    return '';
  }
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/);
  return match ? match[0].trim() : trimmed;
}

function functionSignatureBlock(overloads: ReferenceOverload[]): Block {
  return {
    label: null,
    language: 'ts',
    source: overloads.map((overload) => overload.signature).join('\n'),
    type: 'code-block',
  };
}

function variableSignatureBlock(symbol: ReferenceVariable): Block {
  return {
    label: null,
    language: 'ts',
    source: symbol.signature,
    type: 'code-block',
  };
}

function typeAliasBlock(symbol: ReferenceTypeAlias): Block {
  return {
    label: null,
    language: 'ts',
    source: symbol.resolvedType.map((token) => token.text).join(''),
    type: 'code-block',
  };
}

function unifyParameters(overloads: ReferenceOverload[]): ReferenceParameter[] {
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
    const inAll = present.length === overloads.length;
    unified.push({ ...first, optional: !inAll || first.optional });
  }
  return unified;
}

function eyebrow(moduleId: string, kind: ExportKind): Block {
  return { kind, module: moduleId, type: 'eyebrow' };
}

function importSnippet(
  moduleId: string,
  symbolName: string,
  kind: ExportKind,
): Block {
  const prefix =
    kind === 'interface' || kind === 'type' ? 'import type' : 'import';
  return {
    label: null,
    language: 'ts',
    source: `${prefix} { ${symbolName} } from '${moduleId}';`,
    type: 'code-block',
  };
}

function heading2(text: string): Block {
  return {
    children: [{ type: 'text', value: text }],
    id: slugify(text),
    level: 2,
    type: 'heading',
  };
}

function unifyTypeParameters(
  overloads: ReferenceOverload[],
): ReferenceTypeParameter[] {
  const seen = new Set<string>();
  const unified: ReferenceTypeParameter[] = [];
  for (const overload of overloads) {
    for (const typeParameter of overload.typeParameters) {
      if (seen.has(typeParameter.name)) {
        continue;
      }
      seen.add(typeParameter.name);
      unified.push(typeParameter);
    }
  }
  return unified;
}

function typeParametersTable(typeParameters: ReferenceTypeParameter[]): Block {
  return {
    body: typeParameters.map(typeParameterRow),
    head: tableHeaderRow(['Name', 'Constraint', 'Default', 'Description']),
    type: 'table',
  };
}

function typeParameterRow(
  typeParameter: ReferenceTypeParameter,
): TableRowBlock {
  return {
    children: [
      bodyCell([{ type: 'inline-code', value: typeParameter.name }]),
      bodyCell(
        typeParameter.constraint !== null
          ? tokensToBlocks(typeParameter.constraint)
          : [{ type: 'text', value: '' }],
      ),
      bodyCell(
        typeParameter.defaultType !== null
          ? tokensToBlocks(typeParameter.defaultType)
          : [{ type: 'text', value: '' }],
      ),
      bodyCell(markdownToInline(typeParameter.description)),
    ],
    type: 'table-row',
  };
}

function parametersTable(parameters: ReferenceParameter[]): Block {
  return {
    body: parameters.map(paramRow),
    head: tableHeaderRow(['Name', 'Type', 'Description']),
    type: 'table',
  };
}

function membersTable(members: ReferenceMember[]): Block {
  return {
    body: members.map(memberRow),
    head: tableHeaderRow(['Name', 'Type', 'Description']),
    type: 'table',
  };
}

function paramRow(parameter: ReferenceParameter): TableRowBlock {
  return {
    children: [
      bodyCell([
        {
          type: 'inline-code',
          value: parameter.name + (parameter.optional ? '?' : ''),
        },
      ]),
      bodyCell(tokensToBlocks(parameter.type)),
      bodyCell(markdownToInline(parameter.description)),
    ],
    type: 'table-row',
  };
}

function memberRow(member: ReferenceMember): TableRowBlock {
  return {
    children: [
      bodyCell([
        {
          type: 'inline-code',
          value: member.name + (member.optional ? '?' : ''),
        },
      ]),
      bodyCell(tokensToBlocks(member.type)),
      bodyCell(markdownToInline(member.description)),
    ],
    type: 'table-row',
  };
}

function bodyCell(children: Block[]) {
  return { children, header: false, type: 'table-cell' as const };
}

function tableHeaderRow(labels: string[]): TableRowBlock {
  return {
    children: labels.map((label) => ({
      children: [{ type: 'text' as const, value: label }],
      header: true,
      type: 'table-cell' as const,
    })),
    type: 'table-row',
  };
}

function returnsParagraph(
  returnType: TypeToken[],
  returnDescription: string,
): Block {
  const children: Block[] = tokensToBlocks(returnType);
  if (returnDescription) {
    children.push({ type: 'text', value: ` — ${returnDescription}` });
  }
  return { children, type: 'paragraph' };
}

function tokensToBlocks(tokens: TypeToken[]): Block[] {
  const blocks: Block[] = [];
  for (const token of tokens) {
    const resolvedModule = token.kind === 'ref' ? resolveModule(token) : null;
    if (token.kind === 'ref' && resolvedModule !== null) {
      blocks.push({
        children: [{ type: 'inline-code', value: token.text }],
        href: symbolHref(resolvedModule, token.name),
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

function isVoidTokens(tokens: TypeToken[]) {
  return (
    tokens.length === 1 &&
    tokens[0]?.kind === 'text' &&
    tokens[0].text === 'void'
  );
}

function symbolHref(moduleId: string, name: string) {
  const safeName = encodeSymbolSegment(name);
  if (moduleId === currentPackageName) {
    return `/${currentCollection}/${currentPackageSlug}/${safeName}`;
  }
  const subSlug = moduleId.slice(currentPackageName.length + 1);
  return `/${currentCollection}/${currentPackageSlug}/${subSlug}/${safeName}`;
}

function encodeSymbolSegment(name: string): string {
  return name.replace(/^\$/, '');
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

function exampleBlocks(example: ReferenceExample): Block[] {
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
    source: example.code,
    type: 'code-block',
  });
  return result;
}

function throwsTable(throws: ReferenceThrows[]): Block {
  return {
    body: throws.map(throwsRow),
    head: tableHeaderRow(['Error', 'When']),
    type: 'table',
  };
}

function throwsRow(entry: ReferenceThrows): TableRowBlock {
  return {
    children: [
      bodyCell(
        entry.errorClass
          ? [{ type: 'inline-code', value: entry.errorClass }]
          : [{ type: 'text', value: '' }],
      ),
      bodyCell(markdownToInline(entry.condition)),
    ],
    type: 'table-row',
  };
}

function seeAlsoList(entries: string[]): Block {
  return {
    children: entries.map((entry) => ({
      children: markdownToInline(entry),
      type: 'list-item',
    })),
    ordered: false,
    type: 'list',
  };
}
