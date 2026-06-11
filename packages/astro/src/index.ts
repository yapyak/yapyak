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

import _Children from './Children.astro';
import _RichText from './RichText.astro';

export type { RichTextProps } from './RichText.astro';

/**
 * Renders rich text by resolving named tags via Astro slots.
 *
 * @remarks
 * Each named tag found in `value` is matched against an Astro slot of the same name. Inside the slot, place a `<RichText.Children />` marker where the matched tag's children should appear. Translator output is HTML-escaped (`&`, `<`, `>`, `"`, `'`), safe for element content and quoted attribute values. Slot content itself is developer-authored — quote your attributes, as with React, Vue, and Lit.
 *
 * @example Render a translated string with a link tag
 * ```astro
 * ---
 * import { RichText } from '@yapyak/astro';
 * import { t } from 'yapyak';
 * ---
 *
 * <RichText value={t('Click <link>here</link>.')}>
 *   <a slot="link" href="/docs"><RichText.Children /></a>
 * </RichText>
 * ```
 */
export const RichText: typeof _RichText & {
  /**
   * Marker for "render the matched tag's children here" inside a {@link RichText} named slot.
   *
   * @remarks
   * Has no props. Place exactly where the children should appear within the slot's element tree.
   */
  // biome-ignore lint/style/useNamingConvention: yap yap yap
  Children: typeof _Children;
} = Object.assign(_RichText, {
  Children: _Children,
});
