import type { SourceMap } from 'magic-string';
import type { Fragment, Processor, Range } from '../../../processor';
import type { Template, TemplateNode } from '../../../template';
import type { Diagnostic } from '../diagnostic';
import type { Placeholder } from '../placeholder';
import type { ExtractFileResult, ParsedCallSite } from './extract';

import MagicString from 'magic-string';
import ts from 'typescript';

import { parseTemplate } from '../../../template';
import { YAPYAK_INTERNAL_MODULE, YAPYAK_MODULE } from '../binding';
import { findMatchingBraceIndex } from '../matching-brace';
import { resolveProcessor } from '../processor';
import { getScriptKind } from '../script-kind';

export type TransformFileRequest = {
  defaultLocale?: string;
  extracted: ExtractFileResult;
  fileId: string;
  locales: string[];
  processors?: Processor[];
  source: string;
  sourcePath?: string;
  translations: Record<string, Record<string, string>>;
};

export type TransformFileResult = {
  code: string;
  diagnostics: Diagnostic[];
  map: SourceMap;
};

const PICK_EXPORT = 'pick';
const PICK_LOCAL = '_pick';
const FACTORY_ORDER = [
  'literal',
  'placeholder',
  'count',
  'plural',
  'select',
  'number',
  'date',
  'time',
] as const;

export function transformFile(
  request: TransformFileRequest,
): TransformFileResult {
  const defaultLocale = request.defaultLocale ?? request.locales[0];
  if (!defaultLocale) {
    return {
      code: request.source,
      diagnostics: [],
      map: new MagicString(request.source).generateMap({
        hires: true,
        source: request.sourcePath ?? request.fileId,
      }),
    };
  }
  const processor = resolveProcessor(
    request.fileId,
    request.source,
    request.processors ?? [],
  );
  const fragments = processor.parseFragments(request.source);
  const isSingleLocale = request.locales.length === 1;
  const magicString = new MagicString(request.source);

  const pickLocal = findFreePickLocal(request.source);

  let hasUsedPick = false;
  const usedFactories = new Set<string>();
  for (const callSite of request.extracted.callSites) {
    const replacement = renderCallReplacement({
      callSite,
      defaultLocale,
      locales: request.locales,
      pickLocal,
      singleLocale: isSingleLocale,
      translations: request.translations,
    });
    if (!replacement) {
      continue;
    }
    const range = replacement.range ?? callSite.range;
    magicString.overwrite(
      range.start.offset,
      range.end.offset,
      replacement.code,
    );
    if (replacement.usesPick) {
      hasUsedPick = true;
    }
    for (const factory of replacement.usedFactories) {
      usedFactories.add(factory);
    }
  }

  transformScriptImports(fragments, magicString, request);

  const importSpecs: string[] = [];
  if (hasUsedPick) {
    importSpecs.push(
      pickLocal === PICK_EXPORT
        ? PICK_EXPORT
        : `${PICK_EXPORT} as ${pickLocal}`,
    );
  }
  for (const factory of FACTORY_ORDER) {
    if (usedFactories.has(factory)) {
      importSpecs.push(`${factory} as _${factory}`);
    }
  }
  if (importSpecs.length > 0) {
    processor.applyImport(
      magicString,
      request.source,
      `import { ${importSpecs.join(', ')} } from '${YAPYAK_INTERNAL_MODULE}';`,
    );
  }

  return {
    code: magicString.toString(),
    diagnostics: [],
    map: magicString.generateMap({
      hires: true,
      source: request.sourcePath ?? request.fileId,
    }),
  };
}

function transformScriptImports(
  fragments: Fragment[],
  magicString: MagicString,
  request: TransformFileRequest,
): void {
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
    const coreImports = extractCoreImports(sourceFile);
    for (const declaration of coreImports) {
      transformImportDeclaration({
        declaration,
        fragment,
        intermediate,
        magicString,
        sourceFile,
      });
    }
  }
}

