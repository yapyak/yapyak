import type { SourceMap } from 'magic-string';
import type {
  ApplyImportFn,
  Fragment,
  ParseFragmentsFn,
  Processor,
  Range,
} from '../../../processor';
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
  dev?: boolean;
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
const CATALOG_PREFIX = '_yapyak_catalog';
const REGISTER_LOCAL = '_yp_register';
const INVALIDATE_LOCAL = '_yp_invalidate';
const USE_LOCAL = '_yp_use';
const DEFAULT_APPLY_IMPORT: ApplyImportFn = (
  magicString,
  _source,
  importStatement,
) => {
  magicString.prepend(`${importStatement}\n`);
};
const DEFAULT_PARSE_FRAGMENTS: ParseFragmentsFn = (source) => [
  {
    code: source,
    kind: 'script',
    lang: 'ts',
    originalOffset: 0,
  },
];
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
  const fragments = (processor.parseFragments ?? DEFAULT_PARSE_FRAGMENTS)(
    request.source,
  );
  const isSingleLocale = request.locales.length === 1;
  const isDev = request.dev === true;
  const runtime = isDev ? processor.runtime : undefined;
  const injectsReactHook = runtime?.invoke !== undefined;
  const magicString = new MagicString(request.source);

  const pickLocal = findFreePickLocal(request.source);
  const localsByFactory = findFreeFactoryLocals(request.source);
  const registerLocal = isDev
    ? findFreeIdentifier(request.source, REGISTER_LOCAL)
    : '';
  const invalidateLocal = isDev
    ? findFreeIdentifier(request.source, INVALIDATE_LOCAL)
    : '';
  const useLocal = injectsReactHook
    ? findFreeIdentifier(request.source, USE_LOCAL)
    : '';

  let hasUsedPick = false;
  const usedFactories = new Set<string>();
  const catalogsByKey = new Map<string, CatalogEntry>();
  const catalogPrefix = findFreeCatalogPrefix(request.source);
  const registerCatalog = (literal: string, id: string): string => {
    const key = isDev ? id : literal;
    const existing = catalogsByKey.get(key);
    if (existing) {
      return existing.identifier;
    }
    const identifier = `${catalogPrefix}_$${catalogsByKey.size}`;
    catalogsByKey.set(key, {
      id,
      identifier,
      literal,
    });
    return identifier;
  };
  const callSites = request.extracted.callSites;
  const childrenByParent = buildContainmentTree(callSites);
  const replacementsByCallSite = new Map<ParsedCallSite, CallReplacement>();
  const renderInOrder = (callSite: ParsedCallSite): void => {
    for (const child of childrenByParent.get(callSite) ?? []) {
      renderInOrder(child);
    }
    const nestedReplacements: NestedReplacement[] = [];
    for (const child of childrenByParent.get(callSite) ?? []) {
      const childReplacement = replacementsByCallSite.get(child);
      if (!childReplacement) {
        continue;
      }
      const range = childReplacement.range ?? child.range;
      nestedReplacements.push({
        code: childReplacement.code,
        end: range.end.offset,
        start: range.start.offset,
      });
    }
    const replacement = renderCallReplacement({
      callSite,
      defaultLocale,
      locales: request.locales,
      localsByFactory,
      nestedReplacements,
      pickLocal,
      registerCatalog,
      singleLocale: isSingleLocale,
      translations: request.translations,
    });
    if (replacement) {
      replacementsByCallSite.set(callSite, replacement);
    }
  };
  const topLevelCallSites = callSites.filter(
    (callSite) => !hasContainingParent(callSite, callSites),
  );
  for (const callSite of topLevelCallSites) {
    renderInOrder(callSite);
  }
  for (const callSite of topLevelCallSites) {
    const replacement = replacementsByCallSite.get(callSite);
    if (!replacement) {
      continue;
    }
    const range = replacement.range ?? callSite.range;
    magicString.overwrite(
      range.start.offset,
      range.end.offset,
      replacement.code,
    );
  }
  for (const replacement of replacementsByCallSite.values()) {
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
      const local = localsByFactory.get(factory) ?? `_${factory}`;
      importSpecs.push(`${factory} as ${local}`);
    }
  }
  const injectionLines: string[] = [];
  const allImportSpecs = importSpecs.slice();
  if (isDev) {
    allImportSpecs.push(`registerCatalog as ${registerLocal}`);
    allImportSpecs.push(`invalidateFile as ${invalidateLocal}`);
  }
  if (allImportSpecs.length > 0) {
    injectionLines.push(
      `import { ${allImportSpecs.join(', ')} } from '${YAPYAK_INTERNAL_MODULE}';`,
    );
  }
  if (runtime !== undefined) {
    if (runtime.invoke === undefined) {
      injectionLines.push(`import '${runtime.module}';`);
    } else {
      injectionLines.push(
        `import { ${runtime.invoke} as ${useLocal} } from '${runtime.module}';`,
      );
    }
  }
  for (const entry of catalogsByKey.values()) {
    if (isDev) {
      injectionLines.push(
        `const ${entry.identifier} = ${registerLocal}(${JSON.stringify(request.fileId)}, ${JSON.stringify(entry.id)}, ${entry.literal});`,
      );
    } else {
      injectionLines.push(`const ${entry.identifier} = ${entry.literal};`);
    }
  }
  if (isDev) {
    injectionLines.push(
      `if (import.meta.hot) import.meta.hot.dispose(() => ${invalidateLocal}(${JSON.stringify(request.fileId)}));`,
    );
  }
  if (injectionLines.length > 0) {
    (processor.applyImport ?? DEFAULT_APPLY_IMPORT)(
      magicString,
      request.source,
      injectionLines.join('\n'),
    );
  }
  if (injectsReactHook) {
    injectReactHooks(magicString, fragments, callSites, useLocal, request);
  }

  return {
    code: magicString.toString(),
    diagnostics: request.extracted.diagnostics,
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

type CatalogEntry = {
  id: string;
  identifier: string;
  literal: string;
};

type RenderCallReplacementInput = {
  callSite: ParsedCallSite;
  defaultLocale: string;
  locales: string[];
  localsByFactory: ReadonlyMap<string, string>;
  nestedReplacements?: NestedReplacement[];
  pickLocal: string;
  registerCatalog: (literal: string, id: string) => string;
  singleLocale: boolean;
  translations: Record<string, Record<string, string>>;
};

type CallReplacement = {
  code: string;
  range?: Range;
  usedFactories: Set<string>;
  usesPick: boolean;
};

type NestedReplacement = {
  code: string;
  end: number;
  start: number;
};

function renderCallReplacement(
  input: RenderCallReplacementInput,
): CallReplacement | undefined {
  const {
    callSite,
    defaultLocale,
    singleLocale: isSingleLocale,
    locales,
    localsByFactory,
    pickLocal,
    registerCatalog,
    translations,
  } = input;
  if (callSite.source === '') {
    return undefined;
  }
  const { id, placeholders, source } = callSite;

  if (
    isSingleLocale &&
    canElide(placeholders, callSite, input.nestedReplacements ?? [])
  ) {
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
    localsByFactory,
  );
  const catalogIdentifier = registerCatalog(catalog, id);
  const hasPlaceholders = placeholders.length > 0;
  const nested = input.nestedReplacements ?? [];
  const paramsExpressionText = hasPlaceholders
    ? getParamArgText(callSite, nested)
    : undefined;
  const localeExpression = callSite.localeExpression;
  const localeText = localeExpression
    ? interpolateNestedReplacements(
        localeExpression.getText(),
        localeExpression.getStart() + callSite.fragmentOffset,
        nested,
      )
    : undefined;

  const args: string[] = [
    catalogIdentifier,
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
  nested: NestedReplacement[],
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
  if (hasNestedInParams(callSite, nested)) {
    return false;
  }
  return Boolean(getParamExpressions(callSite));
}

function hasNestedInParams(
  callSite: ParsedCallSite,
  nested: NestedReplacement[],
): boolean {
  const paramsExpression = callSite.paramsExpression;
  if (!paramsExpression || nested.length === 0) {
    return false;
  }
  const start = paramsExpression.getStart() + callSite.fragmentOffset;
  const end = paramsExpression.getEnd() + callSite.fragmentOffset;
  for (const replacement of nested) {
    if (replacement.start >= start && replacement.end <= end) {
      return true;
    }
  }
  return false;
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
  const usageByKey = new Map<string, number>();
  let scan = 0;
  while (scan < source.length) {
    if (source[scan] === '{') {
      const close = findMatchingBraceIndex(source, scan);
      const key = readKey(source.slice(scan + 1, close));
      if (key && expressions.has(key)) {
        usageByKey.set(key, (usageByKey.get(key) ?? 0) + 1);
        scan = close + 1;
        continue;
      }
    }
    scan += 1;
  }
  const repeatedKeys: string[] = [];
  for (const [key, count] of usageByKey) {
    if (count > 1) {
      repeatedKeys.push(key);
    }
  }
  const collisionSource = `${source}\n${[
    ...expressions.values(),
  ].join('\n')}`;
  const freeParams = findFreeIdentifiers(
    collisionSource,
    '_p',
    repeatedKeys.length,
  );
  const paramByKey = new Map<string, string>();
  for (let i = 0; i < repeatedKeys.length; i++) {
    paramByKey.set(repeatedKeys[i] as string, freeParams[i] as string);
  }

  let result = '`';
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    if (character === '{') {
      const close = findMatchingBraceIndex(source, index);
      const inner = source.slice(index + 1, close);
      const key = readKey(inner);
      if (key && expressions.has(key)) {
        const cachedParam = paramByKey.get(key);
        const expression = cachedParam ?? expressions.get(key) ?? key;
        result += `\${${expression}}`;
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
      const close = findMatchingBraceIndex(source, index + 1);
      const inner = source.slice(index + 2, close);
      const peekKey = readKey(inner);
      if (peekKey && expressions.has(peekKey)) {
        result += '$';
        index += 1;
        continue;
      }
      result += '\\${';
      index += 2;
      continue;
    }
    result += character;
    index += 1;
  }
  result += '`';

  if (paramByKey.size === 0) {
    return result;
  }
  const params = [
    ...paramByKey.values(),
  ].join(', ');
  const args = [
    ...paramByKey.keys(),
  ]
    .map((key) => expressions.get(key) ?? key)
    .join(', ');
  return `((${params}) => ${result})(${args})`;
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
  localsByFactory: ReadonlyMap<string, string>,
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
      `${renderLocaleKey(locale)}: ${renderVariantValue(text, usedFactories, localsByFactory)}`,
    );
  }
  return `{ ${entries.join(', ')} }`;
}

