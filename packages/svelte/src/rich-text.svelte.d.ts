import type { Component, Snippet } from 'svelte';
import type { TReturn } from 'yapyak';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

export type TagHandler = Snippet<[Snippet]>;

/**
 * Props for the `RichText` component. Carries the source `value` and a snippet
 * per named tag found in it.
 *
 * @typeParam T - The source string literal. Tag names are extracted from it.
 */
export type RichTextProps<T extends string> = { value: T } & {
  [Tag in TagsOf<T>]: TagHandler;
};

/**
 * Renders rich text from a string with named tags into snippets supplied by the
 * caller. See {@link RichTextProps} for the prop shape.
 *
 * @example
 * ```svelte
 * <RichText value={t('Click <link>here</link>.')}>
 *   {#snippet link(children)}
 *     <a href="/docs">{@render children()}</a>
 *   {/snippet}
 * </RichText>
 * ```
 */
declare const RichText: Component<RichTextProps<string>>;
export default RichText;
