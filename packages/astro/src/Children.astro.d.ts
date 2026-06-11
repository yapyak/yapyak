import type { AstroComponentFactory } from 'astro/runtime/server';

/**
 * Marker for "render the matched tag's children here" inside a {@link RichText} named slot.
 *
 * @remarks
 * Has no props. Place exactly where the children should appear within the slot's element tree.
 *
 * @example
 * ```astro
 * <RichText value={t('Visit <link>the docs</link>.')}>
 *   <a slot="link" href="/docs"><Children /></a>
 * </RichText>
 * ```
 */
declare const Children: AstroComponentFactory;
export default Children;
