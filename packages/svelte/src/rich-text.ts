import type { Snippet } from 'svelte';
import type { TReturn } from 'yapyak';

type PairsOf<T> = T extends TReturn<infer Pair, string> ? Pair : never;
type VoidsOf<T> = T extends TReturn<string, infer Void> ? Void : never;

export type PairFn = Snippet<
  [
    Snippet,
  ]
>;

export type VoidFn = Snippet<[]>;

/**
 * Props for {@link RichText}.
 *
 * @shape RichTextProps<T extends string> = \{
 *   value: T,
 *   [pairTag]: Snippet<[Snippet]>,
 *   [voidTag]: Snippet<[]>,
 * \}
 *
 * @typeParam T - The source string literal.
 */
export type RichTextProps<T extends string> = {
  /** The source string. */
  value: T;
} & {
  [Pair in PairsOf<T>]: PairFn;
} & {
  [Void in VoidsOf<T>]: VoidFn;
};
