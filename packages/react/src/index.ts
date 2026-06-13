/**
 * React adapter for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/react
 * # or
 * pnpm add @yapyak/react
 * ```
 *
 * @packageDocumentation
 */

import './dev-store';

export type { RichTextProps } from './rich-text';

export { useYapyak } from './dev-store';
export { RichText } from './rich-text';
export { useLocale } from './use-locale';
