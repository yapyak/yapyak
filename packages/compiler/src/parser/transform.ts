import type { PlaceholderInfo } from './plural';
import type {
  CallSite,
  StaticOptions,
  TransformFileRequest,
  TransformFileResult,
} from './type';

import MagicString from 'magic-string';
import * as ts from 'typescript';

import { toMessageId } from './id';
import { parseArguments } from './parse-arguments';
import { parsePlaceholders } from './plural';

const FACTORY_NAME = '$createT';
const PICK_FN = '_$pick';
const YAPYAK_MODULE = '@yapyak/core';

export function transformFile(
  request: TransformFileRequest,
): TransformFileResult {
  const defaultLocale = request.locales[0];
  if (defaultLocale === undefined) {
    return {
      code: request.source,
      diagnostics: [],
      map: new MagicString(request.source).generateMap({
        hires: true,
        source: request.fileId,
      }),
    };
  }
  const isSingleLocale = request.locales.length === 1;
  const sourceFile = resolveSourceFile(request);
  const magicString = new MagicString(request.source);

  let usedPick = false;
  for (const callSite of request.extracted.callSites) {
    const replacement = renderCallReplacement({
      callSite,
      defaultLocale,
      isSingleLocale,
      locales: request.locales,
      translations: request.translations,
    });
    if (replacement === undefined) continue;
    magicString.overwrite(
      callSite.range.start.offset,
      callSite.range.end.offset,
      replacement.code,
    );
    if (replacement.usesPick) usedPick = true;
  }

  removeFactoryDeclarations(magicString, sourceFile);
  rewriteImports({ magicString, sourceFile, usedPick });

  return {
    code: magicString.toString(),
    diagnostics: [],
    map: magicString.generateMap({ hires: true, source: request.fileId }),
  };
}

function resolveSourceFile(request: TransformFileRequest): ts.SourceFile {
  const first = request.extracted.callSites[0];
  if (first !== undefined) {
    return first.node.getSourceFile();
  }
  return ts.createSourceFile(
    request.fileId,
    request.source,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(request.fileId),
  );
}

function getScriptKind(fileId: string): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (fileId.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (
    fileId.endsWith('.js') ||
    fileId.endsWith('.mjs') ||
    fileId.endsWith('.cjs')
  ) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

interface RenderCallReplacementInput {
  callSite: CallSite;
  defaultLocale: string;
  isSingleLocale: boolean;
  locales: readonly string[];
  translations: Record<string, Record<string, string>>;
}

interface CallReplacement {
  code: string;
  usesPick: boolean;
}

function renderCallReplacement(
  input: RenderCallReplacementInput,
): CallReplacement | undefined {
  const { callSite, defaultLocale, isSingleLocale, locales, translations } =
    input;
  const parsed = parseArguments(callSite);
  if (parsed.source === '') return undefined;

  const placeholderInfos = parsePlaceholders(parsed.source);
  const id = toMessageId(parsed.source, parsed.options?.context);
  const callOptions = parsed.options;
  const factoryOptions = callSite.binding.factoryOptions;
  const mergedLocale = mergeLocale(factoryOptions, callOptions);

  if (isSingleLocale && canElide(placeholderInfos, callSite)) {
    return {
      code: renderEliminated(parsed.source, callSite, placeholderInfos),
      usesPick: false,
    };
  }

  const catalog = buildCatalogLiteral({
    defaultLocale,
    id,
    locales,
    source: parsed.source,
    translations,
  });
  const hasPlaceholders = placeholderInfos.length > 0;
  const paramsArgText = hasPlaceholders ? getParamArgText(callSite) : undefined;
  const optionsArgText = renderOptionsLiteral(mergedLocale);

  const args: string[] = [catalog];
  if (paramsArgText !== undefined || optionsArgText !== undefined) {
    args.push(paramsArgText ?? 'undefined');
  }
  if (optionsArgText !== undefined) {
    args.push(optionsArgText);
  }
  return {
    code: `${PICK_FN}(${args.join(', ')})`,
    usesPick: true,
  };
}

function mergeLocale(
  factoryOptions: StaticOptions | undefined,
  callOptions: StaticOptions | undefined,
): string | undefined {
  if (callOptions?.locale !== undefined) return callOptions.locale;
  if (factoryOptions?.locale !== undefined) return factoryOptions.locale;
  return undefined;
}

function canElide(
  placeholderInfos: readonly PlaceholderInfo[],
  callSite: CallSite,
): boolean {
  for (const info of placeholderInfos) {
    if (info.kind !== 'simple') return false;
  }
  if (placeholderInfos.length === 0) return true;
  return getParamExpressions(callSite) !== undefined;
}

function renderEliminated(
  source: string,
  callSite: CallSite,
  placeholderInfos: readonly PlaceholderInfo[],
): string {
  if (placeholderInfos.length === 0) {
    return JSON.stringify(source);
  }
  const expressions = getParamExpressions(callSite);
  if (expressions === undefined) {
    return JSON.stringify(source);
  }
  return buildTemplateLiteral(source, expressions);
}

function getParamExpressions(
  callSite: CallSite,
): Map<string, string> | undefined {
  const arg = callSite.node.arguments[1];
  if (arg === undefined) return undefined;
  if (!ts.isObjectLiteralExpression(arg)) return undefined;
  const result = new Map<string, string>();
  for (const prop of arg.properties) {
    if (ts.isShorthandPropertyAssignment(prop)) {
      result.set(prop.name.text, prop.name.text);
      continue;
    }
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      result.set(prop.name.text, prop.initializer.getText());
      continue;
    }
    return undefined;
  }
  return result;
}

