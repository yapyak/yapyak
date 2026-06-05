import type { Snippet } from 'svelte';
import type { TReturn } from 'yapyak';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

/**
 * The tag handler. Receives a `children` snippet for the resolved inner content.
 *
 * @remarks
 * Each snippet on {@link RichText} matching a tag in `value` has this signature.
 */
export type TagHandler = Snippet<[Snippet]>;

/**
 * Props for {@link RichText}.
 *
 * @remarks
 * Carries the source `value` and a snippet per named tag extracted from it.
 *
 * @typeParam T - The source string literal carrying the tag names.
 */
export type RichTextProps<T extends string> = { value: T } & {
  [Tag in TagsOf<T>]: TagHandler;
};
