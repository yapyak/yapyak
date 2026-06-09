import type { TReturn } from './t';

import { walkRichText } from './rich-text-walker';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

/**
 * The rich-text handler.
 *
 * @remarks
 * Receives the recursively-rendered children of the tag (the concatenated output of inner handlers, or the raw text when no nested tags exist) and returns the rendered string. The shape used by every entry of a {@link RichTextHandlers} object.
 */
export type RichTextHandler = (children: string) => string;

/**
 * The rich-text handlers. Maps tag names extracted from `T` to their {@link RichTextHandler}.
 *
 * @typeParam T - The source string literal carrying the tag names.
 */
export type RichTextHandlers<T extends string> = {
  [Tag in TagsOf<T>]: RichTextHandler;
};

/**
 * Renders a rich-text string by resolving `<tag>...</tag>` markers via handlers.
 *
 * @remarks
 * The string-side counterpart to the framework `<RichText>` components in `@yapyak/react`, `@yapyak/vue`, `@yapyak/svelte`, and `@yapyak/astro`. When `value` comes from {@link t}, the handlers object is statically checked against the tag names found in the source.
 *
 * @typeParam T - The source string literal carrying the tag names.
 *
 * @param value - The string to render. May contain `<tag>...</tag>` markers.
 * @param handlers - A handler per tag name.
 *
 * @example
 * ```ts
 * import { richText, t } from 'yapyak';
 *
 * const html = richText(
 *   t('Read the <link>documentation</link> to get started.'),
 *   { link: (children) => `<a href="/docs">${children}</a>` },
 * );
 * ```
 */
export function richText<T extends string>(
  value: T,
  handlers: RichTextHandlers<T>,
): string {
  return walkRichText<string>(
    value,
    handlers as Record<string, RichTextHandler>,
    stringRenderer,
  );
}

const stringRenderer = {
  concat: (parts: string[]): string => parts.join(''),
  leaf: (text: string): string => text,
};
