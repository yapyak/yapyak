/**
 * Runtime entry point for yapyak. Exports the `$t` macro fallback and the locale store.
 *
 * Advanced consumers reach for separate packages: `@yapyak/adapter` (server SSR primitives), `@yapyak/translator` (custom translator toolkit), `@yapyak/compiler` (build-time extraction).
 *
 * @packageDocumentation
 */

export { defaultLocale, getLocale, locales, setLocale } from './locale';
export { $t } from './translation';
