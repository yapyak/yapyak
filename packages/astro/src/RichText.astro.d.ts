import type { AstroComponentFactory } from 'astro/runtime/server';

/**
 * Props for {@link RichText}.
 *
 * @remarks
 * `value` carries the source string with `<tag>...</tag>` markers. Each tag is resolved by an Astro named slot of the same name; inside the slot, place a {@link Children} component where the matched tag's children should appear. A tag with no matching slot renders as escaped literal text.
 */
export type RichTextProps = {
  value: string;
};

/**
 * Renders rich text by resolving named tags via Astro slots.
 *
 * @remarks
 * Leaf text and unmatched tag names are HTML-escaped before they reach the output, so translator-produced strings cannot inject script or attribute payloads. Slot content is developer-authored and emitted verbatim around the escaped children.
 *
 * @example Render a translated string with a link tag
 * ```astro
 * ---
 * import { RichText, Children } from '@yapyak/astro';
 * import { t } from 'yapyak';
 * ---
 * <RichText value={t('Click <link>here</link>.')}>
 *   <a slot="link" href="/docs"><Children /></a>
 * </RichText>
 * ```
 */
declare const RichText: AstroComponentFactory;
export default RichText;
