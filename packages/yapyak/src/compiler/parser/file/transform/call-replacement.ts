import type { Range } from '../../../../processor';
import type { Placeholder } from '../../../placeholder';
import type { ParsedCallSite } from '../extract';

import ts from '@typescript/typescript6';

import { findMatchingBraceIndex } from '../../matching-brace';
import { remapOffset } from '../../offset';
import { findFreeIdentifiers } from './identifier';
import { buildVariantsLiteral, pickLocaleText, toSafeJsString } from './render';

export type RenderCallReplacementInput = {
  callSite: ParsedCallSite;
  defaultLocale: string;
  locales: string[];
  localsByFactory: Map<string, string>;
  nestedReplacements?: NestedReplacement[];
  originalSource: string;
  pickLocal: string;
  registerVariants: (literal: string, id: string) => string;
  singleLocale: boolean;
  translations: Record<string, Record<string, string>>;
};

export type CallReplacement = {
  code: string;
  range?: Range;
  usedFactories: Set<string>;
  usesPick: boolean;
};

export type NestedReplacement = {
  code: string;
  end: number;
  start: number;
};

export function renderCallReplacement(
  input: RenderCallReplacementInput,
): CallReplacement | undefined {
  const {
    callSite,
    defaultLocale,
    singleLocale: isSingleLocale,
    locales,
    localsByFactory,
    originalSource,
    pickLocal,
    registerVariants,
    translations,
  } = input;
  if (callSite.source === '') {
    return undefined;
  }
  const { id, placeholders, source } = callSite;
  if (
    isSingleLocale &&
    isElidable(
      placeholders,
      callSite,
      input.nestedReplacements ?? [],
      originalSource,
    )
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
      code: renderEliminated(
        targetText,
        callSite,
        placeholders,
        originalSource,
      ),
      usedFactories: new Set(),
      usesPick: false,
    };
  }
  const usedFactories = new Set<string>();
  const variants = buildVariantsLiteral(
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
  const variantsIdentifier = registerVariants(variants, id);
  const hasPlaceholders = placeholders.length > 0;
  const nested = input.nestedReplacements ?? [];
  const paramsExpressionText = hasPlaceholders
    ? getParamArgumentText(callSite, nested, originalSource)
    : undefined;
  const localeExpression = callSite.localeExpression;
  const localeText = localeExpression
    ? interpolateNestedReplacements(
        getSourceText(localeExpression, callSite, originalSource),
        remapOffset(localeExpression.getStart(), callSite.fragment),
        nested,
      )
    : undefined;
  const args: string[] = [
    variantsIdentifier,
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

function isElidable(
  placeholders: Placeholder[],
  callSite: ParsedCallSite,
  nested: NestedReplacement[],
  originalSource: string,
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
  return Boolean(getParamExpressions(callSite, originalSource));
}

function hasNestedInParams(
  callSite: ParsedCallSite,
  nested: NestedReplacement[],
): boolean {
  const paramsExpression = callSite.paramsExpression;
  if (!paramsExpression || nested.length === 0) {
    return false;
  }
  const start = remapOffset(paramsExpression.getStart(), callSite.fragment);
  const end = remapOffset(paramsExpression.getEnd(), callSite.fragment);
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
  originalSource: string,
): string {
  if (placeholders.length === 0) {
    return toSafeJsString(source);
  }
  const expressions = getParamExpressions(callSite, originalSource);
  if (!expressions) {
    return toSafeJsString(source);
  }
  return buildTemplateLiteral(source, expressions);
}

function getParamExpressions(
  callSite: ParsedCallSite,
  originalSource: string,
): Map<string, string> | undefined {
  const paramsExpression = callSite.paramsExpression;
  if (!paramsExpression) {
    return undefined;
  }
  if (!ts.isObjectLiteralExpression(paramsExpression)) {
    return undefined;
  }
  const expressionsByParam = new Map<string, string>();
  for (const property of paramsExpression.properties) {
    if (ts.isShorthandPropertyAssignment(property)) {
      expressionsByParam.set(property.name.text, property.name.text);
      continue;
    }
    if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
      expressionsByParam.set(
        property.name.text,
        getSourceText(property.initializer, callSite, originalSource),
      );
      continue;
    }
    return undefined;
  }
  return expressionsByParam;
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
      const key = parseKey(source.slice(scan + 1, close));
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
      const key = parseKey(inner);
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
      const peekKey = parseKey(inner);
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

function parseKey(inner: string): string | undefined {
  const trimmed = inner.trimStart();
  const match = /^([\p{ID_Start}_$][\p{ID_Continue}$]*)/u.exec(trimmed);
  return match?.[1];
}

function getParamArgumentText(
  callSite: ParsedCallSite,
  nested: NestedReplacement[],
  originalSource: string,
): string | undefined {
  const paramsExpression = callSite.paramsExpression;
  if (!paramsExpression) {
    return undefined;
  }
  return interpolateNestedReplacements(
    getSourceText(paramsExpression, callSite, originalSource),
    remapOffset(paramsExpression.getStart(), callSite.fragment),
    nested,
  );
}

function getSourceText(
  node: ts.Node,
  callSite: ParsedCallSite,
  originalSource: string,
): string {
  return originalSource.slice(
    remapOffset(node.getStart(), callSite.fragment),
    remapOffset(node.getEnd(), callSite.fragment),
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
  if (!callSite.elisionContext) {
    return undefined;
  }
  if (placeholders.length > 0) {
    return undefined;
  }
  const { mode, range, attributeName } = callSite.elisionContext;
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
