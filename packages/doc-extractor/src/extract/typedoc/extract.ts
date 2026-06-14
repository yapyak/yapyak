import type {
  CommentDisplayPart,
  DeclarationReflection,
  ParameterReflection,
  ProjectReflection,
  SignatureReflection,
  SomeType,
  TypeParameterReflection,
} from 'typedoc';
import type { PackageContext } from './package-context';
import type {
  ReferenceCallSignature,
  ReferenceExample,
  ReferenceExport,
  ReferenceFunction,
  ReferenceInterface,
  ReferenceLocation,
  ReferenceManifest,
  ReferenceMember,
  ReferenceModule,
  ReferenceOverload,
  ReferenceParameter,
  ReferenceSymbolBase,
  ReferenceTag,
  ReferenceThrows,
  ReferenceTypeAlias,
  ReferenceTypeParameter,
  ReferenceVariable,
  TypeToken,
} from './type';

import { Application, ReflectionKind, TSConfigReader } from 'typedoc';

import { nullify } from '../../nullify';
import { readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

type ExtractTypedocOptions = {
  subpaths?: string[];
};

type EntryPoint = {
  filePath: string;
  id: string;
  subpath: string;
};

type PackageJson = {
  exports: Record<
    string,
    | {
        default?: string;
        types?: string;
      }
    | string
  >;
  name: string;
};

type ExtractContext = {
  collectionName: string;
  nameIndex: Map<string, string | 'ambiguous'>;
  packageDir: string;
  registry: Map<number, string>;
};

type CommentLike = {
  blockTags?: {
    content?: CommentDisplayPart[];
    name?: string;
    tag: string;
  }[];
  modifierTags?: Set<string>;
  summary?: CommentDisplayPart[];
};

export async function extractTypedoc(
  packageDir: string,
  context: PackageContext,
  options: ExtractTypedocOptions = {},
): Promise<ReferenceManifest> {
  const { collectionName } = context;
  const { entries, packageName } = await loadEntries(
    packageDir,
    options.subpaths,
  );
  const project = await loadProject(packageDir, entries);
  const { nameIndex, registry } = buildLinkRegistry(
    project,
    entries,
    packageDir,
    context,
  );
  const extractContext: ExtractContext = {
    collectionName,
    nameIndex,
    packageDir,
    registry,
  };
  const modules = extractReferenceModules(project, entries, extractContext);
  return {
    modules,
    packageName,
  };
}

async function loadEntries(
  packageDir: string,
  subpaths: string[] | undefined,
): Promise<{
  entries: EntryPoint[];
  packageName: string;
}> {
  const raw = await readFile(join(packageDir, 'package.json'), 'utf8');
  const pkg = JSON.parse(raw) as PackageJson;

  const allowedSubpaths = new Set<string>([
    '.',
  ]);
  if (subpaths) {
    for (const subpath of subpaths) {
      allowedSubpaths.add(subpath);
    }
  }

  const entries: EntryPoint[] = [];
  for (const [subpath, conditions] of Object.entries(pkg.exports)) {
    if (!allowedSubpaths.has(subpath)) {
      continue;
    }
    const distPath =
      typeof conditions === 'string'
        ? conditions
        : (conditions.types ?? conditions.default);
    if (!distPath) {
      continue;
    }
    const sourcePath = distPath
      .replace(/^\.\/dist\//, './src/')
      .replace(/\.d\.ts$/, '.ts')
      .replace(/\.js$/, '.ts');
    const filePath = resolve(packageDir, sourcePath);
    const id = subpath === '.' ? pkg.name : `${pkg.name}${subpath.slice(1)}`;
    entries.push({
      filePath,
      id,
      subpath,
    });
  }
  return {
    entries,
    packageName: pkg.name,
  };
}

async function loadProject(
  packageDir: string,
  entries: EntryPoint[],
): Promise<ProjectReflection> {
  const app = await Application.bootstrap(
    {
      entryPoints: entries.map((entry) => entry.filePath),
      excludeInternal: false,
      excludePrivate: true,
      excludeProtected: true,
      skipErrorChecking: true,
      tsconfig: resolve(packageDir, 'tsconfig.json'),
    },
    [
      new TSConfigReader(),
    ],
  );
  const project = await app.convert();
  if (!project) {
    throw new Error('extractTypedoc: TypeDoc convert failed');
  }
  return project;
}

type ProjectModule = {
  children: DeclarationReflection[];
  comment: ProjectReflection['comment'];
  entry: EntryPoint;
};

function extractProjectModules(
  project: ProjectReflection,
  entries: EntryPoint[],
  packageDir: string,
): ProjectModule[] {
  const entriesByName = new Map<string, EntryPoint>();
  for (const entry of entries) {
    entriesByName.set(entryToModuleName(entry, packageDir), entry);
  }
  const moduleChildren = (project.children ?? []).filter(
    (child) => child.kind === ReflectionKind.Module,
  );
  if (moduleChildren.length > 0) {
    const result: ProjectModule[] = [];
    for (const child of moduleChildren) {
      const entry = entriesByName.get(child.name);
      if (!entry) {
        continue;
      }
      result.push({
        children: child.children ?? [],
        comment: child.comment,
        entry,
      });
    }
    return result;
  }
  const onlyEntry = entries[0];
  if (entries.length === 1 && onlyEntry) {
    return [
      {
        children: project.children ?? [],
        comment: project.comment,
        entry: onlyEntry,
      },
    ];
  }
  return [];
}

function buildLinkRegistry(
  project: ProjectReflection,
  entries: EntryPoint[],
  packageDir: string,
  context: PackageContext,
): {
  nameIndex: Map<string, string | 'ambiguous'>;
  registry: Map<number, string>;
} {
  const registry = new Map<number, string>();
  const nameIndex = new Map<string, string | 'ambiguous'>();
  for (const module of extractProjectModules(project, entries, packageDir)) {
    for (const symbol of module.children) {
      if (isInternal(symbol)) {
        continue;
      }
      const url = buildSymbolUrl(module.entry.id, symbol.name, context);
      registry.set(symbol.id, url);
      const existing = nameIndex.get(symbol.name);
      if (!existing) {
        nameIndex.set(symbol.name, url);
      } else if (existing !== url) {
        nameIndex.set(symbol.name, 'ambiguous');
      }
    }
  }
  return {
    nameIndex,
    registry,
  };
}

function buildSymbolUrl(
  moduleId: string,
  symbolName: string,
  context: PackageContext,
): string {
  const { collectionName, packageName, packageSlug } = context;
  const safeName = symbolName.replace(/^\$/, '');
  if (moduleId === packageName) {
    return `/${collectionName}/${packageSlug}/${safeName}`;
  }
  const subSlug = moduleId.slice(packageName.length + 1);
  return `/${collectionName}/${packageSlug}/${subSlug}/${safeName}`;
}

function extractReferenceModules(
  project: ProjectReflection,
  entries: EntryPoint[],
  context: ExtractContext,
): ReferenceModule[] {
  const modules: ReferenceModule[] = [];
  for (const module of extractProjectModules(
    project,
    entries,
    context.packageDir,
  )) {
    const exports = module.children
      .filter((symbol) => !isInternal(symbol))
      .flatMap((symbol) => toReferenceExport(symbol, context) ?? [])
      .filter((value): value is ReferenceExport => value !== null);
    exports.sort(compareExports);
    const description = module.comment
      ? partsToMarkdown(module.comment.summary, context)
      : '';
    modules.push({
      description,
      exports,
      id: module.entry.id,
      sourcePath: relative(
        context.packageDir,
        module.entry.filePath,
      ).replaceAll('\\', '/'),
      subpath: module.entry.subpath,
    });
  }
  return modules;
}

function entryToModuleName(entry: EntryPoint, packageDir: string): string {
  const relPath = relative(join(packageDir, 'src'), entry.filePath);
  const noExt = relPath.replace(/\.tsx?$/, '');
  return noExt.replace(/\/index$/, '') || 'index';
}

function toReferenceExport(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceExport | undefined {
  switch (reflection.kind) {
    case ReflectionKind.Function:
      return toReferenceFunction(reflection, context);
    case ReflectionKind.Interface:
      return toReferenceInterface(reflection, context);
    case ReflectionKind.TypeAlias:
      return toReferenceTypeAlias(reflection, context);
    case ReflectionKind.Variable: {
      const signatures = resolveCallableSignatures(reflection);
      if (signatures !== undefined) {
        return callableVariableToReferenceFunction(
          reflection,
          signatures,
          context,
        );
      }
      return toReferenceVariable(reflection, context);
    }
    case ReflectionKind.Class:
      return classToReferenceExport(reflection, context);
    default:
      return undefined;
  }
}

function resolveCallableSignatures(
  reflection: DeclarationReflection,
): SignatureReflection[] | undefined {
  const type = reflection.type;
  if (!type) {
    return undefined;
  }
  if (type.type === 'reference') {
    const target = type.reflection;
    if (
      target &&
      'signatures' in target &&
      Array.isArray(
        (
          target as {
            signatures?: SignatureReflection[];
          }
        ).signatures,
      )
    ) {
      const sigs = (
        target as {
          signatures: SignatureReflection[];
        }
      ).signatures;
      if (sigs.length > 0) {
        return sigs;
      }
    }
  }
  if (type.type === 'reflection') {
    const sigs = type.declaration.signatures;
    if (sigs && sigs.length > 0) {
      return sigs;
    }
  }
  return undefined;
}

function callableVariableToReferenceFunction(
  reflection: DeclarationReflection,
  signatures: SignatureReflection[],
  context: ExtractContext,
): ReferenceFunction {
  const base = toReferenceSymbolBase(reflection, context);
  const overloads = signatures.map((signature) =>
    toReferenceOverload(signature, reflection.name, context),
  );
  return {
    ...base,
    kind: 'function',
    members: [],
    overloads,
  };
}

function toReferenceFunction(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceFunction {
  const base = toReferenceSymbolBase(reflection, context);
  const overloads = (reflection.signatures ?? []).map((signature) =>
    toReferenceOverload(signature, reflection.name, context),
  );
  return {
    ...base,
    kind: 'function',
    members: [],
    overloads,
  };
}

function toReferenceInterface(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceInterface {
  const base = toReferenceSymbolBase(reflection, context);
  const callSignatures = (reflection.signatures ?? []).map((signature) =>
    toReferenceCallSignature(signature, context),
  );
  const members = (reflection.children ?? []).map((child) =>
    toReferenceMember(child, context),
  );
  return {
    ...base,
    callSignatures,
    kind: 'interface',
    members,
    signature: buildInterfaceSignature(reflection, context),
  };
}

function toReferenceTypeAlias(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceTypeAlias {
  const base = toReferenceSymbolBase(reflection, context);
  const resolvedType = reflection.type ? toTypeTokens(reflection.type) : [];
  return {
    ...base,
    kind: 'type',
    resolvedType,
    signature: `type ${reflection.name} = ${stringifyTokens(resolvedType)};`,
  };
}

function toReferenceVariable(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceVariable {
  const base = toReferenceSymbolBase(reflection, context);
  const type = reflection.type ? toTypeTokens(reflection.type) : [];
  return {
    ...base,
    kind: 'variable',
    type,
  };
}

function isInternal(reflection: DeclarationReflection): boolean {
  const comment = reflection.comment ?? reflection.signatures?.[0]?.comment;
  return Boolean(comment?.modifierTags?.has('@internal'));
}

function classToReferenceExport(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceExport {
  const base = toReferenceSymbolBase(reflection, context);
  const members = (reflection.children ?? []).map((child) =>
    toReferenceMember(child, context),
  );
  return {
    ...base,
    kind: 'class',
    members,
    signature: `class ${reflection.name}`,
  };
}

function toReferenceSymbolBase(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceSymbolBase {
  const comment = reflection.comment;
  const signature = reflection.signatures?.[0]?.comment;
  const effective = comment ?? signature;
  return {
    deprecated: effective ? nullify(readDeprecated(effective, context)) : null,
    description: effective ? partsToMarkdown(effective.summary, context) : '',
    examples: effective ? extractExamples(effective, context) : [],
    location: readLocation(reflection, context.packageDir),
    name: reflection.name,
    remarks: effective ? readBlockTag(effective, '@remarks', context) : '',
    seeAlso: effective ? readSeeAlso(effective, context) : [],
    tags: effective ? extractTags(effective, context) : [],
    throws: effective ? readThrows(effective, context) : [],
  };
}

function toReferenceOverload(
  signature: SignatureReflection,
  functionName: string,
  context: ExtractContext,
): ReferenceOverload {
  const parameters = (signature.parameters ?? []).map((param) =>
    toReferenceParameter(param, context),
  );
  const typeParameters = (signature.typeParameters ?? []).map((param) =>
    toReferenceTypeParameter(param, context),
  );
  const returnType = signature.type ? toTypeTokens(signature.type) : [];
  return {
    parameters,
    returnType,
    signature: buildFunctionSignature(
      functionName,
      typeParameters,
      parameters,
      returnType,
    ),
    typeParameters,
  };
}

function toReferenceCallSignature(
  signature: SignatureReflection,
  context: ExtractContext,
): ReferenceCallSignature {
  const parameters = (signature.parameters ?? []).map((param) =>
    toReferenceParameter(param, context),
  );
  const typeParameters = (signature.typeParameters ?? []).map((param) =>
    toReferenceTypeParameter(param, context),
  );
  const returnType = signature.type ? toTypeTokens(signature.type) : [];
  return {
    parameters,
    returnType,
    signature: `${buildTypeParameterList(typeParameters)}(${parameters
      .map(parameterToText)
      .join(', ')}): ${stringifyTokens(returnType)};`,
    typeParameters,
  };
}

function toReferenceParameter(
  reflection: ParameterReflection,
  context: ExtractContext,
): ReferenceParameter {
  return {
    defaultValue: nullify(reflection.defaultValue),
    description: reflection.comment
      ? partsToMarkdown(reflection.comment.summary, context)
      : '',
    name: reflection.name,
    optional:
      Boolean(reflection.flags.isOptional) ||
      reflection.defaultValue !== undefined,
    type: reflection.type ? toTypeTokens(reflection.type) : [],
  };
}

function toReferenceMember(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceMember {
  const comment = reflection.comment ?? reflection.signatures?.[0]?.comment;
  return {
    defaultValue: nullify(readDefaultValue(reflection, context)),
    description: comment ? partsToMarkdown(comment.summary, context) : '',
    name: reflection.name,
    optional: Boolean(reflection.flags.isOptional),
    type: getMemberType(reflection),
  };
}

function getMemberType(reflection: DeclarationReflection): TypeToken[] {
  const signature = reflection.signatures?.[0];
  if (signature) {
    return normalizeTokens(tokensFromSignature(signature));
  }
  if (!reflection.type) {
    return [];
  }
  return toTypeTokens(reflection.type);
}

function toReferenceTypeParameter(
  reflection: TypeParameterReflection,
  context: ExtractContext,
): ReferenceTypeParameter {
  return {
    constraint: reflection.type ? toTypeTokens(reflection.type) : null,
    defaultType: reflection.default ? toTypeTokens(reflection.default) : null,
    description: reflection.comment
      ? partsToMarkdown(reflection.comment.summary, context)
      : '',
    name: reflection.name,
  };
}

function toTypeTokens(type: SomeType): TypeToken[] {
  return normalizeTokens(tokensFromType(type));
}

function tokensFromType(type: SomeType): TypeToken[] {
  switch (type.type) {
    case 'intrinsic':
      return [
        {
          kind: 'text',
          text: type.name,
        },
      ];
    case 'literal':
      return [
        {
          kind: 'text',
          text:
            typeof type.value === 'string'
              ? `'${type.value}'`
              : String(type.value),
        },
      ];
    case 'reference': {
      const head: TypeToken =
        type.refersToTypeParameter === true
          ? {
              kind: 'text',
              text: type.name,
            }
          : {
              kind: 'ref',
              module: resolveReferenceModuleName(type),
              name: type.name,
              text: type.name,
            };
      const tokens: TypeToken[] = [
        head,
      ];
      if (type.typeArguments && type.typeArguments.length > 0) {
        tokens.push({
          kind: 'text',
          text: '<',
        });
        for (const [index, typeArg] of type.typeArguments.entries()) {
          if (index > 0) {
            tokens.push({
              kind: 'text',
              text: ', ',
            });
          }
          tokens.push(...tokensFromType(typeArg));
        }
        tokens.push({
          kind: 'text',
          text: '>',
        });
      }
      return tokens;
    }
    case 'array':
      return [
        ...tokensFromType(type.elementType),
        {
          kind: 'text',
          text: '[]',
        },
      ];
    case 'union': {
      const tokens: TypeToken[] = [];
      for (const [index, member] of type.types.entries()) {
        if (index > 0) {
          tokens.push({
            kind: 'text',
            text: ' | ',
          });
        }
        tokens.push(...tokensFromType(member));
      }
      return tokens;
    }
    case 'intersection': {
      const tokens: TypeToken[] = [];
      for (const [index, member] of type.types.entries()) {
        if (index > 0) {
          tokens.push({
            kind: 'text',
            text: ' & ',
          });
        }
        tokens.push(...tokensFromType(member));
      }
      return tokens;
    }
    case 'tuple': {
      const tokens: TypeToken[] = [
        {
          kind: 'text',
          text: '[',
        },
      ];
      for (const [index, element] of type.elements.entries()) {
        if (index > 0) {
          tokens.push({
            kind: 'text',
            text: ', ',
          });
        }
        tokens.push(...tokensFromType(element));
      }
      tokens.push({
        kind: 'text',
        text: ']',
      });
      return tokens;
    }
    case 'reflection':
      return tokensFromReflectionType(type);
    default:
      return [
        {
          kind: 'text',
          text: type.toString(),
        },
      ];
  }
}

function tokensFromReflectionType(type: {
  declaration: DeclarationReflection;
}): TypeToken[] {
  const declaration = type.declaration;
  const signature = declaration.signatures?.[0];
  if (signature) {
    return tokensFromSignature(signature);
  }
  const children = declaration.children;
  if (children && children.length > 0) {
    const tokens: TypeToken[] = [
      {
        kind: 'text',
        text: '{ ',
      },
    ];
    for (const [index, child] of children.entries()) {
      if (index > 0) {
        tokens.push({
          kind: 'text',
          text: '; ',
        });
      }
      const optional = child.flags.isOptional ? '?' : '';
      tokens.push({
        kind: 'text',
        text: `${child.name}${optional}: `,
      });
      if (child.type) {
        tokens.push(...tokensFromType(child.type));
      }
    }
    tokens.push({
      kind: 'text',
      text: ' }',
    });
    return tokens;
  }
  return [
    {
      kind: 'text',
      text: '{}',
    },
  ];
}

function tokensFromSignature(signature: SignatureReflection): TypeToken[] {
  const tokens: TypeToken[] = [];
  const typeParameters = signature.typeParameters ?? [];
  if (typeParameters.length > 0) {
    tokens.push({
      kind: 'text',
      text: '<',
    });
    for (let index = 0; index < typeParameters.length; index++) {
      if (index > 0) {
        tokens.push({
          kind: 'text',
          text: ', ',
        });
      }
      tokens.push({
        kind: 'text',
        text: typeParameters[index]?.name ?? '',
      });
    }
    tokens.push({
      kind: 'text',
      text: '>',
    });
  }
  tokens.push({
    kind: 'text',
    text: '(',
  });
  const parameters = signature.parameters ?? [];
  for (const [index, param] of parameters.entries()) {
    if (index > 0) {
      tokens.push({
        kind: 'text',
        text: ', ',
      });
    }
    const optional = param.flags.isOptional ? '?' : '';
    tokens.push({
      kind: 'text',
      text: `${param.name}${optional}: `,
    });
    if (param.type) {
      tokens.push(...tokensFromType(param.type));
    }
  }
  tokens.push({
    kind: 'text',
    text: ') => ',
  });
  if (signature.type) {
    tokens.push(...tokensFromType(signature.type));
  } else {
    tokens.push({
      kind: 'text',
      text: 'void',
    });
  }
  return tokens;
}

function resolveReferenceModuleName(type: {
  package?: string;
  qualifiedName?: string;
  refersToTypeParameter?: boolean;
  target?:
    | number
    | {
        packageName?: string;
      };
}): string {
  if (
    typeof type.target === 'object' &&
    type.target !== null &&
    typeof type.target.packageName === 'string'
  ) {
    return type.target.packageName;
  }
  if (type.package) {
    return type.package;
  }
  return 'unknown';
}

function normalizeTokens(tokens: TypeToken[]): TypeToken[] {
  const merged: TypeToken[] = [];
  for (const token of tokens) {
    const last = merged[merged.length - 1];
    if (token.kind === 'text' && last && last.kind === 'text') {
      last.text += token.text;
      continue;
    }
    merged.push({
      ...token,
    });
  }
  return merged;
}

function stringifyTokens(tokens: TypeToken[]): string {
  return tokens.map((token) => token.text).join('');
}

function parameterToText(parameter: ReferenceParameter): string {
  const optional = parameter.optional ? '?' : '';
  const typeText = stringifyTokens(parameter.type);
  return `${parameter.name}${optional}: ${typeText}`;
}

function buildTypeParameterList(params: ReferenceTypeParameter[]): string {
  if (params.length === 0) {
    return '';
  }
  const parts = params.map((param) => {
    let text = param.name;
    if (param.constraint !== null) {
      text += ` extends ${stringifyTokens(param.constraint)}`;
    }
    if (param.defaultType !== null) {
      text += ` = ${stringifyTokens(param.defaultType)}`;
    }
    return text;
  });
  return `<${parts.join(', ')}>`;
}

function buildFunctionSignature(
  name: string,
  typeParameters: ReferenceTypeParameter[],
  parameters: ReferenceParameter[],
  returnType: TypeToken[],
): string {
  const typeParameterList = buildTypeParameterList(typeParameters);
  const params = parameters.map(parameterToText).join(', ');
  return `function ${name}${typeParameterList}(${params}): ${stringifyTokens(returnType)};`;
}

function buildInterfaceSignature(
  reflection: DeclarationReflection,
  context: ExtractContext,
): string {
  const typeParameters = (reflection.typeParameters ?? []).map((param) =>
    toReferenceTypeParameter(param, context),
  );
  return `interface ${reflection.name}${buildTypeParameterList(typeParameters)}`;
}

function partsToMarkdown(
  parts: CommentDisplayPart[] | undefined,
  context: ExtractContext,
): string {
  if (!parts) {
    return '';
  }
  let out = '';
  for (const part of parts) {
    if (part.kind === 'text' || part.kind === 'code') {
      out += part.text;
    } else if (part.kind === 'inline-tag' && part.tag === '@link') {
      out += resolveInlineLink(part, context);
    }
  }
  return out;
}

function resolveInlineLink(
  part: {
    target?: unknown;
    text: string;
  },
  context: ExtractContext,
): string {
  const targetId = resolveTargetId(part.target);
  if (targetId !== undefined) {
    const url = context.registry.get(targetId);
    if (url) {
      return `[${part.text}](${url})`;
    }
  }
  const byName = context.nameIndex.get(part.text);
  if (byName && byName !== 'ambiguous') {
    return `[${part.text}](${byName})`;
  }
  return `\`${part.text}\``;
}

function resolveTargetId(target: unknown): number | undefined {
  if (typeof target === 'number') {
    return target;
  }
  if (
    typeof target === 'object' &&
    target !== null &&
    'id' in target &&
    typeof (
      target as {
        id: unknown;
      }
    ).id === 'number'
  ) {
    return (
      target as {
        id: number;
      }
    ).id;
  }
  return undefined;
}

function extractExamples(
  comment: CommentLike,
  context: ExtractContext,
): ReferenceExample[] {
  const examples: ReferenceExample[] = [];
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag !== '@example') {
      continue;
    }
    const rawContent = tag.content
      ? tag.content.map((part) => part.text ?? '').join('')
      : '';
    const fenced = parseCodeFence(rawContent);
    examples.push({
      code: fenced.code,
      language: fenced.language,
      path: nullify(fenced.path),
      title: tag.name ? tag.name : null,
    });
    void context;
  }
  return examples;
}

function parseCodeFence(raw: string): {
  code: string;
  language: string;
  path?: string;
} {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(
    /^```(\S+)(?:[ \t]+\[([^\]]+)\])?\n([\s\S]*?)\n```$/,
  );
  if (fenceMatch !== null) {
    const bracket = fenceMatch[2];
    const path = bracket && isPathLike(bracket) ? bracket : undefined;
    return {
      code: fenceMatch[3] ?? '',
      language: fenceMatch[1] ?? 'ts',
      ...(path !== undefined && {
        path,
      }),
    };
  }
  return {
    code: trimmed,
    language: 'ts',
  };
}

function isPathLike(value: string): boolean {
  return /^[\w./-]+\.[a-z]\w*$/i.test(value);
}

function extractTags(
  comment: CommentLike,
  context: ExtractContext,
): ReferenceTag[] {
  const tags: ReferenceTag[] = [];
  for (const tag of comment.blockTags ?? []) {
    if (
      tag.tag === '@example' ||
      tag.tag === '@deprecated' ||
      tag.tag === '@returns' ||
      tag.tag === '@remarks' ||
      tag.tag === '@throws' ||
      tag.tag === '@see' ||
      tag.tag === '@param' ||
      tag.tag === '@typeParam' ||
      tag.tag === '@defaultValue'
    ) {
      continue;
    }
    tags.push({
      name: tag.tag.replace(/^@/, ''),
      text: partsToMarkdown(tag.content, context),
    });
  }
  return tags;
}

function readBlockTag(
  comment: CommentLike,
  tagName: string,
  context: ExtractContext,
): string {
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag === tagName) {
      return partsToMarkdown(tag.content, context);
    }
  }
  return '';
}

function readDeprecated(
  comment: CommentLike,
  context: ExtractContext,
): string | undefined {
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag === '@deprecated') {
      return partsToMarkdown(tag.content, context);
    }
  }
  return undefined;
}

function readSeeAlso(comment: CommentLike, context: ExtractContext): string[] {
  const entries: string[] = [];
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag !== '@see') {
      continue;
    }
    entries.push(partsToMarkdown(tag.content, context));
  }
  return entries;
}

function readThrows(
  comment: CommentLike,
  context: ExtractContext,
): ReferenceThrows[] {
  const throws: ReferenceThrows[] = [];
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag !== '@throws') {
      continue;
    }
    const text = partsToMarkdown(tag.content, context).trim();
    const match = text.match(/^\{(?:@link\s+)?([^}]+)\}\s*(.*)$/s);
    if (match === null) {
      throws.push({
        condition: text,
        errorClass: '',
      });
    } else {
      throws.push({
        condition: (match[2] ?? '').trim(),
        errorClass: (match[1] ?? '').trim(),
      });
    }
  }
  return throws;
}

