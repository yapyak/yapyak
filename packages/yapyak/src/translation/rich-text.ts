/**
 * The rich text node. Holds either a plain-text leaf, a tag wrapping recursively-parsed children, or a void tag carrying no children.
 */
export type RichTextNode =
  | {
      type: 'tag';
      name: string;
      children: RichTextNode[];
    }
  | {
      type: 'void';
      name: string;
    }
  | {
      type: 'text';
      text: string;
    };

/**
 * Parses a source string with `<tag>` markers into a tree of {@link RichTextNode}.
 *
 * @remarks
 * The primitive behind every framework `<RichText>` component. Use directly when building a non-framework rendering target — server-rendered HTML emails, plain-text fallbacks, custom string formats, or a renderer for a framework yapyak does not ship.
 *
 * Tag names must match `[A-Za-z][A-Za-z0-9]*`. Tags with attributes and tags whose matching close marker is missing are not parsed and remain in the surrounding text as-is. Self-closing tags parse as `void` nodes that carry no children — both `<name/>` and `<name />` (with whitespace before the slash) are accepted; tag names have no HTML semantics, so the unslashed form `<name>` is always a pair opener.
 *
 * @param source - The source string.
 *
 * @example Parse a translated string
 * ```ts
 * import { parseRichText, t } from 'yapyak';
 *
 * parseRichText(t('Click <link>here</link>.'));
 * // => [
 * //   { type: 'text', text: 'Click ' },
 * //   { type: 'tag', name: 'link', children: [{ type: 'text', text: 'here' }] },
 * //   { type: 'text', text: '.' },
 * // ]
 * ```
 *
 * @example Parse a void tag
 * ```ts
 * import { parseRichText } from 'yapyak';
 *
 * parseRichText('First<br/>Second');
 * // => [
 * //   { type: 'text', text: 'First' },
 * //   { type: 'void', name: 'br' },
 * //   { type: 'text', text: 'Second' },
 * // ]
 * ```
 *
 * @example Build a plain-text renderer
 * ```ts
 * import { parseRichText, type RichTextNode } from 'yapyak';
 *
 * function toPlain(nodes: RichTextNode[]): string {
 *   return nodes
 *     .map((node) => {
 *       if (node.type === 'text') return node.text;
 *       if (node.type === 'void') return '';
 *       return toPlain(node.children);
 *     })
 *     .join('');
 * }
 *
 * toPlain(parseRichText('Click <link>here</link>.'));
 * // => 'Click here.'
 * ```
 */
export function parseRichText(source: string): RichTextNode[] {
  const nodes: RichTextNode[] = [];
  let text = '';
  let index = 0;

  const flush = (): void => {
    if (text !== '') {
      nodes.push({
        text,
        type: 'text',
      });
      text = '';
    }
  };

  while (index < source.length) {
    const openTag = source.startsWith('<', index)
      ? readOpenTag(source, index)
      : undefined;
    if (openTag) {
      if (openTag.kind === 'void') {
        flush();
        nodes.push({
          name: openTag.name,
          type: 'void',
        });
        index = openTag.end;
        continue;
      }
      const close = findClosingTagRange(source, openTag.end, openTag.name);
      if (close) {
        flush();
        nodes.push({
          children: parseRichText(source.slice(openTag.end, close.start)),
          name: openTag.name,
          type: 'tag',
        });
        index = close.end;
        continue;
      }
    }
    text += source[index];
    index += 1;
  }
  flush();
  return nodes;
}

export function walkRichText<T>(
  source: string,
  handlers: Record<string, (children?: T) => T>,
  renderer: {
    leaf: (text: string) => T;
    concat: (parts: T[]) => T;
  },
): T {
  return renderNodes(parseRichText(source), handlers, renderer);
}

function renderNodes<T>(
  nodes: RichTextNode[],
  handlers: Record<string, (children?: T) => T>,
  renderer: {
    leaf: (text: string) => T;
    concat: (parts: T[]) => T;
  },
): T {
  const parts: T[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      parts.push(renderer.leaf(node.text));
      continue;
    }
    if (node.type === 'void') {
      const handler = handlers[node.name];
      if (handler) {
        parts.push(handler());
        continue;
      }
      parts.push(renderer.leaf(`<${node.name}/>`));
      continue;
    }
    const handler = handlers[node.name];
    if (handler) {
      const inner = renderNodes(node.children, handlers, renderer);
      parts.push(handler(inner));
      continue;
    }
    parts.push(renderer.leaf(`<${node.name}>`));
    parts.push(renderNodes(node.children, handlers, renderer));
    parts.push(renderer.leaf(`</${node.name}>`));
  }
  return renderer.concat(parts);
}

function readOpenTag(
  source: string,
  index: number,
):
  | {
      name: string;
      end: number;
      kind: 'open' | 'void';
    }
  | undefined {
  const close = source.indexOf('>', index + 1);
  if (close === -1) {
    return undefined;
  }
  let name = source.slice(index + 1, close);
  let kind: 'open' | 'void' = 'open';
  if (name.endsWith('/')) {
    name = name.slice(0, -1).trimEnd();
    kind = 'void';
  }
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
    return undefined;
  }
  return {
    end: close + 1,
    kind,
    name,
  };
}

function findClosingTagRange(
  source: string,
  from: number,
  name: string,
):
  | {
      start: number;
      end: number;
    }
  | undefined {
  const openMarker = `<${name}>`;
  const close = `</${name}>`;
  let depth = 1;
  let index = from;
  while (index < source.length) {
    if (source.startsWith(close, index)) {
      depth -= 1;
      if (depth === 0) {
        return {
          end: index + close.length,
          start: index,
        };
      }
      index += close.length;
      continue;
    }
    if (source.startsWith(openMarker, index)) {
      depth += 1;
      index += openMarker.length;
      continue;
    }
    index += 1;
  }
  return undefined;
}
