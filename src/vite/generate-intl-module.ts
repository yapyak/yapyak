export interface GenerateIntlModuleOptions {
  acceptLanguage: boolean;
  cookie: string | undefined;
  defaultLocale: string;
  framework: 'react' | 'vue' | 'svelte';
  hasTanStack: boolean;
  locales: string[];
  moduleName: string;
}

export function generateIntlModule(options: GenerateIntlModuleOptions): string {
  const {
    acceptLanguage,
    cookie,
    defaultLocale,
    framework,
    hasTanStack,
    locales,
    moduleName,
  } = options;
  const lines: string[] = [];
  const adapter =
    framework === 'vue'
      ? 'yapyak/vue'
      : framework === 'svelte'
        ? 'yapyak/svelte'
        : 'yapyak/react';

  lines.push(
    `import { createIntl, parseAcceptLanguage, parseCookie, serializeCookie } from '${adapter}';`,
  );
  for (const locale of locales) {
    lines.push(`import _${locale} from '${moduleName}/locale-${locale}';`);
  }

  if (hasTanStack) {
    lines.push('');
    lines.push(`let _getRequestHeaders;`);
    lines.push(`if (import.meta.env.SSR) {`);
    lines.push(
      `  const _server = await import('@tanstack/react-start/server');`,
    );
    lines.push(`  _getRequestHeaders = _server.getRequestHeaders;`);
    lines.push(`}`);
  }

  lines.push('');
  lines.push(`const messages = {`);
  for (const locale of locales) {
    lines.push(`  ${JSON.stringify(locale)}: _${locale},`);
  }
  lines.push(`};`);
  lines.push('');
  lines.push(`const LOCALES = ${JSON.stringify(locales)};`);
  lines.push(`const DEFAULT_LOCALE = ${JSON.stringify(defaultLocale)};`);
  if (cookie) {
    lines.push(`const COOKIE_NAME = ${JSON.stringify(cookie)};`);
  }
  lines.push('');

  lines.push(`function detectLocale() {`);
  if (cookie) {
    lines.push(`  const cookieString = readCookieString();`);
    lines.push(`  if (cookieString) {`);
    lines.push(`    const fromCookie = parseCookie(cookieString, COOKIE_NAME);`);
    lines.push(`    if (fromCookie && LOCALES.includes(fromCookie)) {`);
    lines.push(`      return fromCookie;`);
    lines.push(`    }`);
    lines.push(`  }`);
  }
  if (acceptLanguage) {
    lines.push(`  const acceptHeader = readAcceptLanguageHeader();`);
    lines.push(`  if (acceptHeader) {`);
    lines.push(
      `    const fromAccept = parseAcceptLanguage(acceptHeader, LOCALES);`,
    );
    lines.push(`    if (fromAccept) {`);
    lines.push(`      return fromAccept;`);
    lines.push(`    }`);
    lines.push(`  }`);
  }
  lines.push(`  return DEFAULT_LOCALE;`);
  lines.push(`}`);
  lines.push('');

  lines.push(`function readCookieString() {`);
  lines.push(`  if (typeof document !== 'undefined') {`);
  lines.push(`    return document.cookie;`);
  lines.push(`  }`);
  if (hasTanStack) {
    lines.push(`  if (_getRequestHeaders) {`);
    lines.push(`    try {`);
    lines.push(`      const headers = _getRequestHeaders();`);
    lines.push(`      return headers?.get?.('cookie') ?? '';`);
    lines.push(`    } catch {`);
    lines.push(`      return '';`);
    lines.push(`    }`);
    lines.push(`  }`);
  }
  lines.push(`  return '';`);
  lines.push(`}`);
  lines.push('');

  lines.push(`function readAcceptLanguageHeader() {`);
  lines.push(`  if (typeof navigator !== 'undefined') {`);
  lines.push(`    return navigator.language ?? '';`);
  lines.push(`  }`);
  if (hasTanStack && acceptLanguage) {
    lines.push(`  if (_getRequestHeaders) {`);
    lines.push(`    try {`);
    lines.push(`      const headers = _getRequestHeaders();`);
    lines.push(`      return headers?.get?.('accept-language') ?? '';`);
    lines.push(`    } catch {`);
    lines.push(`      return '';`);
    lines.push(`    }`);
    lines.push(`  }`);
  }
  lines.push(`  return '';`);
  lines.push(`}`);
  lines.push('');

  lines.push(`const intl = createIntl({`);
  lines.push(`  defaultLocale: DEFAULT_LOCALE,`);
  lines.push(`  detectLocale,`);
  lines.push(`  locales: LOCALES,`);
  lines.push(`  loader: async (locale) => messages[locale] ?? {},`);
  lines.push(`  messages,`);
  lines.push(`});`);
  lines.push('');

  lines.push(`async function setLocale(locale) {`);
  if (cookie) {
    lines.push(`  if (typeof document !== 'undefined') {`);
    lines.push(`    document.cookie = serializeCookie(COOKIE_NAME, locale);`);
    lines.push(`  }`);
  }
  lines.push(`  intl.setLocaleSync(locale, messages[locale] ?? {});`);
  lines.push(`}`);
  lines.push('');

  if (framework === 'svelte') {
    lines.push(`const locale = {`);
    lines.push(`  get current() { return intl.locale.current; },`);
    lines.push(`  set current(next) { void setLocale(next); },`);
    lines.push(`};`);
    lines.push('');
    lines.push(`export const t = intl.t;`);
    lines.push(`export const getLocale = intl.getLocale;`);
    lines.push(`export { locale, messages, setLocale };`);
    lines.push(`export default intl;`);
  } else if (framework === 'vue') {
    lines.push(`import { computed } from 'vue';`);
    lines.push(`const baseUseLocale = intl.useLocale;`);
    lines.push(`function useLocale() {`);
    lines.push(`  const baseRef = baseUseLocale();`);
    lines.push(`  return computed({`);
    lines.push(`    get: () => baseRef.value,`);
    lines.push(`    set: (next) => { void setLocale(next); },`);
    lines.push(`  });`);
    lines.push(`}`);
    lines.push('');
    lines.push(`export const t = intl.t;`);
    lines.push(`export const yapyak = intl;`);
    lines.push(`export const getLocale = intl.getLocale;`);
    lines.push(`export { messages, setLocale, useLocale };`);
    lines.push(`export default intl;`);
  } else {
    lines.push(`const baseUseLocale = intl.useLocale;`);
    lines.push(`function useLocale() {`);
    lines.push(`  const [locale] = baseUseLocale();`);
    lines.push(`  return [locale, setLocale];`);
    lines.push(`}`);
    lines.push('');

    lines.push(`export const t = intl.t;`);
    lines.push(`export const IntlProvider = intl.IntlProvider;`);
    lines.push(`export const useTranslation = intl.useTranslation;`);
    lines.push(`export const getLocale = intl.getLocale;`);
    lines.push(`export { messages, setLocale, useLocale };`);
    lines.push(`export default intl;`);
  }

  return lines.join('\n');
}
