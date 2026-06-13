/**
 * Svelte adapter for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/svelte
 * # or
 * pnpm add @yapyak/svelte
 * ```
 *
 * @packageDocumentation
 */

import './dev-store.svelte';

export type { RichTextProps } from './rich-text';

export { locale } from './locale.svelte';
export { default as RichText } from './rich-text.svelte';