function buildTemplateLiteral(
  source: string,
  expressions: Map<string, string>,
): string {
  let result = '`';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '{') {
      const close = findMatchingBrace(source, i);
      const inner = source.slice(i + 1, close);
      const key = readKey(inner);
      if (key !== undefined && expressions.has(key)) {
        result += `\${${expressions.get(key) ?? key}}`;
        i = close + 1;
        continue;
      }
    }
    if (ch === '`') {
      result += '\\`';
      i += 1;
      continue;
    }
    if (ch === '\\') {
      result += '\\\\';
      i += 1;
      continue;
    }
    if (ch === '$' && source[i + 1] === '{') {
      result += '\\${';
      i += 2;
      continue;
    }
    result += ch;
    i += 1;
  }
  result += '`';
  return result;
}

function findMatchingBrace(source: string, openIdx: number): number {
  let depth = 1;
  let i = openIdx + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return source.length;
}

function readKey(inner: string): string | undefined {
  const trimmed = inner.trimStart();
  const match = /^([A-Z_$a-z][\w$]*)/.exec(trimmed);
  return match?.[1];
}

interface BuildCatalogInput {
  defaultLocale: string;
  id: string;
  locales: readonly string[];
  source: string;
  translations: Record<string, Record<string, string>>;
}

function buildCatalogLiteral(input: BuildCatalogInput): string {
  const { defaultLocale, id, locales, source, translations } = input;
  const entries: string[] = [];
  for (const locale of locales) {
    const text = pickLocaleText({
      defaultLocale,
      id,
      locale,
      source,
      translations,
    });
    entries.push(`${renderLocaleKey(locale)}: ${JSON.stringify(text)}`);
  }
  return `{ ${entries.join(', ')} }`;
}

interface PickLocaleTextInput {
  defaultLocale: string;
  id: string;
  locale: string;
  source: string;
  translations: Record<string, Record<string, string>>;
}

function pickLocaleText(input: PickLocaleTextInput): string {
  if (input.locale === input.defaultLocale) return input.source;
  const localeMap = input.translations[input.locale];
  if (localeMap === undefined) return input.source;
  const text = localeMap[input.id];
  return text ?? input.source;
}

function renderLocaleKey(locale: string): string {
  if (/^[A-Z_$a-z][\w$]*$/.test(locale)) return locale;
  return JSON.stringify(locale);
}

function getParamArgText(callSite: CallSite): string | undefined {
  const arg = callSite.node.arguments[1];
  if (arg === undefined) return undefined;
  return arg.getText();
}

function renderOptionsLiteral(locale: string | undefined): string | undefined {
  if (locale === undefined) return undefined;
  return `{ locale: ${JSON.stringify(locale)} }`;
}

