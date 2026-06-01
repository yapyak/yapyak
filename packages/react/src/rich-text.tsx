import type { ReactNode } from 'react';
import type { TReturn } from 'yapyak';

import { Fragment } from 'react';
import { walkRichText } from 'yapyak/internal';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

type TagHandler = (children: ReactNode) => ReactNode;

export type RichTextProps<T extends string> = { source: T } & {
  [Tag in TagsOf<T>]: TagHandler;
};

export function RichText<T extends string>(props: RichTextProps<T>): ReactNode {
  const { source, ...handlers } = props;
  return walkRichText<ReactNode>(
    source,
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
        // biome-ignore lint/suspicious/noArrayIndexKey: needed
        <Fragment key={index}>{part}</Fragment>
      ),
    );
  },
  leaf: (text: string): ReactNode => text,
};
