import type {
  CommentDisplayPart,
  DeclarationReflection,
  ParameterReflection,
  ProjectReflection,
  SignatureReflection,
  SomeType,
  TypeParameterReflection,
} from 'typedoc';
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

import { readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

interface TypedocExtractOptions {
  collectionName: string;
  packageDir: string;
  packageSlug: string;
  subpaths?: string[];
}

interface EntryPoint {
  filePath: string;
  id: string;
  subpath: string;
}

interface PackageJson {
  exports: Record<string, { default?: string; types?: string } | string>;
  name: string;
}

interface ExtractContext {
  collectionName: string;
  nameIndex: Map<string, string | 'ambiguous'>;
  packageDir: string;
  registry: Map<number, string>;
}

interface CommentLike {
  blockTags?: ReadonlyArray<{
    content?: ReadonlyArray<CommentDisplayPart>;
    name?: string;
    tag: string;
  }>;
  modifierTags?: ReadonlySet<string>;
  summary?: ReadonlyArray<CommentDisplayPart>;
}

export async function extractTypedoc(
  options: TypedocExtractOptions,
): Promise<ReferenceManifest> {
  const { collectionName, packageDir, packageSlug, subpaths } = options;
  const { entries, packageName } = await loadEntries(packageDir, subpaths);
  const project = await loadProject(packageDir, entries);
  const { nameIndex, registry } = buildLinkRegistry(
    project,
    entries,
    packageDir,
    collectionName,
    packageName,
    packageSlug,
  );
  const context: ExtractContext = {
    collectionName,
    nameIndex,
    packageDir,
    registry,
  };
  const modules = collectModules(project, entries, context);
  return { modules, packageName };
}

async function loadEntries(
  packageDir: string,
  subpaths: string[] | undefined,
): Promise<{ entries: EntryPoint[]; packageName: string }> {
  const raw = await readFile(join(packageDir, 'package.json'), 'utf8');
  const pkg = JSON.parse(raw) as PackageJson;

  const allowedSubpaths = new Set<string>(['.']);
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
    entries.push({ filePath, id, subpath });
  }
  return { entries, packageName: pkg.name };
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
    [new TSConfigReader()],
  );
  const project = await app.convert();
  if (!project) {
    throw new Error('extractTypedoc: TypeDoc convert failed');
  }
  return project;
}

interface ProjectModule {
  children: ReadonlyArray<DeclarationReflection>;
  comment: ProjectReflection['comment'];
  entry: EntryPoint;
}

function collectProjectModules(
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
  collectionName: string,
  packageName: string,
  packageSlug: string,
): {
  nameIndex: Map<string, string | 'ambiguous'>;
  registry: Map<number, string>;
} {
  const registry = new Map<number, string>();
  const nameIndex = new Map<string, string | 'ambiguous'>();
  for (const module of collectProjectModules(project, entries, packageDir)) {
    for (const symbol of module.children) {
      if (isInternal(symbol)) {
        continue;
      }
      const url = buildSymbolUrl(
        module.entry.id,
        symbol.name,
        collectionName,
        packageName,
        packageSlug,
      );
      registry.set(symbol.id, url);
      const existing = nameIndex.get(symbol.name);
      if (!existing) {
        nameIndex.set(symbol.name, url);
      } else if (existing !== url) {
        nameIndex.set(symbol.name, 'ambiguous');
      }
    }
  }
  return { nameIndex, registry };
}

function buildSymbolUrl(
  moduleId: string,
  symbolName: string,
  collectionName: string,
  packageName: string,
  packageSlug: string,
): string {
  const safeName = symbolName.replace(/^\$/, '');
  if (moduleId === packageName) {
    return `/${collectionName}/${packageSlug}/${safeName}`;
  }
  const subSlug = moduleId.slice(packageName.length + 1);
  return `/${collectionName}/${packageSlug}/${subSlug}/${safeName}`;
}

