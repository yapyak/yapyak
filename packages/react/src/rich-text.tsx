import type { ReactNode } from 'react';
import type { TReturn } from 'yapyak';

import { Fragment } from 'react';
import { walkRichText } from 'yapyak/internal';

type PairsOf<T> = T extends TReturn<infer Pair, string> ? Pair : never;
type VoidsOf<T> = T extends TReturn<string, infer Void> ? Void : never;

type PairFn = (children: ReactNode) => ReactNode;
type VoidFn = () => ReactNode;

/**
 * Props for {@link RichText}.
 *
 * @shape RichTextProps<T extends string> = \{
 *   value: T,
 *   [pairTag]: (children: ReactNode) => ReactNode,
 *   [voidTag]: () => ReactNode,
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

/**
 * Renders rich text by binding each named tag to a handler prop.
 *
 * @example
 * ```tsx
 * import { RichText } from '@yapyak/react';
 * import { t } from 'yapyak';
 *
 * <RichText
 *   value={t('Click <link>here</link>.')}
 *   link={(children) => <a href="/docs">{children}</a>}
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
