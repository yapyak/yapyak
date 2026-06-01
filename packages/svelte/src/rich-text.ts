import type { Snippet } from 'svelte';
import type { TReturn } from 'yapyak';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

type Handler = Snippet<[Snippet]>;

/**
 * Props for the `RichText` component. Carries the source `value` and a snippet
 * per named tag found in it.
 *
 * @typeParam T - The source string literal. Tag names are extracted from it.
 */
export type RichTextProps<T extends string> = { value: T } & {
  [Tag in TagsOf<T>]: Handler;
};
