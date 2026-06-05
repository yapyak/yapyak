/**
 * Astro binding for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install yapyak @yapyak/astro
 * # or
 * pnpm add yapyak @yapyak/astro
 * ```
 *
 * @packageDocumentation
 */

import _RichText from './RichText.astro';

export type { RichTextProps } from './RichText.astro';

/**
 * Renders rich text from a string with named tags into HTML, using handlers supplied by the caller as props.
 *
 * @remarks
 * Each named tag found in `value` can be supplied via a prop of the same name with a handler that receives the tag's inner content and returns the HTML to emit at that position. A tag with no matching handler renders as its inner text.
 *
 * @example Render a translated string with a `<link>` tag
 * ```astro
 * ---
 * import { RichText } from '@yapyak/astro';
 * import { t } from 'yapyak';
 * ---
 *
 * <RichText
 *   value={t('Click <link>here</link>.')}
 *   link={(children) => `<a href="/docs">${children}</a>`}
 * />
 * ```
 */
export const RichText: typeof _RichText = _RichText;
