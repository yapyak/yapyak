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

export type { RichTextProps, TagHandler } from './rich-text';

export { locale } from './locale.svelte';
export { default as RichText } from './rich-text.svelte';