function renderVariantValue(
  text: string,
  usedFactories: Set<string>,
  localsByFactory: ReadonlyMap<string, string>,
): string {
  const { template } = parseTemplate(text);
  if (isStaticTemplate(template)) {
    return toSafeJsString(text);
  }
  return renderTemplateLiteral(template, usedFactories, localsByFactory);
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
  localsByFactory: ReadonlyMap<string, string>,
): string {
  return `[${template.map((node) => renderNode(node, usedFactories, localsByFactory)).join(',')}]`;
}

function renderNode(
  node: TemplateNode,
  usedFactories: Set<string>,
  localsByFactory: ReadonlyMap<string, string>,
): string {
  const localFor = (factory: string): string =>
    localsByFactory.get(factory) ?? `_${factory}`;
  switch (node.kind) {
    case 'literal':
      usedFactories.add('literal');
      return `${localFor('literal')}(${JSON.stringify(node.value)})`;
    case 'placeholder':
      usedFactories.add('placeholder');
      return `${localFor('placeholder')}(${JSON.stringify(node.name)})`;
    case 'count':
      usedFactories.add('count');
      return `${localFor('count')}()`;
    case 'plural':
      usedFactories.add('plural');
      return `${localFor('plural')}(${JSON.stringify(node.name)},${JSON.stringify(node.type)},${renderBranches(node.branches, usedFactories, localsByFactory)})`;
    case 'select':
      usedFactories.add('select');
      return `${localFor('select')}(${JSON.stringify(node.name)},${renderBranches(node.branches, usedFactories, localsByFactory)})`;
    case 'number':
      usedFactories.add('number');
      return `${localFor('number')}(${JSON.stringify(node.name)},${JSON.stringify(node.options)})`;
    case 'date':
      usedFactories.add('date');
      return `${localFor('date')}(${JSON.stringify(node.name)},${JSON.stringify(node.style)})`;
    case 'time':
      usedFactories.add('time');
      return `${localFor('time')}(${JSON.stringify(node.name)},${JSON.stringify(node.style)})`;
    default:
      return '';
  }
}

