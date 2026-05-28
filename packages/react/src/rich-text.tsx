import type { ReactNode } from 'react';
import type { TReturn } from 'yapyak';

import { Fragment } from 'react';

type TagsOf<T> = T extends TReturn<infer Tags> ? Tags : never;

type TagHandler = (children: ReactNode) => ReactNode;

export type RichTextProps<T extends string> = { value: T } & {
  [Tag in TagsOf<T>]: TagHandler;
};

export function RichText<T extends string>(props: RichTextProps<T>): ReactNode {
  const { value, ...handlers } = props;
  return renderTags(value, handlers as Record<string, TagHandler>);
}

function renderTags(
  source: string,
  handlers: Record<string, TagHandler>,
): ReactNode {
  const nodes: ReactNode[] = [];
  let text = '';
  let index = 0;
  let key = 0;
  const flush = (): void => {
    if (text !== '') {
      nodes.push(text);
      text = '';
    }
  };
  while (index < source.length) {
    const open = source.startsWith('<', index)
      ? readOpenTag(source, index)
      : undefined;
    const handler = open ? handlers[open.name] : undefined;
    if (open && handler) {
      const close = findClosingTag(source, open.end, open.name);
      if (close) {
        flush();
        const inner = renderTags(source.slice(open.end, close.start), handlers);
        nodes.push(<Fragment key={key}>{handler(inner)}</Fragment>);
        key += 1;
        index = close.end;
        continue;
      }
    }
    text += source[index];
    index += 1;
  }
  flush();
  return nodes.length === 1 ? nodes[0] : nodes;
}

function readOpenTag(
  source: string,
  index: number,
): { name: string; end: number } | undefined {
  const close = source.indexOf('>', index + 1);
  if (close === -1) {
    return undefined;
  }
  const name = source.slice(index + 1, close);
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
    return undefined;
  }
  return { end: close + 1, name };
}

function findClosingTag(
  source: string,
  from: number,
  name: string,
): { start: number; end: number } | undefined {
  const open = `<${name}>`;
  const close = `</${name}>`;
  let depth = 1;
  let index = from;
  while (index < source.length) {
    if (source.startsWith(close, index)) {
      depth -= 1;
      if (depth === 0) {
        return { end: index + close.length, start: index };
      }
      index += close.length;
      continue;
    }
    if (source.startsWith(open, index)) {
      depth += 1;
      index += open.length;
      continue;
    }
    index += 1;
  }
  return undefined;
}
