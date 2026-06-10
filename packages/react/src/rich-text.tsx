import type { ReactNode } from 'react';
import type { TReturn } from 'yapyak';

import { Fragment } from 'react';
import { walkRichText } from 'yapyak/internal';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

type TagHandler = (children: ReactNode) => ReactNode;

/**
 * Props for {@link RichText}. Carries the source `value` and a handler per
 * named tag found in it.
 *
 * @typeParam T - The source string literal. Tag names are extracted from it.
 */
export type RichTextProps<T extends string> = {
  value: T;
} & {
  [Tag in TagsOf<T>]: TagHandler;
};

/**
 * Renders rich text from a string with named tags into handlers supplied by
 * the caller as props. See {@link RichTextProps} for the prop shape.
 *
 * @example
 * ```tsx
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
    handlers as Record<string, TagHandler>,
    reactRenderer,
  );
}

const reactRenderer = {
  concat: (parts: ReactNode[]): ReactNode => {
    if (parts.length === 1) {
      return parts[0];
    }
    return parts.map((part, index) =>
      typeof part === 'string' ? (
        part
      ) : (
        // biome-ignore lint/suspicious/noArrayIndexKey: yap yap yap
        <Fragment key={index}>{part}</Fragment>
      ),
    );
  },
  leaf: (text: string): ReactNode => text,
};
