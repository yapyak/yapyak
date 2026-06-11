import type { Snippet } from 'svelte';
import type { TReturn } from 'yapyak';

type PairsOf<T> = T extends TReturn<infer Pair, string> ? Pair : never;
type VoidsOf<T> = T extends TReturn<string, infer Void> ? Void : never;

/**
 * The pair-tag handler. Receives a `children` snippet for the resolved inner content.
 *
 * @remarks
 * Each pair-tag snippet on {@link RichText} matching a `<name>...</name>` tag in `value` has this signature.
 */
export type TagHandler = Snippet<
  [
    Snippet,
  ]
>;

/**
 * The void-tag handler. Receives no arguments.
 *
 * @remarks
 * Each void-tag snippet on {@link RichText} matching a `<name/>` tag in `value` has this signature.
 */
export type VoidHandler = Snippet<[]>;

/**
 * Props for {@link RichText}.
 *
 * @remarks
 * Carries the source `value` and a snippet per named tag extracted from it. Pair tags take a {@link TagHandler}, void tags take a {@link VoidHandler}.
 *
 * @typeParam T - The source string literal carrying the tag names.
 */
export type RichTextProps<T extends string> = {
  value: T;
} & {
  [Pair in PairsOf<T>]: TagHandler;
} & {
  [Void in VoidsOf<T>]: VoidHandler;
};
