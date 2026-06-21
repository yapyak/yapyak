import type {
  Block,
  CodeExpressionBlock,
  ExportKind,
  TableCellBlock,
  TableRowBlock,
} from '../../access';
import type { Page } from '../../build';
import type { SourceUrlConfig } from '../../config';
import type { PackageContext } from './package-context';
import type { SymbolIndex } from './symbol-index';
import type {
  ReferenceExample,
  ReferenceExport,
  ReferenceMethodMember,
  ReferenceModule,
  ReferenceOverload,
  ReferenceParameter,
  ReferencePropertyMember,
  ReferenceThrows,
  ReferenceTypeAlias,
  ReferenceTypeParameter,
  ReferenceVariable,
  TypeToken,
} from './type';

import { nullify } from '../../nullify';
import { slugify } from '../../slugify';
import { buildSymbolHref } from '../../symbol-path';
import { parseMarkdown } from '../markdown';
import { classifyMemberDisplayKind } from './classify';
import { expandModuleEntries } from './module-entry';
import { relative, resolve } from 'node:path';

let currentIndex: SymbolIndex = new Map();
let currentCollection = 'reference';
let currentPackageName = '';
let currentPackageSlug = '';

type BuildSymbolPageInput = {
  href: string;
  index: SymbolIndex;
  moduleId: string;
  packageDir: string;
};

