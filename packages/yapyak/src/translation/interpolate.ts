import { resolveFormatter } from '../formatter';
import { warn } from '../warn';

export function interpolate(
  template: string,
  params: Record<string, unknown>,
  locale: string,
): string {
  let result = '';
  let index = 0;
  while (index < template.length) {
    const character = template[index];
    if (character === '{') {
      const end = findMatchingBraceIndex(template, index);
      const token = template.slice(index + 1, end);
      result += renderToken(token, params, locale);
      index = end + 1;
    } else {
      result += character;
      index++;
    }
  }
  return result;
}

function findMatchingBraceIndex(template: string, openIndex: number): number {
  let depth = 1;
  let index = openIndex + 1;
  while (index < template.length && depth > 0) {
    const character = template[index];
    if (character === '{') {
      depth++;
    } else if (character === '}') {
      depth--;
    }
    if (depth > 0) {
      index++;
    }
  }
  if (depth > 0) {
    throw new Error(
      `Unbalanced '{' at index ${openIndex} in interpolation template: missing closing '}'.`,
    );
  }
  return index;
}

function renderToken(
  token: string,
  params: Record<string, unknown>,
  locale: string,
): string {
  const firstComma = token.indexOf(',');
  if (firstComma === -1) {
    const name = token.trim();
    const value = params[name];
    return value === undefined ? '' : String(value);
  }
  const name = token.slice(0, firstComma).trim();
  const afterName = token.slice(firstComma + 1).trim();
  const secondComma = afterName.indexOf(',');
  const kind =
    secondComma === -1
      ? afterName.trim()
      : afterName.slice(0, secondComma).trim();
  const body =
    secondComma === -1 ? '' : afterName.slice(secondComma + 1).trim();
  const value = params[name];
  if (kind === 'plural') {
    return resolvePlural({
      body,
      count: Number(value),
      locale,
      params,
      type: 'cardinal',
    });
  }
  if (kind === 'selectordinal') {
    return resolvePlural({
      body,
      count: Number(value),
      locale,
      params,
      type: 'ordinal',
    });
  }
  if (kind === 'select') {
    return resolveSelect(body, String(value), params, locale);
  }
  if (kind === 'number') {
    return formatNumber(value, body, locale);
  }
  if (kind === 'date') {
    return formatDate(value, body, locale);
  }
  if (kind === 'time') {
    return formatTime(value, body, locale);
  }
  return value === undefined ? '' : String(value);
}

interface ResolvePluralInput {
  body: string;
  count: number;
  locale: string;
  params: Record<string, unknown>;
  type: 'cardinal' | 'ordinal';
}

function resolvePlural(input: ResolvePluralInput): string {
  const { body, count, locale, params, type } = input;
  const branches = parseBranches(body);
  const formattedCount = resolveFormatter(Intl.NumberFormat, locale, {}).format(
    count,
  );
  const exact = branches.get(`=${count}`);
  if (exact !== undefined) {
    return interpolate(
      exact.replace(/#/g, () => formattedCount),
      params,
      locale,
    );
  }
  const category = resolveFormatter(Intl.PluralRules, locale, { type }).select(
    count,
  );
  const branch = branches.get(category) ?? branches.get('other') ?? '';
  return interpolate(
    branch.replace(/#/g, () => formattedCount),
    params,
    locale,
  );
}

function resolveSelect(
  body: string,
  value: string,
  params: Record<string, unknown>,
  locale: string,
): string {
  const branches = parseBranches(body);
  const branch = branches.get(value) ?? branches.get('other') ?? '';
  return interpolate(branch, params, locale);
}

function parseBranches(body: string): Map<string, string> {
  const branches = new Map<string, string>();
  let index = 0;
  while (index < body.length) {
    while (index < body.length && /\s/.test(body[index] ?? '')) {
      index++;
    }
    if (index >= body.length) {
      break;
    }
    let nameEnd = index;
    while (
      nameEnd < body.length &&
      !/\s/.test(body[nameEnd] ?? '') &&
      body[nameEnd] !== '{'
    ) {
      nameEnd++;
    }
    const name = body.slice(index, nameEnd);
    index = nameEnd;
    while (index < body.length && body[index] !== '{') {
      index++;
    }
    if (body[index] !== '{') {
      break;
    }
    const end = findMatchingBraceIndex(body, index);
    branches.set(name, body.slice(index + 1, end));
    index = end + 1;
  }
  return branches;
}

type DateTimeStyle = 'short' | 'medium' | 'long' | 'full';

function parseDateTimeStyle(style: string): DateTimeStyle {
  const trimmed = style.trim();
  if (
    trimmed === 'short' ||
    trimmed === 'medium' ||
    trimmed === 'long' ||
    trimmed === 'full'
  ) {
    return trimmed;
  }
  return 'medium';
}

function parseNumberOptions(styleArgument: string): Intl.NumberFormatOptions {
  const trimmed = styleArgument.trim();
  if (trimmed === '' || trimmed === 'decimal') {
    return {};
  }
  if (trimmed === 'percent') {
    return { style: 'percent' };
  }
  if (trimmed === 'integer') {
    return { maximumFractionDigits: 0 };
  }
  if (trimmed.startsWith('currency')) {
    const currencyCode = trimmed.slice('currency'.length).trim();
    if (currencyCode !== '') {
      return { currency: currencyCode, style: 'currency' };
    }
  }
  warn(
    'Unknown number style — falling back to default formatting. Expected one of: decimal, percent, currency, integer.',
    { code: 'YPK_UNKNOWN_NUMBER_STYLE', received: trimmed },
  );
  return {};
}

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

function formatDate(value: unknown, body: string, locale: string): string {
  const date = toDate(value);
  if (date === undefined) {
    return '';
  }
  return resolveFormatter(Intl.DateTimeFormat, locale, {
    dateStyle: parseDateTimeStyle(body),
  }).format(date);
}

function formatTime(value: unknown, body: string, locale: string): string {
  const date = toDate(value);
  if (date === undefined) {
    return '';
  }
  return resolveFormatter(Intl.DateTimeFormat, locale, {
    timeStyle: parseDateTimeStyle(body),
  }).format(date);
}

function formatNumber(value: unknown, body: string, locale: string): string {
  if (value === undefined || value === null) {
    return '';
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }
  return resolveFormatter(
    Intl.NumberFormat,
    locale,
    parseNumberOptions(body),
  ).format(numericValue);
}