type TransformImportDeclarationInput = {
  declaration: ts.ImportDeclaration;
  fragment: Fragment;
  intermediate: string;
  magicString: MagicString;
  sourceFile: ts.SourceFile;
};

function transformImportDeclaration(
  input: TransformImportDeclarationInput,
): void {
  const { declaration, fragment, intermediate, magicString, sourceFile } =
    input;
  if (declaration.importClause?.isTypeOnly === true) {
    return;
  }
  const namedBindings = declaration.importClause?.namedBindings;
  if (!namedBindings || !ts.isNamedImports(namedBindings)) {
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
        local: localName,
        typeOnly: true,
      });
      continue;
    }
    const occurrences = getReferenceCount(intermediate, localName);
    if (occurrences > 1) {
      remaining.push({
        imported: importedName,
        local: localName,
        typeOnly: false,
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
  const specList = remaining.map(renderSpecifier).join(', ');
  const moduleSpecText = declaration.moduleSpecifier.getText(sourceFile);
  magicString.overwrite(
    startInOriginal,
    endInOriginal,
    `import { ${specList} } from ${moduleSpecText};`,
  );
}

function renderSpecifier(item: ImportSpecifier): string {
  const prefix = item.typeOnly ? 'type ' : '';
  const body =
    item.imported === item.local
      ? item.imported
      : `${item.imported} as ${item.local}`;
  return `${prefix}${body}`;
}

type ImportSpecifier = {
  imported: string;
  local: string;
  typeOnly: boolean;
};

function extractCoreImports(sourceFile: ts.SourceFile): ts.ImportDeclaration[] {
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

type RenderCallReplacementInput = {
  callSite: ParsedCallSite;
  defaultLocale: string;
  locales: string[];
  pickLocal: string;
  singleLocale: boolean;
  translations: Record<string, Record<string, string>>;
};

type CallReplacement = {
  code: string;
  range?: Range;
  usedFactories: Set<string>;
  usesPick: boolean;
};

function renderCallReplacement(
  input: RenderCallReplacementInput,
): CallReplacement | undefined {
  const {
    callSite,
    defaultLocale,
    singleLocale: isSingleLocale,
    locales,
    pickLocal,
    translations,
  } = input;
  if (callSite.source === '') {
    return undefined;
  }
  const { id, placeholders, source } = callSite;

  if (isSingleLocale && canElide(placeholders, callSite)) {
    const singleLocale = locales[0];
    const targetText = singleLocale
      ? pickLocaleText({
          defaultLocale,
          id,
          locale: singleLocale,
          source,
          translations,
        })
      : source;
    const bare = tryBareElision(targetText, callSite, placeholders);
    if (bare) {
      return bare;
    }
    return {
      code: renderEliminated(targetText, callSite, placeholders),
      usedFactories: new Set(),
      usesPick: false,
    };
  }

  const usedFactories = new Set<string>();
  const catalog = buildCatalogLiteral(
    {
      defaultLocale,
      id,
      locales,
      source,
      translations,
    },
    usedFactories,
  );
  const hasPlaceholders = placeholders.length > 0;
  const paramsExpressionText = hasPlaceholders
    ? getParamArgText(callSite)
    : undefined;
  const localeText = callSite.localeExpression?.getText();

  const args: string[] = [
    catalog,
  ];
  if (paramsExpressionText || localeText) {
    args.push(paramsExpressionText ?? 'undefined');
  }
  if (localeText) {
    args.push(`{ locale: ${localeText} }`);
  }
  return {
    code: `${pickLocal}(${args.join(', ')})`,
    usedFactories,
    usesPick: true,
  };
}

function canElide(
  placeholders: Placeholder[],
  callSite: ParsedCallSite,
): boolean {
  if (callSite.localeExpression) {
    return false;
  }
  for (const placeholder of placeholders) {
    if (placeholder.kind !== 'simple') {
      return false;
    }
  }
  if (placeholders.length === 0) {
    return true;
  }
  return Boolean(getParamExpressions(callSite));
}

function renderEliminated(
  source: string,
  callSite: ParsedCallSite,
  placeholders: Placeholder[],
): string {
  if (placeholders.length === 0) {
    return toSafeJsString(source);
  }
  const expressions = getParamExpressions(callSite);
  if (!expressions) {
    return toSafeJsString(source);
  }
  return buildTemplateLiteral(source, expressions);
}

function toSafeJsString(text: string): string {
  let out = "'";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    switch (ch) {
      case '\\':
        out += '\\\\';
        break;
      case "'":
        out += '\\u0027';
        break;
      case '"':
        out += '\\u0022';
        break;
      case '{':
        out += '\\u007b';
        break;
      case '}':
        out += '\\u007d';
        break;
      case '\n':
        out += '\\n';
        break;
      case '\r':
        out += '\\r';
        break;
      case '\t':
        out += '\\t';
        break;
      case '\b':
        out += '\\b';
        break;
      case '\f':
        out += '\\f';
        break;
      default:
        if (code < 0x20 || code === 0x20_28 || code === 0x20_29) {
          out += `\\u${code.toString(16).padStart(4, '0')}`;
        } else {
          out += ch;
        }
    }
  }
  out += "'";
  return out;
}

function getParamExpressions(
  callSite: ParsedCallSite,
): Map<string, string> | undefined {
  const paramsExpression = callSite.paramsExpression;
  if (!paramsExpression) {
    return undefined;
  }
  if (!ts.isObjectLiteralExpression(paramsExpression)) {
    return undefined;
  }
  const result = new Map<string, string>();
  for (const prop of paramsExpression.properties) {
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
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    if (character === '{') {
      const close = findMatchingBraceIndex(source, index);
      const inner = source.slice(index + 1, close);
      const key = readKey(inner);
      if (key && expressions.has(key)) {
        result += `\${${expressions.get(key) ?? key}}`;
        index = close + 1;
        continue;
      }
    }
    if (character === '`') {
      result += '\\`';
      index += 1;
      continue;
    }
    if (character === '\\') {
      result += '\\\\';
      index += 1;
      continue;
    }
    if (character === '$' && source[index + 1] === '{') {
      result += '\\${';
      index += 2;
      continue;
    }
    result += character;
    index += 1;
  }
  result += '`';
  return result;
}

function readKey(inner: string): string | undefined {
  const trimmed = inner.trimStart();
  const match = /^([A-Z_$a-z][\w$]*)/.exec(trimmed);
  return match?.[1];
}

type BuildCatalogInput = {
  defaultLocale: string;
  id: string;
  locales: string[];
  source: string;
  translations: Record<string, Record<string, string>>;
};

function buildCatalogLiteral(
  input: BuildCatalogInput,
  usedFactories: Set<string>,
): string {
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
    entries.push(
      `${renderLocaleKey(locale)}: ${renderVariantValue(text, usedFactories)}`,
    );
  }
  return `{ ${entries.join(', ')} }`;
}

function renderVariantValue(text: string, usedFactories: Set<string>): string {
  const { template } = parseTemplate(text);
  if (isStaticTemplate(template)) {
    return toSafeJsString(text);
  }
  return renderTemplateLiteral(template, usedFactories);
}

function isStaticTemplate(template: Template): boolean {
  if (template.length === 0) {
    return true;
  }
  for (const node of template) {
    if (node.kind !== 'literal') {
      return false;
    }
  }
  return true;
}

function renderTemplateLiteral(
  template: Template,
  usedFactories: Set<string>,
): string {
  return `[${template.map((node) => renderNode(node, usedFactories)).join(',')}]`;
}

function renderNode(node: TemplateNode, usedFactories: Set<string>): string {
  switch (node.kind) {
    case 'literal':
      usedFactories.add('literal');
      return `_literal(${JSON.stringify(node.value)})`;
    case 'placeholder':
      usedFactories.add('placeholder');
      return `_placeholder(${JSON.stringify(node.name)})`;
    case 'count':
      usedFactories.add('count');
      return '_count()';
    case 'plural':
      usedFactories.add('plural');
      return `_plural(${JSON.stringify(node.name)},${JSON.stringify(node.type)},${renderBranches(node.branches, usedFactories)})`;
    case 'select':
      usedFactories.add('select');
      return `_select(${JSON.stringify(node.name)},${renderBranches(node.branches, usedFactories)})`;
    case 'number':
      usedFactories.add('number');
      return `_number(${JSON.stringify(node.name)},${JSON.stringify(node.options)})`;
    case 'date':
      usedFactories.add('date');
      return `_date(${JSON.stringify(node.name)},${JSON.stringify(node.style)})`;
    case 'time':
      usedFactories.add('time');
      return `_time(${JSON.stringify(node.name)},${JSON.stringify(node.style)})`;
    default:
      return '';
  }
}

function renderBranches(
  branches: Record<string, Template>,
  usedFactories: Set<string>,
): string {
  const entries = Object.entries(branches).map(
    ([name, template]) =>
      `${JSON.stringify(name)}:${renderTemplateLiteral(template, usedFactories)}`,
  );
  return `{${entries.join(',')}}`;
}

type PickLocaleTextInput = {
  defaultLocale: string;
  id: string;
  locale: string;
  source: string;
  translations: Record<string, Record<string, string>>;
};

function pickLocaleText(input: PickLocaleTextInput): string {
  if (input.locale === input.defaultLocale) {
    return input.source;
  }
  const localeMap = input.translations[input.locale];
  if (!localeMap) {
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

function getParamArgText(callSite: ParsedCallSite): string | undefined {
  const paramsExpression = callSite.paramsExpression;
  if (!paramsExpression) {
    return undefined;
  }
  return paramsExpression.getText();
}

function getReferenceCount(code: string, name: string): number {
  const sourceFile = ts.createSourceFile(
    'ref-count.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let count = 0;
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === name && isReference(node)) {
      count += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return count;
}

function isReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) {
    return true;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return false;
  }
  if (ts.isPropertyAssignment(parent) && parent.name === node) {
    return false;
  }
  if (ts.isJsxAttribute(parent) && parent.name === node) {
    return false;
  }
  return true;
}

function isIdentifierChar(character: string | undefined): boolean {
  if (!character) {
    return false;
  }
  return /[\w$]/.test(character);
}

function tryBareElision(
  source: string,
  callSite: ParsedCallSite,
  placeholders: Placeholder[],
): CallReplacement | undefined {
  if (!callSite.elision) {
    return undefined;
  }
  if (placeholders.length > 0) {
    return undefined;
  }
  const { mode, range, attributeName } = callSite.elision;
  if (mode === 'text') {
    if (!isSafeJsxText(source)) {
      return undefined;
    }
    return {
      code: source,
      range,
      usedFactories: new Set(),
      usesPick: false,
    };
  }
  if (!attributeName) {
    return undefined;
  }
  if (!isSafeAttributeValue(source)) {
    return undefined;
  }
  return {
    code: `${attributeName}="${source}"`,
    range,
    usedFactories: new Set(),
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
  let suffix = 0;
  while (hasIdentifier(source, `${PICK_LOCAL}_$${suffix}`)) {
    suffix += 1;
  }
  return `${PICK_LOCAL}_$${suffix}`;
}

function hasIdentifier(source: string, name: string): boolean {
  let index = source.indexOf(name);
  while (index !== -1) {
    const before = source[index - 1];
    const after = source[index + name.length];
    if (!isIdentifierChar(before) && !isIdentifierChar(after)) {
      return true;
    }
    index = source.indexOf(name, index + name.length);
  }
  return false;
}
