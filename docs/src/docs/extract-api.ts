import ts from 'typescript';

import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

export interface ApiManifest {
  modules: ApiModule[];
}

export interface ApiModule {
  exports: ApiExport[];
  id: string;
  sourcePath: string;
  subpath: string;
}

export type ApiExport =
  | ApiFunction
  | ApiInterface
  | ApiTypeAlias
  | ApiVariable
  | ApiClass;

export interface ApiSymbolBase {
  deprecated: string | null;
  description: string;
  examples: string[];
  location: ApiLocation;
  name: string;
  tags: ApiTag[];
}

export interface ApiFunction extends ApiSymbolBase {
  kind: 'function';
  parameters: ApiParameter[];
  returnDescription: string;
  returnType: string;
  signature: string;
}

export interface ApiInterface extends ApiSymbolBase {
  callSignatures: ApiCallSignature[];
  kind: 'interface';
  members: ApiMember[];
  signature: string;
}

export interface ApiTypeAlias extends ApiSymbolBase {
  kind: 'type';
  resolvedType: string;
  signature: string;
}

export interface ApiVariable extends ApiSymbolBase {
  kind: 'variable';
  signature: string;
  type: string;
}

export interface ApiClass extends ApiSymbolBase {
  kind: 'class';
  members: ApiMember[];
  signature: string;
}

export interface ApiParameter {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: string;
}

export interface ApiMember {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: string;
}

export interface ApiCallSignature {
  parameters: ApiParameter[];
  returnType: string;
}

export interface ApiLocation {
  column: number;
  file: string;
  line: number;
}

export interface ApiTag {
  name: string;
  text: string;
}

