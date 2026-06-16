import type { SourceMap } from 'magic-string';
import type {
  ApplyImportFn,
  ParseFragmentsFn,
  Processor,
  Range,
} from '../../../processor';
import type { Diagnostic } from '../diagnostic';
import type { Placeholder } from '../placeholder';
import type { ExtractFileResult, ParsedCallSite } from './extract';

import MagicString from 'magic-string';
import ts from 'typescript';

import { YAPYAK_INTERNAL_MODULE } from '../binding';
import { findMatchingBraceIndex } from '../matching-brace';
import { resolveProcessor } from '../processor';
import { injectComponentHooks } from './transform/component-hook';
import { resolveDirectivePrologueEnd } from './transform/directive';
import {
  findFreeIdentifier,
  findFreeIdentifiers,
  hasIdentifier,
} from './transform/identifier';
import {
  buildCatalogLiteral,
  pickLocaleText,
  toSafeJsString,
} from './transform/render';
import { transformScriptImports } from './transform/script-import';

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
const CATALOG_PREFIX = '_catalog';
const REGISTER_CATALOG_LOCAL = '_registerCatalog';
const INVALIDATE_FILE_LOCAL = '_invalidateFile';
const USE_YAPYAK_LOCAL = '_useYapyak';
const DEFAULT_APPLY_IMPORT: ApplyImportFn = (
  magicString,
  source,
  importStatement,
) => {
  const prologueEnd = resolveDirectivePrologueEnd(source);
  if (prologueEnd === 0) {
    magicString.prepend(`${importStatement}\n`);
    return;
  }
  magicString.appendRight(prologueEnd, `${importStatement}\n`);
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
  const runtime = processor.runtime;
  const componentHook = runtime?.componentHook;
  const magicString = new MagicString(request.source);

  const pickLocal = findFreePickLocal(request.source);
  const localsByFactory = findFreeFactoryLocals(request.source);
  const registerCatalogLocal = isDev
    ? findFreeIdentifier(request.source, REGISTER_CATALOG_LOCAL)
    : '';
  const invalidateFileLocal = isDev
    ? findFreeIdentifier(request.source, INVALIDATE_FILE_LOCAL)
    : '';
  const componentHookLocal = componentHook
    ? findFreeIdentifier(request.source, USE_YAPYAK_LOCAL)
    : '';

  let hasUsedPick = false;
  const usedFactories = new Set<string>();
  const catalogsByKey = new Map<string, CatalogEntry>();
  let nextCatalogIndex = 0;
  const registerCatalog = (literal: string, id: string): string => {
    const key = isDev ? id : literal;
    const existing = catalogsByKey.get(key);
    if (existing) {
      return existing.identifier;
    }
    while (
      hasIdentifier(request.source, `${CATALOG_PREFIX}_$${nextCatalogIndex}`)
    ) {
      nextCatalogIndex += 1;
    }
    const identifier = `${CATALOG_PREFIX}_$${nextCatalogIndex}`;
    nextCatalogIndex += 1;
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

  transformScriptImports({
    fileId: request.fileId,
    fragments,
    magicString,
  });

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
    allImportSpecs.push(`registerCatalog as ${registerCatalogLocal}`);
    allImportSpecs.push(`invalidateFile as ${invalidateFileLocal}`);
  }
  if (allImportSpecs.length > 0) {
    injectionLines.push(
      `import { ${allImportSpecs.join(', ')} } from '${YAPYAK_INTERNAL_MODULE}';`,
    );
  }
  if (runtime?.componentHook !== undefined) {
    injectionLines.push(
      `import { ${runtime.componentHook.invoke} as ${componentHookLocal} } from '${runtime.module}';`,
    );
  } else if (runtime !== undefined && isDev) {
    injectionLines.push(`import '${runtime.module}';`);
  }
  for (const entry of catalogsByKey.values()) {
    if (isDev) {
      injectionLines.push(
        `const ${entry.identifier} = ${registerCatalogLocal}(${JSON.stringify(request.fileId)}, ${JSON.stringify(entry.id)}, ${entry.literal});`,
      );
    } else {
      injectionLines.push(`const ${entry.identifier} = ${entry.literal};`);
    }
  }
  if (isDev) {
    injectionLines.push(
      `if (import.meta.hot) import.meta.hot.dispose(() => ${invalidateFileLocal}(${JSON.stringify(request.fileId)}));`,
    );
  }
  if (injectionLines.length > 0) {
    (processor.applyImport ?? DEFAULT_APPLY_IMPORT)(
      magicString,
      request.source,
      injectionLines.join('\n'),
    );
  }
  if (componentHook !== undefined) {
    injectComponentHooks({
      callSites,
      componentHook,
      fileId: request.fileId,
      fragments,
      invocation: componentHookLocal,
      magicString,
      source: request.source,
    });
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

type CatalogEntry = {
  id: string;
  identifier: string;
  literal: string;
};

type RenderCallReplacementInput = {
  callSite: ParsedCallSite;
  defaultLocale: string;
  locales: string[];
  localsByFactory: Map<string, string>;
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
  for (const property of paramsExpression.properties) {
    if (ts.isShorthandPropertyAssignment(property)) {
      result.set(property.name.text, property.name.text);
      continue;
    }
    if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
      result.set(property.name.text, property.initializer.getText());
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
  for (const [keyIndex, key] of repeatedKeys.entries()) {
    const param = freeParams[keyIndex];
    if (param !== undefined) {
      paramByKey.set(key, param);
    }
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
  const match = /^([\p{ID_Start}_$][\p{ID_Continue}$]*)/u.exec(trimmed);
  return match?.[1];
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
    .filter(
      (replacement) =>
        replacement.start >= textStart && replacement.end <= textEnd,
    )
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
  if (/[<>{}&]/.test(source)) {
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
  return !/["<>&]/.test(source);
}

function findFreePickLocal(source: string): string {
  return findFreeIdentifier(source, PICK_LOCAL);
}

function findFreeFactoryLocals(source: string): Map<string, string> {
  const locals = new Map<string, string>();
  for (const factory of FACTORY_ORDER) {
    locals.set(factory, findFreeIdentifier(source, `_${factory}`));
  }
  return locals;
}