function collectModules(
  project: ProjectReflection,
  entries: EntryPoint[],
  context: ExtractContext,
): ReferenceModule[] {
  const modules: ReferenceModule[] = [];
  for (const module of collectProjectModules(
    project,
    entries,
    context.packageDir,
  )) {
    const exports = module.children
      .filter((symbol) => !isInternal(symbol))
      .flatMap((symbol) => convertExport(symbol, context) ?? [])
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

function convertExport(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceExport | null {
  switch (reflection.kind) {
    case ReflectionKind.Function:
      return convertFunction(reflection, context);
    case ReflectionKind.Interface:
      return convertInterface(reflection, context);
    case ReflectionKind.TypeAlias:
      return convertTypeAlias(reflection, context);
    case ReflectionKind.Variable: {
      const signatures = resolveCallableSignatures(reflection);
      if (signatures !== null) {
        return convertCallableVariable(reflection, signatures, context);
      }
      return convertVariable(reflection, context);
    }
    case ReflectionKind.Class:
      return convertClass(reflection, context);
    default:
      return null;
  }
}

function resolveCallableSignatures(
  reflection: DeclarationReflection,
): SignatureReflection[] | null {
  const type = reflection.type;
  if (!type) {
    return null;
  }
  if (type.type === 'reference') {
    const target = type.reflection;
    if (
      target &&
      'signatures' in target &&
      Array.isArray(
        (target as { signatures?: SignatureReflection[] }).signatures,
      )
    ) {
      const sigs = (target as { signatures: SignatureReflection[] }).signatures;
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
  return null;
}

function convertCallableVariable(
  reflection: DeclarationReflection,
  signatures: SignatureReflection[],
  context: ExtractContext,
): ReferenceFunction {
  const base = convertBase(reflection, context);
  const overloads = signatures.map((signature) =>
    convertOverload(signature, reflection.name, context),
  );
  return {
    ...base,
    kind: 'function',
    members: [],
    overloads,
  };
}

function convertFunction(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceFunction {
  const base = convertBase(reflection, context);
  const overloads = (reflection.signatures ?? []).map((signature) =>
    convertOverload(signature, reflection.name, context),
  );
  return {
    ...base,
    kind: 'function',
    members: [],
    overloads,
  };
}

function convertInterface(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceInterface {
  const base = convertBase(reflection, context);
  const callSignatures = (reflection.signatures ?? []).map((signature) =>
    convertCallSignature(signature, context),
  );
  const members = (reflection.children ?? []).map((child) =>
    convertMember(child, context),
  );
  return {
    ...base,
    callSignatures,
    kind: 'interface',
    members,
    signature: buildInterfaceSignature(reflection, context),
  };
}

function convertTypeAlias(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceTypeAlias {
  const base = convertBase(reflection, context);
  const resolvedType = reflection.type ? convertType(reflection.type) : [];
  return {
    ...base,
    kind: 'type',
    resolvedType,
    signature: `type ${reflection.name} = ${stringifyTokens(resolvedType)};`,
  };
}

function convertVariable(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceVariable {
  const base = convertBase(reflection, context);
  const type = reflection.type ? convertType(reflection.type) : [];
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

function convertClass(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceExport {
  const base = convertBase(reflection, context);
  const members = (reflection.children ?? []).map((child) =>
    convertMember(child, context),
  );
  return {
    ...base,
    kind: 'class',
    members,
    signature: `class ${reflection.name}`,
  };
}

function convertBase(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceSymbolBase {
  const comment = reflection.comment ?? null;
  const signature = reflection.signatures?.[0]?.comment ?? null;
  const effective = comment ?? signature;
  return {
    deprecated: effective ? readDeprecated(effective, context) : null,
    description: effective ? partsToMarkdown(effective.summary, context) : '',
    examples: effective ? collectExamples(effective, context) : [],
    location: readLocation(reflection, context.packageDir),
    name: reflection.name,
    remarks: effective ? readBlockTag(effective, '@remarks', context) : '',
    seeAlso: effective ? readSeeAlso(effective, context) : [],
    tags: effective ? collectTags(effective, context) : [],
    throws: effective ? readThrows(effective, context) : [],
  };
}

function convertOverload(
  signature: SignatureReflection,
  functionName: string,
  context: ExtractContext,
): ReferenceOverload {
  const parameters = (signature.parameters ?? []).map((param) =>
    convertParameter(param, context),
  );
  const typeParameters = (signature.typeParameters ?? []).map((param) =>
    convertTypeParameter(param, context),
  );
  const returnType = signature.type ? convertType(signature.type) : [];
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

function convertCallSignature(
  signature: SignatureReflection,
  context: ExtractContext,
): ReferenceCallSignature {
  const parameters = (signature.parameters ?? []).map((param) =>
    convertParameter(param, context),
  );
  const typeParameters = (signature.typeParameters ?? []).map((param) =>
    convertTypeParameter(param, context),
  );
  const returnType = signature.type ? convertType(signature.type) : [];
  return {
    parameters,
    returnType,
    signature: `${buildTypeParameterList(typeParameters)}(${parameters
      .map(paramToText)
      .join(', ')}): ${stringifyTokens(returnType)};`,
    typeParameters,
  };
}

function convertParameter(
  param: ParameterReflection,
  context: ExtractContext,
): ReferenceParameter {
  return {
    defaultValue: param.defaultValue ?? null,
    description: param.comment
      ? partsToMarkdown(param.comment.summary, context)
      : '',
    name: param.name,
    optional:
      Boolean(param.flags.isOptional) || param.defaultValue !== undefined,
    type: param.type ? convertType(param.type) : [],
  };
}

function convertMember(
  reflection: DeclarationReflection,
  context: ExtractContext,
): ReferenceMember {
  const comment =
    reflection.comment ?? reflection.signatures?.[0]?.comment ?? null;
  return {
    defaultValue: readDefaultValue(reflection, context),
    description: comment ? partsToMarkdown(comment.summary, context) : '',
    name: reflection.name,
    optional: Boolean(reflection.flags.isOptional),
    type: memberType(reflection),
  };
}

function memberType(reflection: DeclarationReflection): TypeToken[] {
  const signature = reflection.signatures?.[0];
  if (signature) {
    const tokens: TypeToken[] = [];
    appendSignatureType(signature, tokens);
    return mergeAdjacentText(tokens);
  }
  if (!reflection.type) {
    return [];
  }
  return convertType(reflection.type);
}

function convertTypeParameter(
  param: TypeParameterReflection,
  context: ExtractContext,
): ReferenceTypeParameter {
  return {
    constraint: param.type ? convertType(param.type) : null,
    defaultType: param.default ? convertType(param.default) : null,
    description: param.comment
      ? partsToMarkdown(param.comment.summary, context)
      : '',
    name: param.name,
  };
}

function convertType(type: SomeType): TypeToken[] {
  const tokens: TypeToken[] = [];
  appendType(type, tokens);
  return mergeAdjacentText(tokens);
}

function appendType(type: SomeType, tokens: TypeToken[]): void {
  switch (type.type) {
    case 'intrinsic':
      tokens.push({ kind: 'text', text: type.name });
      return;
    case 'literal':
      tokens.push({
        kind: 'text',
        text:
          typeof type.value === 'string'
            ? `'${type.value}'`
            : String(type.value),
      });
      return;
    case 'reference': {
      if (type.refersToTypeParameter === true) {
        tokens.push({ kind: 'text', text: type.name });
      } else {
        tokens.push({
          kind: 'ref',
          module: referenceModuleName(type),
          name: type.name,
          text: type.name,
        });
      }
      if (type.typeArguments && type.typeArguments.length > 0) {
        tokens.push({ kind: 'text', text: '<' });
        for (const [index, typeArg] of type.typeArguments.entries()) {
          if (index > 0) {
            tokens.push({ kind: 'text', text: ', ' });
          }
          appendType(typeArg, tokens);
        }
        tokens.push({ kind: 'text', text: '>' });
      }
      return;
    }
    case 'array':
      appendType(type.elementType, tokens);
      tokens.push({ kind: 'text', text: '[]' });
      return;
    case 'union':
      for (const [index, member] of type.types.entries()) {
        if (index > 0) {
          tokens.push({ kind: 'text', text: ' | ' });
        }
        appendType(member, tokens);
      }
      return;
    case 'intersection':
      for (const [index, member] of type.types.entries()) {
        if (index > 0) {
          tokens.push({ kind: 'text', text: ' & ' });
        }
        appendType(member, tokens);
      }
      return;
    case 'tuple':
      tokens.push({ kind: 'text', text: '[' });
      for (const [index, element] of type.elements.entries()) {
        if (index > 0) {
          tokens.push({ kind: 'text', text: ', ' });
        }
        appendType(element, tokens);
      }
      tokens.push({ kind: 'text', text: ']' });
      return;
    case 'reflection': {
      appendReflectionType(type, tokens);
      return;
    }
    default:
      tokens.push({ kind: 'text', text: type.toString() });
  }
}

function appendReflectionType(
  type: { declaration: DeclarationReflection },
  tokens: TypeToken[],
): void {
  const declaration = type.declaration;
  const signature = declaration.signatures?.[0];
  if (signature) {
    appendSignatureType(signature, tokens);
    return;
  }
  const children = declaration.children;
  if (children && children.length > 0) {
    tokens.push({ kind: 'text', text: '{ ' });
    for (const [index, child] of children.entries()) {
      if (index > 0) {
        tokens.push({ kind: 'text', text: '; ' });
      }
      const optional = child.flags.isOptional ? '?' : '';
      tokens.push({ kind: 'text', text: `${child.name}${optional}: ` });
      if (child.type) {
        appendType(child.type, tokens);
      }
    }
    tokens.push({ kind: 'text', text: ' }' });
    return;
  }
  tokens.push({ kind: 'text', text: '{}' });
}

function appendSignatureType(
  signature: SignatureReflection,
  tokens: TypeToken[],
): void {
  const typeParameters = signature.typeParameters ?? [];
  if (typeParameters.length > 0) {
    tokens.push({ kind: 'text', text: '<' });
    for (let index = 0; index < typeParameters.length; index++) {
      if (index > 0) {
        tokens.push({ kind: 'text', text: ', ' });
      }
      tokens.push({ kind: 'text', text: typeParameters[index]?.name ?? '' });
    }
    tokens.push({ kind: 'text', text: '>' });
  }
  tokens.push({ kind: 'text', text: '(' });
  const parameters = signature.parameters ?? [];
  for (const [index, param] of parameters.entries()) {
    if (index > 0) {
      tokens.push({ kind: 'text', text: ', ' });
    }
    const optional = param.flags.isOptional ? '?' : '';
    tokens.push({ kind: 'text', text: `${param.name}${optional}: ` });
    if (param.type) {
      appendType(param.type, tokens);
    }
  }
  tokens.push({ kind: 'text', text: ') => ' });
  if (signature.type) {
    appendType(signature.type, tokens);
  } else {
    tokens.push({ kind: 'text', text: 'void' });
  }
}

function referenceModuleName(type: {
  package?: string;
  qualifiedName?: string;
  refersToTypeParameter?: boolean;
  target?: number | { packageName?: string };
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

function mergeAdjacentText(tokens: TypeToken[]): TypeToken[] {
  const merged: TypeToken[] = [];
  for (const token of tokens) {
    const last = merged[merged.length - 1];
    if (token.kind === 'text' && last && last.kind === 'text') {
      last.text += token.text;
      continue;
    }
    merged.push({ ...token });
  }
  return merged;
}

function stringifyTokens(tokens: TypeToken[]): string {
  return tokens.map((token) => token.text).join('');
}

function paramToText(param: ReferenceParameter): string {
  const optional = param.optional ? '?' : '';
  const typeText = stringifyTokens(param.type);
  return `${param.name}${optional}: ${typeText}`;
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
  const params = parameters.map(paramToText).join(', ');
  return `function ${name}${typeParameterList}(${params}): ${stringifyTokens(returnType)};`;
}

function buildInterfaceSignature(
  reflection: DeclarationReflection,
  context: ExtractContext,
): string {
  const typeParameters = (reflection.typeParameters ?? []).map((param) =>
    convertTypeParameter(param, context),
  );
  return `interface ${reflection.name}${buildTypeParameterList(typeParameters)}`;
}

function partsToMarkdown(
  parts: ReadonlyArray<CommentDisplayPart> | undefined,
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
  part: { target?: unknown; text: string },
  context: ExtractContext,
): string {
  const targetId = resolveTargetId(part.target);
  if (targetId !== null) {
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

function resolveTargetId(target: unknown): number | null {
  if (typeof target === 'number') {
    return target;
  }
  if (
    typeof target === 'object' &&
    target !== null &&
    'id' in target &&
    typeof (target as { id: unknown }).id === 'number'
  ) {
    return (target as { id: number }).id;
  }
  return null;
}

function collectExamples(
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
      path: fenced.path,
      title: tag.name ? tag.name : null,
    });
    void context;
  }
  return examples;
}

function parseCodeFence(raw: string): {
  code: string;
  language: string;
  path: string | null;
} {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(
    /^```(\S+)(?:[ \t]+\[([^\]]+)\])?\n([\s\S]*?)\n```$/,
  );
  if (fenceMatch !== null) {
    const bracket = fenceMatch[2];
    return {
      code: fenceMatch[3] ?? '',
      language: fenceMatch[1] ?? 'ts',
      path: bracket && looksLikePath(bracket) ? bracket : null,
    };
  }
  return { code: trimmed, language: 'ts', path: null };
}

function looksLikePath(value: string): boolean {
  return /^[\w./-]+\.[a-z]\w*$/i.test(value);
}

function collectTags(
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
): string | null {
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag === '@deprecated') {
      return partsToMarkdown(tag.content, context);
    }
  }
  return null;
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
    if (match !== null) {
      throws.push({
        condition: (match[2] ?? '').trim(),
        errorClass: (match[1] ?? '').trim(),
      });
    } else {
      throws.push({ condition: text, errorClass: '' });
    }
  }
  return throws;
}

function readDefaultValue(
  reflection: DeclarationReflection,
  context: ExtractContext,
): string | null {
  if (reflection.defaultValue !== undefined) {
    return reflection.defaultValue;
  }
  const tag = reflection.comment?.blockTags?.find(
    (entry) => entry.tag === '@defaultValue',
  );
  if (!tag) {
    return null;
  }
  return partsToMarkdown(tag.content, context).trim() || null;
}

function readLocation(
  reflection: DeclarationReflection,
  packageDir: string,
): ReferenceLocation {
  const source = reflection.sources?.[0];
  if (!source) {
    return { column: 0, file: '', line: 0 };
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
