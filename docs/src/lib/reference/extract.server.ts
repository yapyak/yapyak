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
  ReferenceExport,
  ReferenceFunction,
  ReferenceInterface,
  ReferenceLocation,
  ReferenceManifest,
  ReferenceMember,
  ReferenceModule,
  ReferenceOverload,
  ReferenceParameter,
  ReferenceTag,
  ReferenceTypeAlias,
  ReferenceTypeParameter,
  ReferenceVariable,
  TypeToken,
} from './types.ts';

import { Application, ReflectionKind, TSConfigReader } from 'typedoc';
import { readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

interface EntryPoint {
  filePath: string;
  id: string;
  subpath: string;
}

interface PackageManifest {
  exports: Record<string, { default?: string; types?: string }>;
  name: string;
}

export async function extract(
  yapyakDir: string,
): Promise<ReferenceManifest> {
  const entries = await loadEntries(yapyakDir);
  const project = await loadProject(yapyakDir, entries);
  const modules = collectModules(project, entries, yapyakDir);
  return { modules };
}

async function loadEntries(yapyakDir: string): Promise<EntryPoint[]> {
  const raw = await readFile(join(yapyakDir, 'package.json'), 'utf8');
  const pkg = JSON.parse(raw) as PackageManifest;

  const entries: EntryPoint[] = [];
  for (const [subpath, conditions] of Object.entries(pkg.exports)) {
    if (subpath === './internal') {
      continue;
    }
    const distPath = conditions.types ?? conditions.default;
    if (distPath === undefined) {
      continue;
    }
    const sourcePath = distPath
      .replace(/^\.\/dist\//, './src/')
      .replace(/\.d\.ts$/, '.ts')
      .replace(/\.js$/, '.ts');
    const filePath = resolve(yapyakDir, sourcePath);
    const id = subpath === '.' ? pkg.name : `${pkg.name}${subpath.slice(1)}`;
    entries.push({ filePath, id, subpath });
  }
  return entries;
}

async function loadProject(
  yapyakDir: string,
  entries: EntryPoint[],
): Promise<ProjectReflection> {
  const app = await Application.bootstrap(
    {
      entryPoints: entries.map((entry) => entry.filePath),
      excludeInternal: true,
      excludePrivate: true,
      excludeProtected: true,
      skipErrorChecking: true,
      tsconfig: resolve(yapyakDir, 'tsconfig.json'),
    },
    [new TSConfigReader()],
  );
  const project = await app.convert();
  if (project === undefined) {
    throw new Error('extract: TypeDoc convert failed');
  }
  return project;
}

function collectModules(
  project: ProjectReflection,
  entries: EntryPoint[],
  yapyakDir: string,
): ReferenceModule[] {
  const entriesByName = new Map<string, EntryPoint>();
  for (const entry of entries) {
    const moduleName = entryToModuleName(entry, yapyakDir);
    entriesByName.set(moduleName, entry);
  }

  const modules: ReferenceModule[] = [];
  for (const child of project.children ?? []) {
    const entry = entriesByName.get(child.name);
    if (entry === undefined) {
      continue;
    }
    const exports = (child.children ?? [])
      .flatMap((symbol) => convertExport(symbol, yapyakDir) ?? [])
      .filter((value): value is ReferenceExport => value !== null);
    exports.sort(compareExports);
    modules.push({
      exports,
      id: entry.id,
      sourcePath: relative(yapyakDir, entry.filePath).replaceAll('\\', '/'),
      subpath: entry.subpath,
    });
  }
  return modules;
}

function entryToModuleName(entry: EntryPoint, yapyakDir: string): string {
  const relPath = relative(join(yapyakDir, 'src'), entry.filePath);
  const noExt = relPath.replace(/\.tsx?$/, '');
  return noExt.replace(/\/index$/, '') || 'index';
}

function convertExport(
  reflection: DeclarationReflection,
  yapyakDir: string,
): ReferenceExport | null {
  switch (reflection.kind) {
    case ReflectionKind.Function:
      return convertFunction(reflection, yapyakDir);
    case ReflectionKind.Interface:
      return convertInterface(reflection, yapyakDir);
    case ReflectionKind.TypeAlias:
      return convertTypeAlias(reflection, yapyakDir);
    case ReflectionKind.Variable:
      return convertVariable(reflection, yapyakDir);
    case ReflectionKind.Class:
      return convertClass(reflection, yapyakDir);
    default:
      return null;
  }
}

function convertFunction(
  reflection: DeclarationReflection,
  yapyakDir: string,
): ReferenceFunction {
  const base = convertBase(reflection, yapyakDir);
  const overloads = (reflection.signatures ?? []).map((signature) =>
    convertOverload(signature, reflection.name),
  );
  const returnDescription = readReturnDescription(
    reflection.signatures?.[0] ?? null,
  );
  return {
    ...base,
    kind: 'function',
    members: [],
    overloads,
    returnDescription,
  };
}

function convertInterface(
  reflection: DeclarationReflection,
  yapyakDir: string,
): ReferenceInterface {
  const base = convertBase(reflection, yapyakDir);
  const callSignatures = (reflection.signatures ?? []).map((signature) =>
    convertCallSignature(signature),
  );
  const members = (reflection.children ?? []).map((child) =>
    convertMember(child),
  );
  return {
    ...base,
    callSignatures,
    kind: 'interface',
    members,
    signature: buildInterfaceSignature(reflection),
  };
}

function convertTypeAlias(
  reflection: DeclarationReflection,
  yapyakDir: string,
): ReferenceTypeAlias {
  const base = convertBase(reflection, yapyakDir);
  const resolvedType =
    reflection.type === undefined ? [] : convertType(reflection.type);
  return {
    ...base,
    kind: 'type',
    resolvedType,
    signature: `type ${reflection.name} = ${stringifyTokens(resolvedType)};`,
  };
}

function convertVariable(
  reflection: DeclarationReflection,
  yapyakDir: string,
): ReferenceVariable {
  const base = convertBase(reflection, yapyakDir);
  const type = reflection.type === undefined ? [] : convertType(reflection.type);
  return {
    ...base,
    kind: 'variable',
    members: [],
    signature: `const ${reflection.name}: ${stringifyTokens(type)};`,
    type,
  };
}

function convertClass(
  reflection: DeclarationReflection,
  yapyakDir: string,
): ReferenceExport {
  const base = convertBase(reflection, yapyakDir);
  const members = (reflection.children ?? []).map((child) =>
    convertMember(child),
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
  yapyakDir: string,
): {
  deprecated: string | null;
  description: string;
  examples: string[];
  location: ReferenceLocation;
  name: string;
  tags: ReferenceTag[];
} {
  const comment = reflection.comment ?? null;
  const signature = reflection.signatures?.[0]?.comment ?? null;
  const effective = comment ?? signature;
  const description = effective ? partsToMarkdown(effective.summary) : '';
  const examples = effective ? collectExamples(effective) : [];
  const tags = effective ? collectTags(effective) : [];
  const deprecated = effective ? readDeprecated(effective) : null;
  return {
    deprecated,
    description,
    examples,
    location: readLocation(reflection, yapyakDir),
    name: reflection.name,
    tags,
  };
}

function convertOverload(
  signature: SignatureReflection,
  functionName: string,
): ReferenceOverload {
  const parameters = (signature.parameters ?? []).map((param) =>
    convertParameter(param),
  );
  const typeParameters = (signature.typeParameters ?? []).map((param) =>
    convertTypeParameter(param),
  );
  const returnType =
    signature.type === undefined ? [] : convertType(signature.type);
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
): ReferenceCallSignature {
  const parameters = (signature.parameters ?? []).map((param) =>
    convertParameter(param),
  );
  const typeParameters = (signature.typeParameters ?? []).map((param) =>
    convertTypeParameter(param),
  );
  const returnType =
    signature.type === undefined ? [] : convertType(signature.type);
  return {
    parameters,
    returnType,
    signature: `${buildTypeParameterList(typeParameters)}(${parameters
      .map((param) => paramToText(param))
      .join(', ')}): ${stringifyTokens(returnType)};`,
    typeParameters,
  };
}

function convertParameter(param: ParameterReflection): ReferenceParameter {
  return {
    defaultValue: param.defaultValue ?? null,
    description: param.comment ? partsToMarkdown(param.comment.summary) : '',
    name: param.name,
    optional: Boolean(param.flags.isOptional) || param.defaultValue !== undefined,
    type: param.type === undefined ? [] : convertType(param.type),
  };
}

function convertMember(reflection: DeclarationReflection): ReferenceMember {
  const comment = reflection.comment ?? null;
  return {
    defaultValue: readDefaultValue(reflection),
    description: comment ? partsToMarkdown(comment.summary) : '',
    name: reflection.name,
    optional: Boolean(reflection.flags.isOptional),
    type: reflection.type === undefined ? [] : convertType(reflection.type),
  };
}

function convertTypeParameter(
  param: TypeParameterReflection,
): ReferenceTypeParameter {
  return {
    constraint: param.type === undefined ? null : convertType(param.type),
    defaultType:
      param.default === undefined ? null : convertType(param.default),
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
        text: typeof type.value === 'string' ? `'${type.value}'` : String(type.value),
      });
      return;
    case 'reference': {
      const module = referenceModuleName(type);
      tokens.push({
        kind: 'ref',
        module,
        name: type.name,
        text: type.name,
      });
      if (type.typeArguments && type.typeArguments.length > 0) {
        tokens.push({ kind: 'text', text: '<' });
        for (let index = 0; index < type.typeArguments.length; index++) {
          if (index > 0) {
            tokens.push({ kind: 'text', text: ', ' });
          }
          appendType(type.typeArguments[index]!, tokens);
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
      for (let index = 0; index < type.types.length; index++) {
        if (index > 0) {
          tokens.push({ kind: 'text', text: ' | ' });
        }
        appendType(type.types[index]!, tokens);
      }
      return;
    case 'intersection':
      for (let index = 0; index < type.types.length; index++) {
        if (index > 0) {
          tokens.push({ kind: 'text', text: ' & ' });
        }
        appendType(type.types[index]!, tokens);
      }
      return;
    case 'tuple':
      tokens.push({ kind: 'text', text: '[' });
      for (let index = 0; index < type.elements.length; index++) {
        if (index > 0) {
          tokens.push({ kind: 'text', text: ', ' });
        }
        appendType(type.elements[index]!, tokens);
      }
      tokens.push({ kind: 'text', text: ']' });
      return;
    case 'reflection': {
      const text = type.declaration.toString();
      tokens.push({ kind: 'text', text });
      return;
    }
    default:
      tokens.push({ kind: 'text', text: type.toString() });
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
  if (type.package !== undefined) {
    return type.package;
  }
  return 'unknown';
}

function mergeAdjacentText(tokens: TypeToken[]): TypeToken[] {
  const merged: TypeToken[] = [];
  for (const token of tokens) {
    const last = merged[merged.length - 1];
    if (token.kind === 'text' && last !== undefined && last.kind === 'text') {
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
  const tp = buildTypeParameterList(typeParameters);
  const params = parameters.map((param) => paramToText(param)).join(', ');
  return `function ${name}${tp}(${params}): ${stringifyTokens(returnType)};`;
}

function buildInterfaceSignature(reflection: DeclarationReflection): string {
  const tp = (reflection.typeParameters ?? []).map((param) =>
    convertTypeParameter(param),
  );
  return `interface ${reflection.name}${buildTypeParameterList(tp)}`;
}

function partsToMarkdown(parts: CommentDisplayPart[]): string {
  let out = '';
  for (const part of parts) {
    if (part.kind === 'text') {
      out += part.text;
    } else if (part.kind === 'code') {
      out += part.text;
    } else if (part.kind === 'inline-tag' && part.tag === '@link') {
      out += `\`${part.text}\``;
    }
  }
  return out;
}

function collectExamples(comment: {
  blockTags?: { content?: CommentDisplayPart[]; name?: string; tag: string }[];
}): string[] {
  const examples: string[] = [];
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag !== '@example') {
      continue;
    }
    const code = tag.content
      ? tag.content.map((part) => part.text ?? '').join('')
      : '';
    examples.push(tag.name ? `**${tag.name}**\n\n${code}` : code);
  }
  return examples;
}

function collectTags(comment: {
  blockTags?: { content?: CommentDisplayPart[]; tag: string }[];
}): ReferenceTag[] {
  const tags: ReferenceTag[] = [];
  for (const tag of comment.blockTags ?? []) {
    if (
      tag.tag === '@example' ||
      tag.tag === '@deprecated' ||
      tag.tag === '@returns' ||
      tag.tag === '@remarks'
    ) {
      continue;
    }
    const text = tag.content ? partsToMarkdown(tag.content) : '';
    tags.push({ name: tag.tag.replace(/^@/, ''), text });
  }
  return tags;
}

function readDeprecated(comment: {
  blockTags?: { content?: CommentDisplayPart[]; tag: string }[];
}): string | null {
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag === '@deprecated') {
      return tag.content ? partsToMarkdown(tag.content) : '';
    }
  }
  return null;
}

function readReturnDescription(signature: SignatureReflection | null): string {
  if (signature === null || signature.comment === undefined) {
    return '';
  }
  for (const tag of signature.comment.blockTags ?? []) {
    if (tag.tag === '@returns') {
      return partsToMarkdown(tag.content);
    }
  }
  return '';
}

function readDefaultValue(reflection: DeclarationReflection): string | null {
  if (reflection.defaultValue !== undefined) {
    return reflection.defaultValue;
  }
  const tag = reflection.comment?.blockTags?.find(
    (entry) => entry.tag === '@defaultValue',
  );
  if (tag === undefined) {
    return null;
  }
  return partsToMarkdown(tag.content).trim() || null;
}

function readLocation(
  reflection: DeclarationReflection,
  yapyakDir: string,
): ReferenceLocation {
  const source = reflection.sources?.[0];
  if (source === undefined) {
    return { column: 0, file: '', line: 0 };
  }
  const file = relative(yapyakDir, source.fullFileName ?? source.fileName)
    .replaceAll('\\', '/');
  return {
    column: source.character,
    file,
    line: source.line,
  };
}

function compareExports(a: ReferenceExport, b: ReferenceExport): number {
  const kindOrder: Record<ReferenceExport['kind'], number> = {
    function: 0,
    class: 1,
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
