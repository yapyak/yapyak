import type { AstroComponentFactory } from 'astro/runtime/server';
import type { RichTextHandler } from 'yapyak';

/**
 * Props for the `RichText` Astro component.
 *
 * @remarks
 * Each named tag found in `value` can be supplied via a prop of the same name with a {@link RichTextHandler}. A tag with no matching handler renders as its inner text. Tag names are not extracted at the type level — use the React or Svelte binding for static tag-checking.
 */
export type RichTextProps = {
  value: string;
  [tagName: string]: RichTextHandler | string;
};

/**
 * Renders rich text from a string with named tags into HTML, using handlers supplied by the caller as props.
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
