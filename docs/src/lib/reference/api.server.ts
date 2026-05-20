import type {
  ApiCallSignature,
  ApiClass,
  ApiExport,
  ApiFunction,
  ApiInterface,
  ApiMember,
  ApiModule,
  ApiParameter,
  ApiSymbolBase,
  ApiTag,
  ApiTypeAlias,
  ApiTypeParameter,
  ApiVariable,
  TypeToken,
} from './types';

import ts from 'typescript';

import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

interface EntryPoint {
  filePath: string;
  id: string;
  subpath: string;
}

interface SymbolRef {
  module: string;
  name: string;
}

interface Context {
  checker: ts.TypeChecker;
  registry: Map<ts.Symbol, SymbolRef>;
  yapyakDir: string;
}

export async function extractApi(yapyakDir: string) {
  const entries = await resolveEntryPoints(yapyakDir);
  const rootFiles = entries.map((entry) => entry.filePath);

  const configPath = ts.findConfigFile(
    yapyakDir,
    ts.sys.fileExists,
    'tsconfig.json',
  );
  if (configPath === undefined) {
    throw new Error(`extractApi: no tsconfig.json under ${yapyakDir}`);
  }
  const configJson = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    configJson.config,
    ts.sys,
    dirname(configPath),
  );

  const program = ts.createProgram({
    options: {
      ...parsed.options,
      declaration: false,
      noEmit: true,
    },
    rootNames: rootFiles,
  });
  const checker = program.getTypeChecker();

  const registry = buildRegistry(entries, program, checker);
  const context: Context = { checker, registry, yapyakDir };

  const modules: ApiModule[] = [];
  for (const entry of entries) {
    const sourceFile = program.getSourceFile(entry.filePath);
    if (sourceFile === undefined) {
      continue;
    }
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (moduleSymbol === undefined) {
      continue;
    }
    const exports = checker
      .getExportsOfModule(moduleSymbol)
      .flatMap((symbol) => extractExport(symbol, context))
      .filter((value): value is ApiExport => value !== null);

    exports.sort(compareExports);

    modules.push({
      exports,
      id: entry.id,
      sourcePath: relative(yapyakDir, entry.filePath).replaceAll('\\', '/'),
      subpath: entry.subpath,
    });
  }

  return { modules };
}

function buildRegistry(
  entries: EntryPoint[],
  program: ts.Program,
  checker: ts.TypeChecker,
) {
  const registry = new Map<ts.Symbol, SymbolRef>();
  for (const entry of entries) {
    const sourceFile = program.getSourceFile(entry.filePath);
    if (sourceFile === undefined) {
      continue;
    }
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (moduleSymbol === undefined) {
      continue;
    }
    for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
      const aliased = resolveAlias(symbol, checker);
      if (
        hasTag(symbol, checker, 'internal') ||
        hasTag(aliased, checker, 'internal')
      ) {
        continue;
      }
      if (!registry.has(aliased)) {
        registry.set(aliased, { module: entry.id, name: symbol.getName() });
      }
    }
  }
  return registry;
}

