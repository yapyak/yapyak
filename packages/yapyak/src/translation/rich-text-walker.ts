export type RichTextNode =
  | { type: 'tag'; name: string; children: RichTextNode[] }
  | { type: 'text'; text: string };

export function parseRichText(source: string): RichTextNode[] {
  const nodes: RichTextNode[] = [];
  let text = '';
  let index = 0;

  const flush = (): void => {
    if (text !== '') {
      nodes.push({ text, type: 'text' });
      text = '';
    }
  };

  while (index < source.length) {
    const open = source.startsWith('<', index)
      ? readOpenTag(source, index)
      : undefined;
    if (open) {
      const close = findClosingTagRange(source, open.end, open.name);
      if (close) {
        flush();
        nodes.push({
          children: parseRichText(source.slice(open.end, close.start)),
          name: open.name,
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
  handlers: Record<string, (children: T) => T>,
  renderer: { leaf: (text: string) => T; concat: (parts: T[]) => T },
): T {
  return renderNodes(parseRichText(source), handlers, renderer);
}

function renderNodes<T>(
  nodes: RichTextNode[],
  handlers: Record<string, (children: T) => T>,
  renderer: { leaf: (text: string) => T; concat: (parts: T[]) => T },
): T {
  const parts: T[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      parts.push(renderer.leaf(node.text));
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

function findClosingTagRange(
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