interface EntryPoint {
  filePath: string;
  id: string;
  subpath: string;
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
      .flatMap((symbol) => extractExport(symbol, checker, yapyakDir))
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

function extractExport(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  yapyakDir: string,
): ApiExport[] {
  if (hasTag(symbol, checker, 'internal')) {
    return [];
  }
  const aliased = resolveAlias(symbol, checker);
  const declaration = pickDeclaration(aliased);
  if (declaration === undefined) {
    return [];
  }

  const base = buildBase(symbol, aliased, declaration, checker, yapyakDir);

  if (ts.isInterfaceDeclaration(declaration)) {
    return [buildInterface(base, aliased, declaration, checker)];
  }
  if (ts.isTypeAliasDeclaration(declaration)) {
    return [buildTypeAlias(base, declaration, checker)];
  }
  if (ts.isClassDeclaration(declaration)) {
    return [buildClass(base, aliased, declaration, checker)];
  }
  if (
    ts.isFunctionDeclaration(declaration) ||
    ts.isMethodDeclaration(declaration)
  ) {
    return [buildFunction(base, aliased, declaration, checker)];
  }
  if (
    ts.isVariableDeclaration(declaration) ||
    ts.isPropertySignature(declaration) ||
    ts.isPropertyDeclaration(declaration)
  ) {
    const type = checker.getTypeOfSymbolAtLocation(aliased, declaration);
    const callSignatures = type.getCallSignatures();
    if (callSignatures.length > 0) {
      return [buildVariableAsFunction(base, aliased, declaration, checker)];
    }
    return [buildVariable(base, aliased, declaration, checker)];
  }
  return [];
}

function buildBase(
  original: ts.Symbol,
  aliased: ts.Symbol,
  declaration: ts.Declaration,
  checker: ts.TypeChecker,
  yapyakDir: string,
) {
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
  checker: ts.TypeChecker,
): ApiInterface {
  const members = collectMembers(symbol, declaration, checker);
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  const callSignatures: ApiCallSignature[] = type
    .getCallSignatures()
    .map((sig) => ({
      parameters: sig
        .getParameters()
        .map((parameter) => paramFromSymbol(parameter, checker)),
      returnType: checker.typeToString(sig.getReturnType()),
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
  checker: ts.TypeChecker,
): ApiTypeAlias {
  const resolved = checker.getTypeAtLocation(declaration.type);
  return {
    ...base,
    kind: 'type',
    resolvedType: checker.typeToString(resolved),
    signature: declarationText(declaration),
  };
}

function buildClass(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): ApiClass {
  return {
    ...base,
    kind: 'class',
    members: collectMembers(symbol, declaration, checker),
    signature: `class ${base.name}`,
  };
}

function buildFunction(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.FunctionDeclaration | ts.MethodDeclaration,
  checker: ts.TypeChecker,
): ApiFunction {
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const sig = type.getCallSignatures()[0];
  return buildFunctionFromSignature(base, symbol, sig, checker);
}

function buildVariableAsFunction(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.Declaration,
  checker: ts.TypeChecker,
): ApiFunction {
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const sig = type.getCallSignatures()[0];
  return buildFunctionFromSignature(base, symbol, sig, checker);
}

function buildFunctionFromSignature(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  sig: ts.Signature | undefined,
  checker: ts.TypeChecker,
): ApiFunction {
  const tags = symbol.getJsDocTags(checker);
  const returnTag = tags.find((tag) => tag.name === 'returns');
  const returnDescription =
    returnTag !== undefined
      ? ts.displayPartsToString(returnTag.text).trim()
      : '';

  if (sig === undefined) {
    return {
      ...base,
      kind: 'function',
      parameters: [],
      returnDescription,
      returnType: 'unknown',
      signature: `function ${base.name}(): unknown`,
    };
  }

  const parameters = sig
    .getParameters()
    .map((parameter) => paramFromSymbol(parameter, checker));
  const returnType = checker.typeToString(sig.getReturnType());
  const signature = `${base.name}(${parameters
    .map((parameter) => formatParam(parameter))
    .join(', ')}): ${returnType}`;

  return {
    ...base,
    kind: 'function',
    parameters,
    returnDescription,
    returnType,
    signature,
  };
}

function buildVariable(
  base: ApiSymbolBase,
  symbol: ts.Symbol,
  declaration: ts.Declaration,
  checker: ts.TypeChecker,
): ApiVariable {
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const typeText = checker.typeToString(type);
  return {
    ...base,
    kind: 'variable',
    signature: `const ${base.name}: ${typeText}`,
    type: typeText,
  };
}

function collectMembers(
  symbol: ts.Symbol,
  declaration: ts.Declaration,
  checker: ts.TypeChecker,
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
    const member = memberToApi(memberSymbol, declaration, checker);
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
  checker: ts.TypeChecker,
) {
  const declaration = memberSymbol.getDeclarations()?.[0] ?? contextDeclaration;
  const type = checker.getTypeOfSymbolAtLocation(memberSymbol, declaration);
  const docParts = memberSymbol.getDocumentationComment(checker);
  const description = ts.displayPartsToString(docParts).trim();
  const defaultValue = readDefaultTag(memberSymbol, checker);
  return {
    defaultValue,
    description,
    name: memberSymbol.getName(),
    optional: (memberSymbol.flags & ts.SymbolFlags.Optional) !== 0,
    type: stripUndefinedFromOptional(checker.typeToString(type), memberSymbol),
  };
}

function paramFromSymbol(paramSymbol: ts.Symbol, checker: ts.TypeChecker) {
  const decl = paramSymbol.getDeclarations()?.[0];
  const type =
    decl !== undefined
      ? checker.getTypeOfSymbolAtLocation(paramSymbol, decl)
      : checker.getDeclaredTypeOfSymbol(paramSymbol);
  const docParts = paramSymbol.getDocumentationComment(checker);
  const description = ts.displayPartsToString(docParts).trim();
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
    type: checker.typeToString(type),
  };
}

function formatParam(parameter: ApiParameter) {
  return `${parameter.name}${parameter.optional ? '?' : ''}: ${parameter.type}`;
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

function stripUndefinedFromOptional(text: string, symbol: ts.Symbol) {
  if ((symbol.flags & ts.SymbolFlags.Optional) === 0) {
    return text;
  }
  return text.replace(/\s*\|\s*undefined$/, '');
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
