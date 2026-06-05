import type { AstroComponentFactory } from 'astro/runtime/server';
import type { RichTextHandler } from 'yapyak';

/**
 * Props for {@link RichText}.
 *
 * @remarks
 * Each named tag found in `value` is matched against a prop of the same name carrying a {@link RichTextHandler}. A tag with no matching handler renders as its inner text. Tag names are not extracted at the type level — the React or Svelte binding provides static tag-checking.
 */
export interface RichTextProps {
  value: string;
  [tagName: string]: RichTextHandler | string;
}

/**
 * Renders rich text by resolving named tags via handler props.
 *
 * @example Render a translated string with a `<link>` tag
 * ```astro
 * <RichText
 *   value={t('Click <link>here</link>.')}
 *   link={(children) => `<a href="/docs">${children}</a>`}
 * />
 * ```
 */
declare const RichText: AstroComponentFactory;
export default RichText;
