import type { Snippet } from 'svelte';
import type { TReturn } from 'yapyak';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

/**
 * Handler for a single named tag in a rich-text string.
 *
 * @remarks
 * Receives a `children` snippet for the resolved inner content. Each snippet on `<RichText>` matching a tag in `value` has this signature.
 */
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
