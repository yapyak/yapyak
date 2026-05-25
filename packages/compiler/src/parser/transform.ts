import type { PlaceholderInfo } from './plural';
import type {
  CallSite,
  Fragment,
  ParsedArguments,
  Range,
  TransformFileRequest,
  TransformFileResult,
} from './type';

import MagicString from 'magic-string';
import * as ts from 'typescript';

import { toMessageId } from './id';
import { parseArguments } from './parse-arguments';
import { parsePlaceholders } from './plural';
import { getProcessor, resolveProcessorKind } from './processor';

const PICK_EXPORT = 'pick';
const PICK_LOCAL = '_pick';
const YAPYAK_MODULE = 'yapyak';
const YAPYAK_INTERNAL_MODULE = 'yapyak/internal';

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
  const processorKind =
    request.processor ?? resolveProcessorKind(request.fileId);
  const processor = getProcessor(processorKind);
  const fragments = processor.parseFragments(request.source);
  const isSingleLocale = request.locales.length === 1;
  const magicString = new MagicString(request.source);

  const pickLocal = findFreePickLocal(request.source);

  let usedPick = false;
  for (const callSite of request.extracted.callSites) {
    const replacement = renderCallReplacement({
      callSite,
      defaultLocale,
      isSingleLocale,
      locales: request.locales,
      pickLocal,
      translations: request.translations,
    });
    if (replacement === undefined) {
      continue;
    }
    const range = replacement.range ?? callSite.range;
    magicString.overwrite(
      range.start.offset,
      range.end.offset,
      replacement.code,
    );
    if (replacement.usesPick) {
      usedPick = true;
    }
  }

  rewriteScriptImports({
    fragments,
    magicString,
    request,
  });

  if (usedPick) {
    const importSpec =
      pickLocal === PICK_EXPORT
        ? PICK_EXPORT
        : `${PICK_EXPORT} as ${pickLocal}`;
    processor.applyImport(
      magicString,
      request.source,
      `import { ${importSpec} } from '${YAPYAK_INTERNAL_MODULE}';`,
    );
  }

  return {
    code: magicString.toString(),
    diagnostics: [],
    map: magicString.generateMap({ hires: true, source: request.fileId }),
  };
}

interface RewriteScriptImportsInput {
  fragments: readonly Fragment[];
  magicString: MagicString;
  request: TransformFileRequest;
}

function rewriteScriptImports(input: RewriteScriptImportsInput): void {
  const { fragments, magicString, request } = input;
  const intermediate = magicString.toString();

  for (const fragment of fragments) {
    if (fragment.kind !== 'script') {
      continue;
    }
    const sourceFile = ts.createSourceFile(
      request.fileId,
      fragment.code,
      ts.ScriptTarget.ESNext,
      true,
      getScriptKind(request.fileId, fragment.lang),
    );
    const coreImports = collectCoreImports(sourceFile);
    for (const declaration of coreImports) {
      rewriteImportDeclaration({
        declaration,
        fragment,
        intermediate,
        magicString,
        sourceFile,
      });
    }
  }
}

interface RewriteImportDeclarationInput {
  declaration: ts.ImportDeclaration;
  fragment: Fragment;
  intermediate: string;
  magicString: MagicString;
  sourceFile: ts.SourceFile;
}

function rewriteImportDeclaration(input: RewriteImportDeclarationInput): void {
  const { declaration, fragment, intermediate, magicString, sourceFile } =
    input;
  if (declaration.importClause?.isTypeOnly === true) {
    return;
  }
  const namedBindings = declaration.importClause?.namedBindings;
  if (namedBindings === undefined || !ts.isNamedImports(namedBindings)) {
    return;
  }

  const remaining: ImportSpecifier[] = [];
  for (const element of namedBindings.elements) {
    const importedName = (element.propertyName ?? element.name).text;
    const localName = element.name.text;
    const isTypeOnly = element.isTypeOnly;
    if (isTypeOnly) {
      remaining.push({
        imported: importedName,
        isType: true,
        local: localName,
      });
      continue;
    }
    const occurrences = countReferences(intermediate, localName);
    if (occurrences > 1) {
      remaining.push({
        imported: importedName,
        isType: false,
        local: localName,
      });
    }
  }

  const startInOriginal =
    declaration.getStart(sourceFile) + fragment.originalOffset;
  const endInOriginal = declaration.getEnd() + fragment.originalOffset;

  if (remaining.length === 0) {
    magicString.remove(startInOriginal, endInOriginal);
    return;
  }
  const specList = remaining.map((item) => renderSpecifier(item)).join(', ');
  const moduleSpecText = declaration.moduleSpecifier.getText(sourceFile);
  magicString.overwrite(
    startInOriginal,
    endInOriginal,
    `import { ${specList} } from ${moduleSpecText};`,
  );
}

function renderSpecifier(item: ImportSpecifier): string {
  const prefix = item.isType ? 'type ' : '';
  const body =
    item.imported === item.local
      ? item.imported
      : `${item.imported} as ${item.local}`;
  return `${prefix}${body}`;
}

interface ImportSpecifier {
  imported: string;
  isType: boolean;
  local: string;
}

function collectCoreImports(sourceFile: ts.SourceFile): ts.ImportDeclaration[] {
  const result: ts.ImportDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    if (statement.moduleSpecifier.text !== YAPYAK_MODULE) {
      continue;
    }
    result.push(statement);
  }
  return result;
}