async function resolveEntryPoints(yapyakDir: string) {
  const pkgRaw = await readFile(join(yapyakDir, 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgRaw) as {
    name: string;
    exports: Record<string, { types?: string; default?: string }>;
  };

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

function extractExport(symbol: ts.Symbol, context: Context): ApiExport[] {
  const { checker } = context;
  const aliased = resolveAlias(symbol, checker);
  if (
    hasTag(symbol, checker, 'internal') ||
    hasTag(aliased, checker, 'internal')
  ) {
    return [];
  }
  const declaration = pickDeclaration(aliased);
  if (declaration === undefined) {
    return [];
  }

  const base = buildBase(symbol, aliased, declaration, context);

  if (ts.isInterfaceDeclaration(declaration)) {
    return [buildInterface(base, aliased, declaration, context)];
  }
  if (ts.isTypeAliasDeclaration(declaration)) {
    return [buildTypeAlias(base, declaration, context)];
  }
  if (ts.isClassDeclaration(declaration)) {
    return [buildClass(base, aliased, declaration, context)];
  }
  if (
    ts.isFunctionDeclaration(declaration) ||
    ts.isMethodDeclaration(declaration)
  ) {
    return [buildFunction(base, aliased, declaration, context)];
  }
  if (
    ts.isVariableDeclaration(declaration) ||
    ts.isPropertySignature(declaration) ||
    ts.isPropertyDeclaration(declaration)
  ) {
    const type = checker.getTypeOfSymbolAtLocation(aliased, declaration);
    const callSignatures = type.getCallSignatures();
    if (callSignatures.length > 0) {
      return [buildVariableAsFunction(base, aliased, declaration, context)];
    }
    return [buildVariable(base, aliased, declaration, context)];
  }
  return [];
}

function buildBase(
  original: ts.Symbol,
  aliased: ts.Symbol,
  declaration: ts.Declaration,
  context: Context,
) {
  const { checker, yapyakDir } = context;
  const docs = aliased
    .getDocumentationComment(checker)
    .concat(original.getDocumentationComment(checker));
  const description = ts.displayPartsToString(uniqueParts(docs)).trim();

  const jsdocTags = uniqueTags([
    ...aliased.getJsDocTags(checker),
    ...original.getJsDocTags(checker),
  ]);
  const examples: string[] = [];
  let deprecated: string | null = null;
  const tags: ApiTag[] = [];
  for (const tag of jsdocTags) {
    const text = ts.displayPartsToString(tag.text).trim();
    if (tag.name === 'example') {
      examples.push(text);
    } else if (tag.name === 'deprecated') {
      deprecated = text;
    } else if (tag.name === 'param' || tag.name === 'returns') {
    } else {
      tags.push({ name: tag.name, text });
    }
  }

  const source = declaration.getSourceFile();
  const { line, character } = source.getLineAndCharacterOfPosition(
    declaration.getStart(),
  );

  return {
    deprecated,
    description,
    examples,
    location: {
      column: character + 1,
      file: relative(yapyakDir, source.fileName).replaceAll('\\', '/'),
      line: line + 1,
    },
    name: original.getName(),
    tags,
  };
}

function buildInterface(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.InterfaceDeclaration,
  context: Context,
): ApiInterface {
  const members = collectMembers(symbol, declaration, context);
  const type = context.checker.getDeclaredTypeOfSymbol(symbol);
  const callSignatures: ApiCallSignature[] = type
    .getCallSignatures()
    .map((sig) => ({
      parameters: sig
        .getParameters()
        .map((parameter) => paramFromSymbol(parameter, context)),
      returnType: signatureReturnTokens(sig, context),
    }));

  return {
    ...base,
    callSignatures,
    kind: 'interface',
    members,
    signature: declarationText(declaration),
  };
}

function buildTypeAlias(
  base: ApiSymbolBase,
  declaration: ts.TypeAliasDeclaration,
  context: Context,
): ApiTypeAlias {
  const resolvedTokens = isComputedTypeNode(declaration.type)
    ? []
    : typeNodeToTokens(declaration.type, context);
  return {
    ...base,
    kind: 'type',
    resolvedType: resolvedTokens,
    signature: declarationText(declaration),
  };
}

function isComputedTypeNode(node: ts.TypeNode): boolean {
  let computed = false;
  const visit = (current: ts.Node): void => {
    if (computed) {
      return;
    }
    if (
      ts.isConditionalTypeNode(current) ||
      ts.isInferTypeNode(current) ||
      ts.isTemplateLiteralTypeNode(current) ||
      ts.isMappedTypeNode(current) ||
      ts.isTypeOperatorNode(current) ||
      ts.isIndexedAccessTypeNode(current)
    ) {
      computed = true;
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return computed;
}

function buildClass(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.ClassDeclaration,
  context: Context,
): ApiClass {
  return {
    ...base,
    kind: 'class',
    members: collectMembers(symbol, declaration, context),
    signature: `class ${base.name}`,
  };
}

function buildFunction(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.FunctionDeclaration | ts.MethodDeclaration,
  context: Context,
): ApiFunction {
  const type = context.checker.getTypeOfSymbolAtLocation(symbol, declaration);
  return buildFunctionFromSignatures(base, symbol, type.getCallSignatures(), context);
}

function buildVariableAsFunction(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.Declaration,
  context: Context,
): ApiFunction {
  const type = context.checker.getTypeOfSymbolAtLocation(symbol, declaration);
  return buildFunctionFromSignatures(base, symbol, type.getCallSignatures(), context);
}

function buildFunctionFromSignatures(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  signatures: readonly ts.Signature[],
  context: Context,
): ApiFunction {
  const { checker } = context;
  const tags = symbol.getJsDocTags(checker);
  const returnTag = tags.find((tag) => tag.name === 'returns');
  const returnDescription =
    returnTag !== undefined
      ? ts.displayPartsToString(returnTag.text).trim()
      : '';

  if (signatures.length === 0) {
    return {
      ...base,
      kind: 'function',
      overloads: [
        {
          parameters: [],
          returnType: [{ kind: 'text', text: 'unknown' }],
          signature: `function ${base.name}(): unknown`,
          typeParameters: [],
        },
      ],
      returnDescription,
    };
  }

  const overloads = signatures.map((sig) => {
    const typeParameters = typeParametersFromSignature(sig, context);
    const parameters = sig
      .getParameters()
      .map((parameter) => paramFromSymbol(parameter, context));
    const returnType = signatureReturnTokens(sig, context);
    const returnTypeText = renderTokens(returnType);
    const typeParamsText = formatTypeParameters(typeParameters);
    const signature = `${base.name}${typeParamsText}(${parameters
      .map((parameter) => formatParam(parameter))
      .join(', ')}): ${returnTypeText}`;
    return { parameters, returnType, signature, typeParameters };
  });

  return {
    ...base,
    kind: 'function',
    overloads,
    returnDescription,
  };
}

function buildVariable(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.Declaration,
  context: Context,
): ApiVariable {
  const { checker } = context;
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const typeNode = ts.isVariableDeclaration(declaration)
    ? declaration.type
    : ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)
      ? declaration.type
      : undefined;
  const tokens = tokenizeOrFallback(typeNode, type, context);
  const members = collectTypeMembers(type, declaration, context);
  return {
    ...base,
    kind: 'variable',
    members,
    signature: `const ${base.name}: ${renderTokens(tokens)}`,
    type: tokens,
  };
}

function collectTypeMembers(
  type: ts.Type,
  declaration: ts.Declaration,
  context: Context,
): ApiMember[] {
  if (isOpaqueType(type)) {
    return [];
  }
  const properties = type.getProperties();
  if (properties.length === 0) {
    return [];
  }
  const members: ApiMember[] = [];
  for (const property of properties) {
    const member = memberToApi(property, declaration, context);
    if (member !== null) {
      members.push(member);
    }
  }
  return members.sort((a, b) => a.name.localeCompare(b.name));
}

function isOpaqueType(type: ts.Type): boolean {
  const opaqueFlags =
    ts.TypeFlags.Primitive |
    ts.TypeFlags.Any |
    ts.TypeFlags.Unknown |
    ts.TypeFlags.Never |
    ts.TypeFlags.TypeParameter;
  if ((type.flags & opaqueFlags) !== 0) {
    return true;
  }
  if (type.isUnion() || type.isIntersection()) {
    return true;
  }
  if (isBuiltinType(type)) {
    return true;
  }
  return false;
}

function isBuiltinType(type: ts.Type): boolean {
  const symbol = type.aliasSymbol ?? type.symbol;
  if (symbol === undefined) {
    return false;
  }
  const declarations = symbol.declarations;
  if (declarations === undefined || declarations.length === 0) {
    return false;
  }
  return declarations.every((declaration) =>
    /\/typescript\/lib\/lib\.[^/]+\.d\.ts$/.test(
      declaration.getSourceFile().fileName,
    ),
  );
}

function collectMembers(
  symbol: ts.Symbol,
  declaration: ts.Declaration,
  context: Context,
) {
  const members: ApiMember[] = [];
  const seen = new Set<string>();
  const memberMap = symbol.members;
  if (memberMap === undefined) {
    return members;
  }
  memberMap.forEach((memberSymbol, name) => {
    const key = String(name);
    if (key === '__call' || key === '__index' || key === '__constructor') {
      return;
    }
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const member = memberToApi(memberSymbol, declaration, context);
    if (member !== null) {
      members.push(member);
    }
  });
  members.sort((a, b) => a.name.localeCompare(b.name));
  return members;
}

function memberToApi(
  memberSymbol: ts.Symbol,
  contextDeclaration: ts.Declaration,
  context: Context,
): ApiMember {
  const { checker } = context;
  const declaration = memberSymbol.getDeclarations()?.[0] ?? contextDeclaration;
  const type = checker.getTypeOfSymbolAtLocation(memberSymbol, declaration);
  const typeNode =
    ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)
      ? declaration.type
      : undefined;
  const tokens = tokenizeOrFallback(typeNode, type, context);
  const docParts = memberSymbol.getDocumentationComment(checker);
  const description = normalizeDescription(ts.displayPartsToString(docParts));
  const defaultValue = readDefaultTag(memberSymbol, checker);
  const optional = (memberSymbol.flags & ts.SymbolFlags.Optional) !== 0;
  return {
    defaultValue,
    description,
    name: memberSymbol.getName(),
    optional,
    type: optional ? stripUndefinedFromTokens(tokens) : tokens,
  };
}

function paramFromSymbol(
  paramSymbol: ts.Symbol,
  context: Context,
): ApiParameter {
  const { checker } = context;
  const decl = paramSymbol.getDeclarations()?.[0];
  const type =
    decl !== undefined
      ? checker.getTypeOfSymbolAtLocation(paramSymbol, decl)
      : checker.getDeclaredTypeOfSymbol(paramSymbol);
  const typeNode = decl !== undefined && ts.isParameter(decl) ? decl.type : undefined;
  const tokens = tokenizeOrFallback(typeNode, type, context);
  const docParts = paramSymbol.getDocumentationComment(checker);
  const description = normalizeDescription(ts.displayPartsToString(docParts));
  const optional =
    decl !== undefined &&
    ts.isParameter(decl) &&
    (decl.questionToken !== undefined || decl.initializer !== undefined);
  const defaultValue =
    decl !== undefined && ts.isParameter(decl) && decl.initializer !== undefined
      ? decl.initializer.getText()
      : null;
  return {
    defaultValue,
    description,
    name: paramSymbol.getName(),
    optional,
    type: tokens,
  };
}

function signatureReturnTokens(sig: ts.Signature, context: Context) {
  const declaration = sig.getDeclaration();
  const typeNode = declaration?.type;
  return tokenizeOrFallback(typeNode, sig.getReturnType(), context);
}

function typeParametersFromSignature(
  sig: ts.Signature,
  context: Context,
): ApiTypeParameter[] {
  const declarations = sig.getDeclaration()?.typeParameters;
  if (declarations === undefined) {
    return [];
  }
  return declarations.map((declaration) => ({
    constraint:
      declaration.constraint !== undefined
        ? typeNodeToTokens(declaration.constraint, context)
        : null,
    defaultType:
      declaration.default !== undefined
        ? typeNodeToTokens(declaration.default, context)
        : null,
    name: declaration.name.getText(),
  }));
}

function formatTypeParameters(typeParameters: ApiTypeParameter[]) {
  if (typeParameters.length === 0) {
    return '';
  }
  const parts = typeParameters.map((typeParameter) => {
    let text = typeParameter.name;
    if (typeParameter.constraint !== null) {
      text += ` extends ${renderTokens(typeParameter.constraint)}`;
    }
    if (typeParameter.defaultType !== null) {
      text += ` = ${renderTokens(typeParameter.defaultType)}`;
    }
    return text;
  });
  return `<${parts.join(', ')}>`;
}

function tokenizeOrFallback(
  typeNode: ts.TypeNode | undefined,
  fallback: ts.Type,
  context: Context,
): TypeToken[] {
  if (typeNode !== undefined) {
    return typeNodeToTokens(typeNode, context);
  }
  return [{ kind: 'text', text: context.checker.typeToString(fallback) }];
}

function typeNodeToTokens(
  typeNode: ts.TypeNode,
  context: Context,
): TypeToken[] {
  const { checker, registry } = context;
  const baseStart = typeNode.getStart();
  const text = typeNode.getText();
  const refs: Array<{ end: number; ref: SymbolRef; start: number }> = [];

  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && !isExcludedIdentifierPosition(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      if (symbol !== undefined) {
        const resolved = resolveAllAliases(symbol, checker);
        const ref = registry.get(resolved);
        if (ref !== undefined) {
          refs.push({
            end: node.getEnd() - baseStart,
            ref,
            start: node.getStart() - baseStart,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(typeNode);

  refs.sort((a, b) => a.start - b.start);
  const tokens: TypeToken[] = [];
  let cursor = 0;
  for (const ref of refs) {
    if (ref.start > cursor) {
      tokens.push({ kind: 'text', text: text.slice(cursor, ref.start) });
    }
    tokens.push({
      kind: 'ref',
      module: ref.ref.module,
      name: ref.ref.name,
      text: text.slice(ref.start, ref.end),
    });
    cursor = ref.end;
  }
  if (cursor < text.length) {
    tokens.push({ kind: 'text', text: text.slice(cursor) });
  }
  if (tokens.length === 0) {
    tokens.push({ kind: 'text', text });
  }
  return tokens;
}

function isExcludedIdentifierPosition(node: ts.Identifier) {
  const parent = node.parent;
  if (parent === undefined) {
    return false;
  }
  if (ts.isPropertySignature(parent) && parent.name === node) {
    return true;
  }
  if (ts.isPropertyDeclaration(parent) && parent.name === node) {
    return true;
  }
  if (ts.isParameter(parent) && parent.name === node) {
    return true;
  }
  if (ts.isTypeParameterDeclaration(parent) && parent.name === node) {
    return true;
  }
  return false;
}

function resolveAllAliases(symbol: ts.Symbol, checker: ts.TypeChecker) {
  let current = symbol;
  while ((current.flags & ts.SymbolFlags.Alias) !== 0) {
    current = checker.getAliasedSymbol(current);
  }
  return current;
}

function stripUndefinedFromTokens(tokens: TypeToken[]): TypeToken[] {
  if (tokens.length === 0) {
    return tokens;
  }
  const last = tokens[tokens.length - 1];
  if (last === undefined || last.kind !== 'text') {
    return tokens;
  }
  const trimmed = last.text.replace(/\s*\|\s*undefined$/, '');
  if (trimmed === last.text) {
    return tokens;
  }
  if (trimmed === '') {
    return tokens.slice(0, -1);
  }
  return [...tokens.slice(0, -1), { kind: 'text', text: trimmed }];
}

function renderTokens(tokens: TypeToken[]) {
  return tokens.map((token) => token.text).join('');
}

function formatParam(parameter: ApiParameter) {
  return `${parameter.name}${parameter.optional ? '?' : ''}: ${renderTokens(parameter.type)}`;
}

function declarationText(declaration: ts.Declaration) {
  const text = declaration.getText();
  if (text.length <= 400) {
    return text;
  }
  return `${text.slice(0, 397)}...`;
}

function pickDeclaration(symbol: ts.Symbol) {
  const decls = symbol.getDeclarations();
  if (decls === undefined || decls.length === 0) {
    return undefined;
  }
  return decls[0];
}

function resolveAlias(symbol: ts.Symbol, checker: ts.TypeChecker) {
  if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    return checker.getAliasedSymbol(symbol);
  }
  return symbol;
}

function hasTag(symbol: ts.Symbol, checker: ts.TypeChecker, name: string) {
  return symbol.getJsDocTags(checker).some((tag) => tag.name === name);
}

function readDefaultTag(symbol: ts.Symbol, checker: ts.TypeChecker) {
  const tag = symbol
    .getJsDocTags(checker)
    .find((tag) => tag.name === 'default' || tag.name === 'defaultValue');
  if (tag === undefined) {
    return null;
  }
  return ts.displayPartsToString(tag.text).trim() || null;
}

function normalizeDescription(text: string) {
  const trimmed = text.trim();
  return trimmed.startsWith('- ') ? trimmed.slice(2) : trimmed;
}

function uniqueParts(parts: ts.SymbolDisplayPart[]) {
  const seen = new Set<string>();
  const out: ts.SymbolDisplayPart[] = [];
  for (const part of parts) {
    const key = `${part.kind}:${part.text}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(part);
  }
  return out;
}

function uniqueTags(tags: ts.JSDocTagInfo[]) {
  const seen = new Set<string>();
  const out: ts.JSDocTagInfo[] = [];
  for (const tag of tags) {
    const key = `${tag.name}:${ts.displayPartsToString(tag.text)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(tag);
  }
  return out;
}

const KIND_ORDER: Record<ApiExport['kind'], number> = {
  class: 2,
  function: 0,
  interface: 3,
  type: 4,
  variable: 1,
};

function compareExports(a: ApiExport, b: ApiExport) {
  if (a.kind !== b.kind) {
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  }
  return a.name.localeCompare(b.name);
}