type BuildSymbolPageOptions = {
  eyebrowKind?: ExportKind;
  methodLinkVariable?: string;
  sourceUrl?: SourceUrlConfig;
};

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
      options.eyebrowKind ?? symbol.displayKind,
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
          children: [
            {
              type: 'text',
              value: symbol.deprecated,
            },
          ],
          type: 'paragraph',
        },
      ],
      title: 'Deprecated',
      type: 'callout',
      variant: 'warning',
    });
  }

  if (symbol.description) {
    const parsed = parseMarkdown(symbol.description);
    blocks.push(...parsed.blocks);
  }

  if (symbol.remarks) {
    const parsed = parseMarkdown(symbol.remarks);
    blocks.push(...parsed.blocks);
  }

  blocks.push(buildImportSnippet(input.moduleId, symbol.name, symbol.kind));

  if (symbol.kind === 'function') {
    blocks.push(buildHeading2Block('Signature'));
    if (symbol.shape) {
      blocks.push(buildShapeBlock(symbol.shape));
    } else {
      blocks.push(buildFunctionSignatureBlock(symbol.overloads));
    }
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
    const returnTokens = normalizeOverloadReturnType(symbol.overloads);
    if (returnTokens.length > 0) {
      blocks.push(buildHeading2Block('Returns'));
      blocks.push({
        children: [
          tokensToCodeExpression(resolveTypeTokens(returnTokens)),
        ],
        type: 'paragraph',
      });
    }
    const functionProperties = symbol.members.filter(
      (member): member is ReferencePropertyMember => member.kind === 'property',
    );
    if (functionProperties.length > 0) {
      blocks.push(buildHeading2Block('Members'));
      blocks.push(buildMembersTable(functionProperties));
    }
  }

  if (symbol.kind === 'variable') {
    if (symbol.shape) {
      blocks.push(buildHeading2Block('Type'));
      blocks.push(buildShapeBlock(symbol.shape));
    } else if (
      symbol.displayKind !== 'component' &&
      symbol.displayKind !== 'hook'
    ) {
      blocks.push(buildHeading2Block('Type'));
      blocks.push({
        children: [
          tokensToCodeExpression(resolveTypeTokens(symbol.type)),
        ],
        type: 'paragraph',
      });
    }
  }

  if (symbol.kind === 'interface') {
    if (symbol.shape) {
      blocks.push(buildHeading2Block('Type'));
      blocks.push(buildShapeBlock(symbol.shape));
    } else if (symbol.callSignatures.length > 0) {
      blocks.push(buildHeading2Block('Call signatures'));
      blocks.push({
        label: null,
        language: 'ts',
        path: null,
        source: symbol.callSignatures.map((sig) => sig.signature).join('\n'),
        type: 'code-block',
      });
    }
    const interfaceProperties = symbol.members.filter(
      (member): member is ReferencePropertyMember => member.kind === 'property',
    );
    const interfaceMethods = symbol.members.filter(
      (member): member is ReferenceMethodMember => member.kind === 'method',
    );
    if (interfaceProperties.length > 0) {
      blocks.push(buildHeading2Block('Members'));
      blocks.push(buildMembersTable(interfaceProperties));
    }
    if (interfaceMethods.length > 0) {
      blocks.push(buildHeading2Block('Methods'));
      if (options.methodLinkVariable === undefined) {
        blocks.push(...buildMethodSections(interfaceMethods));
      } else {
        blocks.push(
          ...buildMethodSummary(
            interfaceMethods,
            options.methodLinkVariable,
            input.moduleId,
            context,
          ),
        );
      }
    }
  }

  if (symbol.kind === 'type') {
    if (symbol.shape) {
      blocks.push(buildHeading2Block('Type'));
      blocks.push(buildShapeBlock(symbol.shape));
    } else {
      const typeProperties = symbol.members.filter(
        (member): member is ReferencePropertyMember =>
          member.kind === 'property',
      );
      const typeMethods = symbol.members.filter(
        (member): member is ReferenceMethodMember => member.kind === 'method',
      );
      if (typeProperties.length > 0) {
        blocks.push(buildHeading2Block('Members'));
        blocks.push(buildMembersTable(typeProperties));
      }
      if (typeMethods.length > 0) {
        blocks.push(buildHeading2Block('Methods'));
        if (options.methodLinkVariable === undefined) {
          blocks.push(...buildMethodSections(typeMethods));
        } else {
          blocks.push(
            ...buildMethodSummary(
              typeMethods,
              options.methodLinkVariable,
              input.moduleId,
              context,
            ),
          );
        }
      }
      if (
        typeProperties.length === 0 &&
        typeMethods.length === 0 &&
        symbol.resolvedType.length > 0
      ) {
        blocks.push(buildHeading2Block('Type'));
        blocks.push(buildTypeAliasBlock(symbol));
      }
    }
  }

  if (symbol.kind === 'class') {
    const classProperties = symbol.members.filter(
      (member): member is ReferencePropertyMember => member.kind === 'property',
    );
    const classMethods = symbol.members.filter(
      (member): member is ReferenceMethodMember => member.kind === 'method',
    );
    if (classProperties.length > 0) {
      blocks.push(buildHeading2Block('Members'));
      blocks.push(buildMembersTable(classProperties));
    }
    if (classMethods.length > 0) {
      blocks.push(buildHeading2Block('Methods'));
      blocks.push(...buildMethodSections(classMethods));
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
    title:
      (options.eyebrowKind ?? symbol.kind) === 'function'
        ? `${symbol.name}()`
        : symbol.name,
  };
}

export function buildPropertyMemberPage(
  parentSymbol: ReferenceExport,
  member: ReferencePropertyMember,
  context: PackageContext,
  input: BuildSymbolPageInput,
  options: BuildSymbolPageOptions = {},
): Page {
  currentIndex = input.index;
  currentCollection = context.collectionName;
  currentPackageName = context.packageName;
  currentPackageSlug = context.packageSlug;

  const fullName = `${parentSymbol.name}.${member.name}`;
  const memberKind = classifyMemberDisplayKind(member);
  const blocks: Block[] = [];

  blocks.push(
    buildEyebrowBlock(
      input.moduleId,
      memberKind,
      resolveSourceHref(
        parentSymbol.location.file,
        parentSymbol.location.line,
        input.packageDir,
        options.sourceUrl,
      ),
    ),
  );

  if (member.description) {
    const parsed = parseMarkdown(member.description);
    blocks.push(...parsed.blocks);
  }

  blocks.push(
    buildImportSnippet(input.moduleId, parentSymbol.name, parentSymbol.kind),
  );

  if (memberKind !== 'component' && memberKind !== 'hook') {
    blocks.push(buildHeading2Block('Type'));
    blocks.push({
      children: [
        tokensToCodeExpression(resolveTypeTokens(member.type)),
      ],
      type: 'paragraph',
    });
  }

  return {
    blocks,
    description: '',
    href: input.href,
    meta: {},
    title: fullName,
  };
}