function getScriptKind(fileId: string, lang: Fragment['lang']): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (fileId.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (lang === 'js') {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

interface RenderCallReplacementInput {
  callSite: CallSite;
  defaultLocale: string;
  isSingleLocale: boolean;
  locales: readonly string[];
  pickLocal: string;
  translations: Record<string, Record<string, string>>;
}

interface CallReplacement {
  code: string;
  range?: Range;
  usesPick: boolean;
}

function renderCallReplacement(
  input: RenderCallReplacementInput,
): CallReplacement | undefined {
  const {
    callSite,
    defaultLocale,
    isSingleLocale,
    locales,
    pickLocal,
    translations,
  } = input;
  const parsed = parseArguments(callSite);
  if (parsed.source === '') {
    return undefined;
  }

  const placeholderInfos = parsePlaceholders(parsed.source);
  const id = toMessageId(parsed.source);

  if (isSingleLocale && canElide(placeholderInfos, callSite, parsed)) {
    const bare = tryBareElision(parsed.source, callSite, placeholderInfos);
    if (bare !== undefined) {
      return bare;
    }
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

  const args: string[] = [catalog];
  if (paramsArgText !== undefined || parsed.optionsExpression !== undefined) {
    args.push(paramsArgText ?? 'undefined');
  }
  if (parsed.optionsExpression !== undefined) {
    args.push(parsed.optionsExpression);
  }
  return {
    code: `${pickLocal}(${args.join(', ')})`,
    usesPick: true,
  };
}

function canElide(
  placeholderInfos: readonly PlaceholderInfo[],
  callSite: CallSite,
  parsed: ParsedArguments,
): boolean {
  if (parsed.optionsExpression !== undefined) {
    return false;
  }
  for (const info of placeholderInfos) {
    if (info.kind !== 'simple') {
      return false;
    }
  }
  if (placeholderInfos.length === 0) {
    return true;
  }
  return getParamExpressions(callSite) !== undefined;
}

function renderEliminated(
  source: string,
  callSite: CallSite,
  placeholderInfos: readonly PlaceholderInfo[],
): string {
  if (placeholderInfos.length === 0) {
    return safeJsString(source);
  }
  const expressions = getParamExpressions(callSite);
  if (expressions === undefined) {
    return safeJsString(source);
  }
  return buildTemplateLiteral(source, expressions);
}

function safeJsString(text: string): string {
  return JSON.stringify(text)
    .replaceAll('{', '\\u007b')
    .replaceAll('}', '\\u007d');
}

function getParamExpressions(
  callSite: CallSite,
): Map<string, string> | undefined {
  const arg = callSite.node.arguments[1];
  if (arg === undefined) {
    return undefined;
  }
  if (!ts.isObjectLiteralExpression(arg)) {
    return undefined;
  }
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
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
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
    entries.push(`${renderLocaleKey(locale)}: ${safeJsString(text)}`);
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
  if (input.locale === input.defaultLocale) {
    return input.source;
  }
  const localeMap = input.translations[input.locale];
  if (localeMap === undefined) {
    return input.source;
  }
  const text = localeMap[input.id];
  return text ?? input.source;
}

function renderLocaleKey(locale: string): string {
  if (/^[A-Z_$a-z][\w$]*$/.test(locale)) {
    return locale;
  }
  return JSON.stringify(locale);
}

function getParamArgText(callSite: CallSite): string | undefined {
  const arg = callSite.node.arguments[1];
  if (arg === undefined) {
    return undefined;
  }
  return arg.getText();
}

function countReferences(code: string, name: string): number {
  let count = 0;
  let i = 0;
  while (i < code.length) {
    const next = code.indexOf(name, i);
    if (next === -1) {
      break;
    }
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
  if (ch === undefined) {
    return false;
  }
  return /[\w$]/.test(ch);
}

function tryBareElision(
  source: string,
  callSite: CallSite,
  placeholderInfos: readonly PlaceholderInfo[],
): CallReplacement | undefined {
  if (callSite.elision === undefined) {
    return undefined;
  }
  if (placeholderInfos.length > 0) {
    return undefined;
  }
  const { mode, range, attrName } = callSite.elision;
  if (mode === 'text') {
    if (!isSafeJsxText(source)) {
      return undefined;
    }
    return { code: source, range, usesPick: false };
  }
  if (attrName === undefined) {
    return undefined;
  }
  if (!isSafeAttributeValue(source)) {
    return undefined;
  }
  return {
    code: `${attrName}="${source}"`,
    range,
    usesPick: false,
  };
}

function isSafeJsxText(source: string): boolean {
  return !/[<>{}]/.test(source);
}

function isSafeAttributeValue(source: string): boolean {
  return !/["<>]/.test(source);
}

function findFreePickLocal(source: string): string {
  if (!hasIdentifier(source, PICK_LOCAL)) {
    return PICK_LOCAL;
  }
  let i = 0;
  while (hasIdentifier(source, `${PICK_LOCAL}_$${i}`)) {
    i += 1;
  }
  return `${PICK_LOCAL}_$${i}`;
}

function hasIdentifier(source: string, name: string): boolean {
  const escaped = name.replaceAll('$', '\\$');
  return new RegExp(`\\b${escaped}\\b`).test(source);
}