function renderBranches(
  branches: Record<string, Template>,
  usedFactories: Set<string>,
  localsByFactory: ReadonlyMap<string, string>,
): string {
  const entries = Object.entries(branches).map(
    ([name, template]) =>
      `${JSON.stringify(name)}:${renderTemplateLiteral(template, usedFactories, localsByFactory)}`,
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

function buildContainmentTree(
  callSites: ParsedCallSite[],
): Map<ParsedCallSite, ParsedCallSite[]> {
  const childrenByParent = new Map<ParsedCallSite, ParsedCallSite[]>();
  for (const candidateChild of callSites) {
    const parent = findSmallestContainingParent(candidateChild, callSites);
    if (!parent) {
      continue;
    }
    const list = childrenByParent.get(parent) ?? [];
    list.push(candidateChild);
    childrenByParent.set(parent, list);
  }
  return childrenByParent;
}

function findSmallestContainingParent(
  child: ParsedCallSite,
  callSites: ParsedCallSite[],
): ParsedCallSite | undefined {
  const childStart = child.range.start.offset;
  const childEnd = child.range.end.offset;
  let smallestParent: ParsedCallSite | undefined;
  let smallestSize = Number.POSITIVE_INFINITY;
  for (const candidate of callSites) {
    if (candidate === child) {
      continue;
    }
    const candidateStart = candidate.range.start.offset;
    const candidateEnd = candidate.range.end.offset;
    if (candidateStart > childStart || candidateEnd < childEnd) {
      continue;
    }
    if (candidateStart === childStart && candidateEnd === childEnd) {
      continue;
    }
    const size = candidateEnd - candidateStart;
    if (size < smallestSize) {
      smallestSize = size;
      smallestParent = candidate;
    }
  }
  return smallestParent;
}

function hasContainingParent(
  child: ParsedCallSite,
  callSites: ParsedCallSite[],
): boolean {
  return findSmallestContainingParent(child, callSites) !== undefined;
}

function getParamArgText(
  callSite: ParsedCallSite,
  nested: NestedReplacement[],
): string | undefined {
  const paramsExpression = callSite.paramsExpression;
  if (!paramsExpression) {
    return undefined;
  }
  return interpolateNestedReplacements(
    paramsExpression.getText(),
    paramsExpression.getStart() + callSite.fragmentOffset,
    nested,
  );
}

function interpolateNestedReplacements(
  text: string,
  textStart: number,
  nested: NestedReplacement[],
): string {
  if (nested.length === 0) {
    return text;
  }
  const textEnd = textStart + text.length;
  const contained = nested
    .filter((n) => n.start >= textStart && n.end <= textEnd)
    .sort((a, b) => b.start - a.start);
  if (contained.length === 0) {
    return text;
  }
  let result = text;
  for (const replacement of contained) {
    const relativeStart = replacement.start - textStart;
    const relativeEnd = replacement.end - textStart;
    result =
      result.slice(0, relativeStart) +
      replacement.code +
      result.slice(relativeEnd);
  }
  return result;
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
  if (/[<>{}]/.test(source)) {
    return false;
  }
  if (/^\s|\s$/.test(source)) {
    return false;
  }
  if (/[\n\r]/.test(source)) {
    return false;
  }
  return true;
}

function isSafeAttributeValue(source: string): boolean {
  return !/["<>]/.test(source);
}

function findFreePickLocal(source: string): string {
  return findFreeIdentifier(source, PICK_LOCAL);
}

function findFreeCatalogPrefix(source: string): string {
  return findFreeIdentifier(source, CATALOG_PREFIX);
}

function findFreeFactoryLocals(source: string): Map<string, string> {
  const locals = new Map<string, string>();
  for (const factory of FACTORY_ORDER) {
    locals.set(factory, findFreeIdentifier(source, `_${factory}`));
  }
  return locals;
}

function findFreeIdentifier(source: string, preferred: string): string {
  if (!hasIdentifier(source, preferred)) {
    return preferred;
  }
  let suffix = 0;
  while (hasIdentifier(source, `${preferred}_$${suffix}`)) {
    suffix += 1;
  }
  return `${preferred}_$${suffix}`;
}

function findFreeIdentifiers(
  source: string,
  prefix: string,
  count: number,
): string[] {
  const result: string[] = [];
  let index = 0;
  while (result.length < count) {
    const candidate = `${prefix}${index}`;
    if (!hasIdentifier(source, candidate) && !result.includes(candidate)) {
      result.push(candidate);
    }
    index += 1;
  }
  return result;
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

const COMPONENT_NAME_RX = /^[A-Z]/;
const HOOK_NAME_RX = /^use[A-Z]/;

function injectReactHooks(
  magicString: MagicString,
  fragments: Fragment[],
  callSites: readonly ParsedCallSite[],
  useLocal: string,
  request: TransformFileRequest,
): void {
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
    const insertionPositions = new Set<number>();
    walkForComponents(
      sourceFile,
      sourceFile,
      fragment.originalOffset,
      callSites,
      insertionPositions,
    );
    for (const position of insertionPositions) {
      magicString.appendLeft(position, `${useLocal}();`);
    }
  }
}

function walkForComponents(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  fragmentOffset: number,
  callSites: readonly ParsedCallSite[],
  insertionPositions: Set<number>,
): void {
  if (ts.isFunctionDeclaration(node) && node.name && node.body) {
    if (
      isReactCandidateName(node.name.text) &&
      containsCallSite(node, sourceFile, fragmentOffset, callSites)
    ) {
      insertionPositions.add(
        node.body.getStart(sourceFile) + 1 + fragmentOffset,
      );
    }
  }
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    const initializer = node.initializer;
    if (
      initializer &&
      (ts.isArrowFunction(initializer) ||
        ts.isFunctionExpression(initializer)) &&
      ts.isBlock(initializer.body)
    ) {
      if (
        isReactCandidateName(node.name.text) &&
        containsCallSite(initializer, sourceFile, fragmentOffset, callSites)
      ) {
        insertionPositions.add(
          initializer.body.getStart(sourceFile) + 1 + fragmentOffset,
        );
      }
    }
  }
  ts.forEachChild(node, (child) => {
    walkForComponents(
      child,
      sourceFile,
      fragmentOffset,
      callSites,
      insertionPositions,
    );
  });
}

function isReactCandidateName(name: string): boolean {
  return COMPONENT_NAME_RX.test(name) || HOOK_NAME_RX.test(name);
}

function containsCallSite(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  fragmentOffset: number,
  callSites: readonly ParsedCallSite[],
): boolean {
  const start = node.getStart(sourceFile) + fragmentOffset;
  const end = node.getEnd() + fragmentOffset;
  for (const callSite of callSites) {
    if (
      callSite.range.start.offset >= start &&
      callSite.range.end.offset <= end
    ) {
      return true;
    }
  }
  return false;
}
