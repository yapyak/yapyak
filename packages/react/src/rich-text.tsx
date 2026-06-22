import type { ReactNode } from 'react';
import type { TReturn } from 'yapyak';

import { Fragment } from 'react';
import { walkRichText } from 'yapyak/internal';

type PairsOf<T> = T extends TReturn<infer Pair, string> ? Pair : never;
type VoidsOf<T> = T extends TReturn<string, infer Void> ? Void : never;

type PairHandler = (children: ReactNode) => ReactNode;
type VoidHandler = () => ReactNode;

/**
 * Props for {@link RichText}. Carries the source `value` and a handler per named tag found in it.
 *
 * @shape RichTextProps<T extends string> = \{
 *   value: T,
 *   [pairTag]: (children: ReactNode) => ReactNode,
 *   [voidTag]: () => ReactNode,
 * \}
 *
 * @remarks
 * Pair tags (`<name>...</name>`) take a handler whose first argument is the rendered children. Void tags (`<name/>`) take a handler that receives no arguments — TypeScript rejects passing one for the other.
 *
 * @typeParam T - The source string literal. Tag names are extracted from it.
 */
export type RichTextProps<T extends string> = {
  /** The source string carrying named tags. */
  value: T;
} & {
  [Pair in PairsOf<T>]: PairHandler;
} & {
  [Void in VoidsOf<T>]: VoidHandler;
};

/**
 * Renders rich text from a string with named tags into handlers supplied by the caller as props.
 *
 * @remarks
 * See {@link RichTextProps} for the prop shape.
 *
 * @example
 * ```tsx
 * <RichText
 *   value={t('Click <link>here</link>.')}
 *   link={(children) => <a href="/docs">{children}</a>}
 * />
 * ```
 *
 * @example Void tag for a line break
 * ```tsx
 * <RichText
 *   value={t('First line<br/>second line')}
 *   br={() => <br />}
 * />
 * ```
 */
export function RichText<T extends string>(props: RichTextProps<T>): ReactNode {
  const { value, ...handlers } = props;
  return walkRichText<ReactNode>(
    value,
    handlers as Record<string, (children?: ReactNode) => ReactNode>,
    reactRenderer,
  );
}

const reactRenderer = {
  concat: (parts: ReactNode[]): ReactNode => {
    if (parts.length === 1) {
      return parts[0];
    }
    return parts.map((part, index) =>
      typeof part === 'string' ? part : <Fragment key={index}>{part}</Fragment>,
    );
  },
  leaf: (text: string): ReactNode => text,
};