export function buildMethodPage(
  parentSymbol: ReferenceExport,
  member: ReferenceMethodMember,
  context: PackageContext,
  input: BuildSymbolPageInput,
  options: BuildSymbolPageOptions = {},
): Page {
  currentIndex = input.index;
  currentCollection = context.collectionName;
  currentPackageName = context.packageName;
  currentPackageSlug = context.packageSlug;

  const fullName = `${parentSymbol.name}.${member.name}`;
  const blocks: Block[] = [];

  blocks.push(
    buildEyebrowBlock(
      input.moduleId,
      'function',
      resolveSourceHref(
        member.location.file,
        member.location.line,
        input.packageDir,
        options.sourceUrl,
      ),
    ),
  );

  if (member.deprecated !== null) {
    blocks.push({
      children: [
        {
          children: [
            {
              type: 'text',
              value: member.deprecated,
            },
          ],
          type: 'paragraph',
        },
      ],
      title: 'Deprecated',
      type: 'callout',
      variant: 'warning',
    });
  }

  if (member.description) {
    const parsed = parseMarkdown(member.description);
    blocks.push(...parsed.blocks);
  }

  if (member.remarks) {
    const parsed = parseMarkdown(member.remarks);
    blocks.push(...parsed.blocks);
  }

  blocks.push(
    buildImportSnippet(input.moduleId, parentSymbol.name, parentSymbol.kind),
  );

  blocks.push(buildHeading2Block('Signature'));
  if (member.shape) {
    blocks.push(buildShapeBlock(member.shape));
  } else {
    blocks.push(buildFunctionSignatureBlock(member.overloads));
  }

  const typeParameters = normalizeOverloadTypeParameters(member.overloads);
  if (typeParameters.length > 0) {
    blocks.push(buildHeading2Block('Type Parameters'));
    blocks.push(buildTypeParametersTable(typeParameters));
  }

  const parameters = normalizeOverloadParameters(member.overloads);
  if (parameters.length > 0) {
    blocks.push(buildHeading2Block('Parameters'));
    blocks.push(buildParametersTable(parameters));
  }

  const methodReturnTokens = normalizeOverloadReturnType(member.overloads);
  if (methodReturnTokens.length > 0) {
    blocks.push(buildHeading2Block('Returns'));
    blocks.push({
      children: [
        tokensToCodeExpression(resolveTypeTokens(methodReturnTokens)),
      ],
      type: 'paragraph',
    });
  }

  if (member.throws.length > 0) {
    blocks.push(buildHeading2Block('Throws'));
    blocks.push(buildThrowsTable(member.throws));
  }

  if (member.examples.length > 0) {
    blocks.push(buildHeading2Block('Examples'));
    for (const example of member.examples) {
      blocks.push(...buildExampleBlocks(example));
    }
  }

  if (member.seeAlso.length > 0) {
    blocks.push(buildHeading2Block('See also'));
    blocks.push(buildSeeAlsoList(member.seeAlso));
  }

  return {
    blocks,
    description: '',
    href: input.href,
    meta: {},
    title: `${fullName}()`,
  };
}

