export function hasPlaceholder(template: string): boolean {
  return template.includes('{') && template.includes('}');
}

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
      const end = findMatchingBrace(template, index);
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

function findMatchingBrace(template: string, openIndex: number): number {
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
    return resolvePlural(body, Number(value), params, locale, 'cardinal');
  }
  if (kind === 'selectordinal') {
    return resolvePlural(body, Number(value), params, locale, 'ordinal');
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

function resolvePlural(
  body: string,
  count: number,
  params: Record<string, unknown>,
  locale: string,
  type: 'cardinal' | 'ordinal',
): string {
  const branches = parseBranches(body);
  const exact = branches.get(`=${count}`);
  if (exact !== undefined) {
    return interpolate(exact.replace(/#/g, String(count)), params, locale);
  }
  const category = pluralCategory(locale, count, type);
  const branch = branches.get(category) ?? branches.get('other') ?? '';
  return interpolate(branch.replace(/#/g, String(count)), params, locale);
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
    const end = findMatchingBrace(body, index);
    branches.set(name, body.slice(index + 1, end));
    index = end + 1;
  }
  return branches;
}

const pluralRulesCache = new Map<string, Intl.PluralRules>();

function pluralCategory(
  locale: string,
  count: number,
  type: 'cardinal' | 'ordinal',
): string {
  const cacheKey = `${locale}:${type}`;
  let rules = pluralRulesCache.get(cacheKey);
  if (rules === undefined) {
    rules = new Intl.PluralRules(locale, { type });
    pluralRulesCache.set(cacheKey, rules);
  }
  return rules.select(count);
}

const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();

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

function getDateFormatter(
  locale: string,
  styleArgument: string,
): Intl.DateTimeFormat {
  const style = parseDateTimeStyle(styleArgument);
  const cacheKey = `date:${locale}:${style}`;
  let formatter = dateTimeFormatCache.get(cacheKey);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: style });
    dateTimeFormatCache.set(cacheKey, formatter);
  }
  return formatter;
}

function getTimeFormatter(
  locale: string,
  styleArgument: string,
): Intl.DateTimeFormat {
  const style = parseDateTimeStyle(styleArgument);
  const cacheKey = `time:${locale}:${style}`;
  let formatter = dateTimeFormatCache.get(cacheKey);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(locale, { timeStyle: style });
    dateTimeFormatCache.set(cacheKey, formatter);
  }
  return formatter;
}

function getNumberFormatter(
  locale: string,
  styleArgument: string,
): Intl.NumberFormat {
  const cacheKey = `number:${locale}:${styleArgument}`;
  let formatter = numberFormatCache.get(cacheKey);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(
      locale,
      parseNumberOptions(styleArgument),
    );
    numberFormatCache.set(cacheKey, formatter);
  }
  return formatter;
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
    const currencyCode = trimmed.slice('currency'.length).trim() || 'USD';
    return { currency: currencyCode, style: 'currency' };
  }
  return {};
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function formatDate(value: unknown, body: string, locale: string): string {
  const date = toDate(value);
  if (date === null) {
    return '';
  }
  return getDateFormatter(locale, body).format(date);
}

function formatTime(value: unknown, body: string, locale: string): string {
  const date = toDate(value);
  if (date === null) {
    return '';
  }
  return getTimeFormatter(locale, body).format(date);
}

function formatNumber(value: unknown, body: string, locale: string): string {
  if (value === undefined || value === null) {
    return '';
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }
  return getNumberFormatter(locale, body).format(numericValue);
}
