import type { ResolvedPersistence } from './normalize-persistence.js';

export interface GenerateIntlModuleOptions {
  acceptLanguage: boolean;
  adapter: 'tanstackStart' | 'sveltekit' | null;
  defaultLocale: string;
  overlay: boolean;
  framework: 'react' | 'vue' | 'svelte' | null;
  locales: string[];
  moduleName: string;
  persistence: ResolvedPersistence;
  syncHtmlLang: boolean;
}

export function generateIntlModule(options: GenerateIntlModuleOptions): string {
  const {
    acceptLanguage,
    adapter,
    defaultLocale,
    overlay,
    framework,
    locales,
    persistence,
    syncHtmlLang,
  } = options;
  const lines: string[] = [];
  const isCookie = persistence.type === 'cookie';
  const isLocalStorage = persistence.type === 'localStorage';

  const importSource =
    framework === 'vue'
      ? 'yapyak/vue'
      : framework === 'svelte'
        ? 'yapyak/svelte'
        : framework === 'react'
          ? 'yapyak/react'
          : 'yapyak';
  const intlFactory = framework === null ? 'createRuntime' : 'createIntl';

  const imports: string[] = [intlFactory];
  if (acceptLanguage) {
    imports.push('parseAcceptLanguage');
  }
  if (isCookie) {
    imports.push('parseCookie', 'serializeCookie');
  }
  lines.push(`import { ${imports.join(', ')} } from '${importSource}';`);
  if (isCookie) {
    lines.push(
      `import { getRequestSource, setRequestSource } from 'yapyak/server';`,
    );
  }

  lines.push('');
  if (adapter === 'tanstackStart') {
    lines.push(`if (import.meta.env.SSR) {`);
    lines.push(
      `  const { getRequestHeaders } = await import('@tanstack/react-start/server');`,
    );
    lines.push(`  setRequestSource(() => getRequestHeaders());`);
    lines.push(`}`);
  } else if (adapter === 'sveltekit') {
    lines.push(`if (import.meta.env.SSR) {`);
    lines.push(`  const { getRequestEvent } = await import('$app/server');`);
    lines.push(`  setRequestSource(() => getRequestEvent().request.headers);`);
    lines.push(`}`);
  }
  lines.push('');

  lines.push(`const LOCALES = ${JSON.stringify(locales)};`);
  lines.push(`const DEFAULT_LOCALE = ${JSON.stringify(defaultLocale)};`);
  if (persistence.type === 'cookie') {
    lines.push(`const COOKIE_NAME = ${JSON.stringify(persistence.name)};`);
  }
  if (persistence.type === 'localStorage') {
    lines.push(`const STORAGE_KEY = ${JSON.stringify(persistence.key)};`);
  }
  lines.push('');

  lines.push(`function detectLocale() {`);
  if (isCookie) {
    lines.push(`  const cookieString = readCookieString();`);
    lines.push(`  if (cookieString) {`);
    lines.push(
      `    const fromCookie = parseCookie(cookieString, COOKIE_NAME);`,
    );
    lines.push(`    if (fromCookie && LOCALES.includes(fromCookie)) {`);
    lines.push(`      return fromCookie;`);
    lines.push(`    }`);
    lines.push(`  }`);
  }
  if (isLocalStorage) {
    lines.push(`  if (typeof localStorage !== 'undefined') {`);
    lines.push(`    try {`);
    lines.push(`      const stored = localStorage.getItem(STORAGE_KEY);`);
    lines.push(`      if (stored && LOCALES.includes(stored)) {`);
    lines.push(`        return stored;`);
    lines.push(`      }`);
    lines.push(`    } catch {}`);
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

  if (isCookie) {
    lines.push(`function readCookieString() {`);
    lines.push(`  if (typeof document !== 'undefined') {`);
    lines.push(`    return document.cookie;`);
    lines.push(`  }`);
    lines.push(`  const headers = getRequestSource();`);
    lines.push(`  return headers?.get?.('cookie') ?? '';`);
    lines.push(`}`);
    lines.push('');
  }

  if (acceptLanguage) {
    lines.push(`function readAcceptLanguageHeader() {`);
    lines.push(`  if (typeof navigator !== 'undefined') {`);
    lines.push(`    return navigator.language ?? '';`);
    lines.push(`  }`);
    if (isCookie) {
      lines.push(`  const headers = getRequestSource();`);
      lines.push(`  return headers?.get?.('accept-language') ?? '';`);
    } else {
      lines.push(`  return '';`);
    }
    lines.push(`}`);
    lines.push('');
  }

  lines.push(`const intl = ${intlFactory}({`);
  lines.push(`  defaultLocale: DEFAULT_LOCALE,`);
  lines.push(`  detectLocale,`);
  lines.push(`  locales: LOCALES,`);
  lines.push(`  loader: async () => ({}),`);
  lines.push(`});`);
  lines.push('');

  lines.push(`function setLocale(locale) {`);
  if (isCookie) {
    lines.push(`  if (typeof document !== 'undefined') {`);
    lines.push(`    document.cookie = serializeCookie(COOKIE_NAME, locale);`);
    lines.push(`  }`);
  }
  if (isLocalStorage) {
    lines.push(`  if (typeof localStorage !== 'undefined') {`);
    lines.push(
      `    try { localStorage.setItem(STORAGE_KEY, locale); } catch {}`,
    );
    lines.push(`  }`);
  }
  lines.push(`  intl.setLocaleSync(locale, {});`);
  lines.push(`}`);
  lines.push('');

  lines.push(`function syncHtmlLang() {`);
  lines.push(`  if (typeof document === 'undefined') return () => {};`);
  lines.push(`  document.documentElement.lang = intl.getLocale();`);
  lines.push(`  return intl.subscribe(() => {`);
  lines.push(`    document.documentElement.lang = intl.getLocale();`);
  lines.push(`  });`);
  lines.push(`}`);
  lines.push('');

  if (syncHtmlLang) {
    lines.push(`syncHtmlLang();`);
    lines.push('');
  }

  if (overlay) {
    lines.push(`if (import.meta.env.DEV && typeof document !== 'undefined') {`);
    lines.push(`  if (!window.__yapyakSeen) {`);
    lines.push(`    const seen = new Set();`);
    lines.push(`    const origAdd = seen.add.bind(seen);`);
    lines.push(`    seen.add = (v) => {`);
    lines.push(`      const had = seen.has(v);`);
    lines.push(`      origAdd(v);`);
    lines.push(
      `      if (!had) window.dispatchEvent(new CustomEvent('yapyak:seen-changed'));`,
    );
    lines.push(`      return seen;`);
    lines.push(`    };`);
    lines.push(`    seen.clear = () => {`);
    lines.push(`      Set.prototype.clear.call(seen);`);
    lines.push(
      `      window.dispatchEvent(new CustomEvent('yapyak:seen-changed'));`,
    );
    lines.push(`    };`);
    lines.push(`    window.__yapyakSeen = seen;`);
    lines.push(`    const reset = () => seen.clear();`);
    lines.push(`    window.addEventListener('popstate', reset);`);
    lines.push(`    for (const method of ['pushState', 'replaceState']) {`);
    lines.push(`      const original = history[method];`);
    lines.push(`      history[method] = function (...args) {`);
    lines.push(`        const result = original.apply(this, args);`);
    lines.push(`        reset();`);
    lines.push(`        return result;`);
    lines.push(`      };`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push(
      `  window.__yapyakNotify = () => intl.setLocaleSync(intl.getLocale(), {});`,
    );
    lines.push(`  window.__yapyakLocales = LOCALES;`);
    lines.push(`  window.__yapyakGetLocale = () => intl.getLocale();`);
    lines.push(
      `  window.__yapyakSetPreview = (locale) => intl.setPreviewLocale(locale);`,
    );
    lines.push(`  window.__yapyakSubscribe = intl.subscribe;`);
    lines.push(`  const id = '__yapyak-overlay';`);
    lines.push(`  if (!document.getElementById(id)) {`);
    lines.push(`    const s = document.createElement('script');`);
    lines.push(`    s.id = id;`);
    lines.push(`    s.src = '/.yapyak/overlay.js';`);
    lines.push(`    s.async = true;`);
    lines.push(
      `    document.body ? document.body.appendChild(s) : document.documentElement.appendChild(s);`,
    );
    lines.push(`  }`);
    lines.push(`}`);
    lines.push('');
  }

  lines.push(`function t(source) { return source; }`);
  lines.push('');

  if (framework === null) {
    lines.push(`export const getLocale = intl.getLocale;`);
    lines.push(`export const subscribe = intl.subscribe;`);
    lines.push(`export { setLocale, syncHtmlLang, t };`);
    lines.push(`export default intl;`);
  } else if (framework === 'svelte') {
    lines.push(`const locale = {`);
    lines.push(`  get current() { return intl.locale.current; },`);
    lines.push(`  set current(next) { void setLocale(next); },`);
    lines.push(`};`);
    lines.push('');
    lines.push(`function getLocale() { return intl.locale.current; }`);
    lines.push('');
    lines.push(`export { getLocale, locale, setLocale, syncHtmlLang, t };`);
    lines.push(`export default intl;`);
  } else if (framework === 'vue') {
    lines.push(`import { computed, ref } from 'vue';`);
    lines.push(`const _localeRef = ref(intl.getLocale());`);
    lines.push(
      `intl.subscribe(() => { _localeRef.value = intl.getLocale(); });`,
    );
    lines.push(`function getLocale() { return _localeRef.value; }`);
    lines.push('');
    lines.push(`const baseUseLocale = intl.useLocale;`);
    lines.push(`function useLocale() {`);
    lines.push(`  const baseRef = baseUseLocale();`);
    lines.push(`  return computed({`);
    lines.push(`    get: () => baseRef.value,`);
    lines.push(`    set: (next) => { void setLocale(next); },`);
    lines.push(`  });`);
    lines.push(`}`);
    lines.push('');
    lines.push(`export const yapyak = intl;`);
    lines.push(`export { getLocale, setLocale, syncHtmlLang, t, useLocale };`);
    lines.push(`export default intl;`);
  } else {
    lines.push(`const baseUseLocale = intl.useLocale;`);
    lines.push(`function useLocale() {`);
    lines.push(`  const [locale] = baseUseLocale();`);
    lines.push(`  return [locale, setLocale];`);
    lines.push(`}`);
    lines.push('');
    lines.push(`export const IntlProvider = intl.IntlProvider;`);
    lines.push(`export const getLocale = intl.getLocale;`);
    lines.push(`export { setLocale, syncHtmlLang, t, useLocale };`);
    lines.push(`export default intl;`);
  }

  return lines.join('\n');
}