function resolveSourceHref(
  file: string,
  line: number,
  packageDir: string,
  sourceUrl: SourceUrlConfig | undefined,
): string | undefined {
  if (sourceUrl === undefined || file === '') {
    return undefined;
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

type BuildModulePageInput = {
  href: string;
  index: SymbolIndex;
  label: string;
};

type BuildPackageIndexPageInput = {
  href: string;
  label: string;
  subpaths: {
    description: string;
    href: string;
    subpath: string;
  }[];
};

export function buildPackageIndexPage(
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
  subpaths: {
    description: string;
    href: string;
    subpath: string;
  }[],
): Block {
  return {
    body: subpaths.map((entry) => ({
      children: [
        buildTableBodyCell([
          {
            children: [
              {
                type: 'inline-code',
                value: entry.subpath,
              },
            ],
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
    head: buildTableHeaderRow([
      'Subpath',
      'Description',
    ]),
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
    const parsed = parseMarkdown(module.description);
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
  const entries = expandModuleEntries(exports);
  return {
    body: entries.map((entry) => buildExportRow(entry, moduleId)),
    head: buildTableHeaderRow([
      'Name',
      'Kind',
      'Description',
    ]),
    type: 'table',
  };
}

function buildExportRow(
  entry: {
    description: string;
    kind: ExportKind;
    label: string;
    segment: string;
  },
  moduleId: string,
): TableRowBlock {
  const href = resolveSymbolHref(moduleId, entry.segment);
  return {
    children: [
      buildTableBodyCell([
        {
          children: [
            {
              type: 'inline-code',
              value: entry.label,
            },
          ],
          href,
          kind: 'internal',
          type: 'link',
        },
      ]),
      buildTableBodyCell([
        {
          kind: entry.kind,
          type: 'kind-badge',
        },
      ]),
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

function buildShapeBlock(shape: string): Block {
  return {
    label: null,
    language: 'ts',
    path: null,
    source: shape.trim(),
    type: 'code-block',
  };
}

function tokenizeShapeText(text: string): TypeToken[] {
  const tokens: TypeToken[] = [];
  const identifierRx = /[A-Z][A-Za-z0-9]*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  match = identifierRx.exec(text);
  while (match !== null) {
    const name = match[0];
    const moduleId = currentIndex.get(name);
    if (moduleId !== undefined) {
      if (match.index > lastIndex) {
        tokens.push({
          kind: 'text',
          text: text.slice(lastIndex, match.index),
        });
      }
      tokens.push({
        kind: 'ref',
        module: moduleId,
        name,
        text: name,
      });
      lastIndex = match.index + name.length;
    }
    match = identifierRx.exec(text);
  }
  if (lastIndex < text.length) {
    tokens.push({
      kind: 'text',
      text: text.slice(lastIndex),
    });
  }
  return tokens;
}

function resolveTypeTokens(tokens: TypeToken[]): TypeToken[] {
  const result: TypeToken[] = [];
  for (const token of tokens) {
    if (token.kind === 'ref') {
      result.push(token);
      continue;
    }
    result.push(...tokenizeShapeText(normalizeInlineType(token.text)));
  }
  return result;
}

function normalizeInlineType(text: string): string {
  let result = text.replace(/\s*\n\s*/g, ' ');
  result = result.replace(/([[(<])\s+/g, '$1');
  result = result.replace(/\s+([\])>])/g, '$1');
  result = result.replace(/[,;](\s*[\])>}])/g, '$1');
  return result.trim();
}

function buildTypeAliasBlock(symbol: ReferenceTypeAlias): Block {
  const raw = symbol.resolvedType.map((token) => token.text).join('');
  return {
    label: null,
    language: 'ts',
    path: null,
    source: dedentMultilineSignature(raw),
    type: 'code-block',
  };
}

function dedentMultilineSignature(text: string): string {
  const lines = text.split('\n');
  if (lines.length <= 1) {
    return text;
  }
  let minIndent = Number.POSITIVE_INFINITY;
  for (let index = 1; index < lines.length; index++) {
    const line = lines[index];
    if (line === undefined || line.trim() === '') {
      continue;
    }
    const match = /^[ \t]*/.exec(line);
    const indent = match === null ? 0 : match[0].length;
    if (indent < minIndent) {
      minIndent = indent;
    }
  }
  if (!Number.isFinite(minIndent) || minIndent === 0) {
    return text;
  }
  const result = [
    lines[0] ?? '',
  ];
  for (let index = 1; index < lines.length; index++) {
    const line = lines[index] ?? '';
    result.push(line.slice(minIndent));
  }
  return result.join('\n');
}

function normalizeOverloadReturnType(
  overloads: ReferenceOverload[],
): TypeToken[] {
  const seen = new Set<string>();
  const segments: TypeToken[][] = [];
  for (const overload of overloads) {
    if (overload.returnType.length === 0) {
      continue;
    }
    const key = overload.returnType.map((token) => token.text).join('');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    segments.push(overload.returnType);
  }
  if (segments.length === 0) {
    return [];
  }
  if (segments.length === 1) {
    return segments[0] ?? [];
  }
  const result: TypeToken[] = [];
  for (let index = 0; index < segments.length; index++) {
    if (index > 0) {
      result.push({
        kind: 'text',
        text: ' | ',
      });
    }
    const segment = segments[index];
    if (segment !== undefined) {
      result.push(...segment);
    }
  }
  return result;
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
    unified.push({
      ...first,
      optional: !isInAllOverloads || first.optional,
    });
  }
  return unified;
}

function buildEyebrowBlock(
  moduleId: string,
  kind: ExportKind,
  sourceHref: string | undefined,
): Block {
  return {
    kind,
    module: moduleId,
    sourceHref: nullify(sourceHref),
    type: 'eyebrow',
  };
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
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
    id: slugify(text),
    level: 2,
    type: 'heading',
  };
}

function buildHeading3Block(text: string, id: string): Block {
  return {
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
    id,
    level: 3,
    type: 'heading',
  };
}

function buildMethodSections(methods: ReferenceMethodMember[]): Block[] {
  const blocks: Block[] = [];
  for (const method of methods) {
    blocks.push(buildHeading3Block(`${method.name}()`, slugify(method.name)));
    if (method.description) {
      const parsed = parseMarkdown(method.description);
      blocks.push(...parsed.blocks);
    }
    if (method.shape) {
      blocks.push(buildShapeBlock(method.shape));
    } else {
      blocks.push(buildFunctionSignatureBlock(method.overloads));
    }
  }
  return blocks;
}

function buildMethodSummary(
  methods: ReferenceMethodMember[],
  variableName: string,
  moduleId: string,
  context: PackageContext,
): Block[] {
  const blocks: Block[] = [];
  for (const method of methods) {
    const href = buildSymbolHref(moduleId, `${variableName}.${method.name}`, {
      collectionName: context.collectionName,
      packageName: context.packageName,
      packageSlug: context.packageSlug,
    });
    const summary = method.description.split(/\r?\n\r?\n/)[0]?.trim() ?? '';
    const paragraphChildren: Block[] = [
      {
        children: [
          {
            type: 'inline-code',
            value: `${variableName}.${method.name}()`,
          },
        ],
        href,
        kind: 'internal',
        type: 'link',
      },
    ];
    if (summary !== '') {
      paragraphChildren.push({
        type: 'text',
        value: ` — ${summary}`,
      });
    }
    blocks.push({
      children: paragraphChildren,
      type: 'paragraph',
    });
  }
  return blocks;
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
    head: buildTableHeaderRow([
      'Name',
      'Constraint',
      'Default',
      'Description',
    ]),
    type: 'table',
  };
}

function buildTypeParameterRow(
  typeParameter: ReferenceTypeParameter,
): TableRowBlock {
  return {
    children: [
      buildTableBodyCell([
        {
          type: 'inline-code',
          value: typeParameter.name,
        },
      ]),
      buildTableBodyCell(
        typeParameter.constraint === null
          ? [
              {
                type: 'text',
                value: '',
              },
            ]
          : [
              tokensToCodeExpression(typeParameter.constraint),
            ],
      ),
      buildTableBodyCell(
        typeParameter.defaultType === null
          ? [
              {
                type: 'text',
                value: '',
              },
            ]
          : [
              tokensToCodeExpression(typeParameter.defaultType),
            ],
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
        ? [
            'Name',
            'Type',
            'Default',
            'Description',
          ]
        : [
            'Name',
            'Type',
            'Description',
          ],
    ),
    type: 'table',
  };
}

function buildMembersTable(properties: ReferencePropertyMember[]): Block {
  const hasDefault = properties.some(
    (property) => property.defaultValue !== null,
  );
  return {
    body: properties.map((property) => buildMemberRow(property, hasDefault)),
    head: buildTableHeaderRow(
      hasDefault
        ? [
            'Name',
            'Type',
            'Default',
            'Description',
          ]
        : [
            'Name',
            'Type',
            'Description',
          ],
    ),
    type: 'table',
  };
}

function buildParameterRow(
  parameter: ReferenceParameter,
  includeDefault: boolean,
): TableRowBlock {
  const typeExpression = parameter.shape
    ? tokensToCodeExpression(tokenizeShapeText(parameter.shape))
    : tokensToCodeExpression(resolveTypeTokens(parameter.type));
  const children: TableCellBlock[] = [
    buildTableBodyCell([
      {
        type: 'inline-code',
        value: parameter.name + (parameter.optional ? '?' : ''),
      },
    ]),
    buildTableBodyCell([
      typeExpression,
    ]),
  ];
  if (includeDefault) {
    children.push(
      buildTableBodyCell(
        parameter.defaultValue === null
          ? [
              {
                type: 'text',
                value: '',
              },
            ]
          : markdownToInline(parameter.defaultValue),
      ),
    );
  }
  children.push(buildTableBodyCell(markdownToInline(parameter.description)));
  return {
    children,
    type: 'table-row',
  };
}

function buildMemberRow(
  member: ReferencePropertyMember,
  includeDefault: boolean,
): TableRowBlock {
  const children: TableCellBlock[] = [
    buildTableBodyCell([
      {
        type: 'inline-code',
        value: member.name + (member.optional ? '?' : ''),
      },
    ]),
    buildTableBodyCell([
      tokensToCodeExpression(resolveTypeTokens(member.type)),
    ]),
  ];
  if (includeDefault) {
    children.push(
      buildTableBodyCell(
        member.defaultValue === null
          ? [
              {
                type: 'text',
                value: '',
              },
            ]
          : markdownToInline(member.defaultValue),
      ),
    );
  }
  children.push(buildTableBodyCell(markdownToInline(member.description)));
  return {
    children,
    type: 'table-row',
  };
}

function buildTableBodyCell(children: Block[]) {
  return {
    children,
    header: false,
    type: 'table-cell' as const,
  };
}

function buildTableHeaderRow(labels: string[]): TableRowBlock {
  return {
    children: labels.map((label) => ({
      children: [
        {
          type: 'text' as const,
          value: label,
        },
      ],
      header: true,
      type: 'table-cell' as const,
    })),
    type: 'table-row',
  };
}

function tokensToCodeExpression(tokens: TypeToken[]): CodeExpressionBlock {
  const children: Block[] = [];
  for (const token of tokens) {
    const resolvedModule =
      token.kind === 'ref' ? resolveModule(token) : undefined;
    if (token.kind === 'ref' && resolvedModule !== undefined) {
      children.push({
        children: [
          {
            type: 'text',
            value: token.text,
          },
        ],
        href: resolveSymbolHref(resolvedModule, token.name),
        kind: 'internal',
        type: 'link',
      });
    } else {
      children.push({
        type: 'text',
        value: token.text,
      });
    }
  }
  return {
    children,
    type: 'code-expression',
  };
}

function resolveModule(token: {
  module: string;
  name: string;
}): string | undefined {
  const exactKey = `${token.module}::${token.name}`;
  if (currentIndex.has(exactKey)) {
    return token.module;
  }
  return currentIndex.get(token.name);
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
    return [
      {
        type: 'text',
        value: '',
      },
    ];
  }
  const parsed = parseMarkdown(source);
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
      children: [
        {
          type: 'text',
          value: example.title,
        },
      ],
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
    head: buildTableHeaderRow([
      'Error',
      'When',
    ]),
    type: 'table',
  };
}

function buildThrowsRow(entry: ReferenceThrows): TableRowBlock {
  return {
    children: [
      buildTableBodyCell(
        entry.errorClass
          ? [
              {
                type: 'inline-code',
                value: entry.errorClass,
              },
            ]
          : [
              {
                type: 'text',
                value: '',
              },
            ],
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
