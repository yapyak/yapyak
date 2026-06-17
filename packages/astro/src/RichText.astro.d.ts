import type { AstroComponentFactory } from 'astro/runtime/server';

/**
 * Props for {@link RichText}.
 *
 * @remarks
 * `value` carries the source string with `<tag>...</tag>` markers. Each tag is resolved by an Astro named slot of the same name; inside the slot, place a `<RichText.Children />` marker where the matched tag's children should appear. A tag with no matching slot renders as escaped literal text.
 */
export type RichTextProps = {
  value: string;
};

/**
 * Renders rich text by resolving named tags via Astro slots.
 *
 * @remarks
 * Translator output is HTML-escaped (`&`, `<`, `>`, `"`, `'`), safe for element content and quoted attribute values. Slot content itself is developer-authored — quote your attributes, as with React, Vue, and Lit.
 *
 * @example Render a translated string with a link tag
 * ```astro
 * ---
 * import { RichText } from '@yapyak/astro';
 * import { t } from 'yapyak';
 * ---
 * <RichText value={t('Click <link>here</link>.')}>
 *   <a slot="link" href="/docs"><RichText.Children /></a>
 * </RichText>
 * ```
 */
declare const RichText: AstroComponentFactory;
export default RichText;