function removeFactoryDeclarations(
  magicString: MagicString,
  sourceFile: ts.SourceFile,
): void {
  const factoryLocals = collectFactoryLocals(sourceFile);
  if (factoryLocals.size === 0) return;
  walkVariableStatements(sourceFile, (statement) => {
    for (const decl of statement.declarationList.declarations) {
      const init = decl.initializer;
      if (init === undefined) continue;
      if (!ts.isCallExpression(init)) continue;
      if (!ts.isIdentifier(init.expression)) continue;
      if (!factoryLocals.has(init.expression.text)) continue;
      magicString.remove(statement.getStart(sourceFile), statement.getEnd());
      return;
    }
  });
}

function collectFactoryLocals(sourceFile: ts.SourceFile): Set<string> {
  const locals = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== YAPYAK_MODULE) continue;
    const clause = statement.importClause;
    if (clause === undefined) continue;
    const namedBindings = clause.namedBindings;
    if (namedBindings === undefined) continue;
    if (!ts.isNamedImports(namedBindings)) continue;
    for (const element of namedBindings.elements) {
      const importedName = (element.propertyName ?? element.name).text;
      if (importedName === FACTORY_NAME) {
        locals.add(element.name.text);
      }
    }
  }
  return locals;
}

function walkVariableStatements(
  node: ts.Node,
  visit: (statement: ts.VariableStatement) => void,
): void {
  if (ts.isVariableStatement(node)) {
    visit(node);
  }
  ts.forEachChild(node, (child) => {
    walkVariableStatements(child, visit);
  });
}

interface RewriteImportsInput {
  magicString: MagicString;
  sourceFile: ts.SourceFile;
  usedPick: boolean;
}

function rewriteImports(input: RewriteImportsInput): void {
  const { magicString, sourceFile, usedPick } = input;
  const intermediate = magicString.toString();
  const yapyakImports = collectYapyakImports(sourceFile);

  let pickHandled = false;
  for (const declaration of yapyakImports) {
    const namedBindings = declaration.importClause?.namedBindings;
    if (namedBindings === undefined || !ts.isNamedImports(namedBindings)) {
      continue;
    }

    const remaining: ImportSpecifier[] = [];
    for (const element of namedBindings.elements) {
      const importedName = (element.propertyName ?? element.name).text;
      const localName = element.name.text;
      if (importedName === FACTORY_NAME) continue;
      const occurrences = countReferences(intermediate, localName);
      if (occurrences > 1) {
        remaining.push({ imported: importedName, local: localName });
      }
    }

    const isCoreImport =
      declaration.moduleSpecifier.getText().includes(`'${YAPYAK_MODULE}'`) ||
      declaration.moduleSpecifier.getText().includes(`"${YAPYAK_MODULE}"`);
    if (usedPick && isCoreImport && !pickHandled) {
      const hasPick = remaining.some(
        (item) => item.imported === PICK_FN && item.local === PICK_FN,
      );
      if (!hasPick) {
        remaining.unshift({ imported: PICK_FN, local: PICK_FN });
      }
      pickHandled = true;
    }

    const start = declaration.getStart(sourceFile);
    const end = declaration.getEnd();
    if (remaining.length === 0) {
      magicString.remove(start, end);
      continue;
    }
    const specList = remaining
      .map((item) =>
        item.imported === item.local
          ? item.imported
          : `${item.imported} as ${item.local}`,
      )
      .join(', ');
    const moduleSpecText = declaration.moduleSpecifier.getText();
    magicString.overwrite(
      start,
      end,
      `import { ${specList} } from ${moduleSpecText};`,
    );
  }

  if (usedPick && !pickHandled) {
    magicString.prepend(`import { ${PICK_FN} } from '${YAPYAK_MODULE}';\n`);
  }
}

interface ImportSpecifier {
  imported: string;
  local: string;
}

function collectYapyakImports(
  sourceFile: ts.SourceFile,
): ts.ImportDeclaration[] {
  const result: ts.ImportDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (!statement.moduleSpecifier.text.startsWith('@yapyak/')) continue;
    result.push(statement);
  }
  return result;
}

function countReferences(code: string, name: string): number {
  let count = 0;
  let i = 0;
  while (i < code.length) {
    const next = code.indexOf(name, i);
    if (next === -1) break;
    const before = code[next - 1];
    const after = code[next + name.length];
    if (!isIdentifierChar(before) && !isIdentifierChar(after)) {
      count += 1;
    }
    i = next + name.length;
  }
  return count;
}

function isIdentifierChar(ch: string | undefined): boolean {
  if (ch === undefined) return false;
  return /[\w$]/.test(ch);
}
