import type { TReturn } from './t';

import { walkRichText } from './rich-text-walker';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

/**
 * Handler for a single named tag in a rich-text string.
 *
 * @remarks
 * Receives the resolved text between the tag's opening and closing markers and returns the rendered string. The shape used by every entry of a `richText()` handlers object.
 */
export type RichTextHandler = (children: string) => string;

export type RichTextHandlers<T extends string> = {
  [Tag in TagsOf<T>]: RichTextHandler;
};

/**
 * Resolves `<tag>...</tag>` markers in a string by calling the matching handler
 * for each tag. Returns a string. The string-side counterpart to the
 * framework-specific `<RichText>` components in `@yapyak/react`, `@yapyak/vue`,
 * and `@yapyak/svelte`.
 *
 * When the value comes from `t()`, the handlers object is statically checked
 * against the tag names found in the source.
 *
 * @param value - The string to render. May contain `<tag>...</tag>` markers.
 * @param handlers - A handler per tag name. Each handler receives the resolved
 *   text between the tags and returns the rendered string.
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
