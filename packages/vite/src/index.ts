/**
 * Vite plugin for compile-time i18n extraction and runtime translation.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/vite
 * # or
 * pnpm add @yapyak/vite
 * ```
 *
 * ## Setup
 *
 * Register the plugin in `vite.config.ts`.
 *
 * ```ts
 * import { yapyak } from '@yapyak/vite';
 * import { defineConfig } from 'vite';
 *
 * export default defineConfig({
 *   plugins: [yapyak()],
 * });
 * ```
 *
 * @packageDocumentation
 */

export type { YapyakOptions } from './options';

export { yapyak } from './plugin';
