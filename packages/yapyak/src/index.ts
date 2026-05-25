/**
 * Runtime API for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install yapyak
 * # or
 * pnpm add yapyak
 * ```
 *
 * @packageDocumentation
 */

import { LOCALES } from '@yapyak/runtime';

export { defaultLocale, getLocale, locales, setLocale } from './locale';
export { $t } from './translation';

if (process.env.NODE_ENV !== 'production' && LOCALES.length === 0) {
  console.warn(
    '[yapyak] yapyak runtime not initialized — register the build-tool plugin (@yapyak/vite or equivalent) in your bundler config.',
  );
}