function readDefaultValue(
  reflection: DeclarationReflection,
  context: ExtractContext,
): string | undefined {
  if (reflection.defaultValue !== undefined) {
    return reflection.defaultValue;
  }
  const tag = reflection.comment?.blockTags?.find(
    (entry) => entry.tag === '@defaultValue',
  );
  if (!tag) {
    return undefined;
  }
  return partsToMarkdown(tag.content, context).trim() || undefined;
}

function readLocation(
  reflection: DeclarationReflection,
  packageDir: string,
): ReferenceLocation {
  const source = reflection.sources?.[0];
  if (!source) {
    return {
      column: 0,
      file: '',
      line: 0,
    };
  }
  const file = relative(
    packageDir,
    source.fullFileName ?? source.fileName,
  ).replaceAll('\\', '/');
  return {
    column: source.character,
    file,
    line: source.line,
  };
}

function compareExports(a: ReferenceExport, b: ReferenceExport): number {
  const kindOrder: Record<ReferenceExport['kind'], number> = {
    class: 1,
    function: 0,
    interface: 2,
    type: 3,
    variable: 4,
  };
  const kindCompare = kindOrder[a.kind] - kindOrder[b.kind];
  if (kindCompare !== 0) {
    return kindCompare;
  }
  return a.name.localeCompare(b.name);
}
