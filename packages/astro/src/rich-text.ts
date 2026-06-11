import type { RichTextNode } from 'yapyak';

import { CHILDREN_TOKEN } from './children-token';

/**
 * The Astro slot accessor surface used by {@link renderRichText}.
 *
 * @remarks
 * Structural match for `Astro.slots`. Lifted into its own type so the renderer can be unit-tested with a plain mock object.
 */
export type SlotAccessor = {
  has(name: string): boolean;
  render(name: string): Promise<string>;
};

/**
 * Walks a parsed rich-text tree and produces HTML, resolving each tag against a named Astro slot.
 *
 * @remarks
 * Leaf text and unmatched tag names are HTML-escaped before they reach the output. A matched slot's pre-rendered template is inlined with every `CHILDREN_TOKEN` occurrence replaced by the rendered children of that tag occurrence; the slot template itself is treated as developer-authored HTML and emitted verbatim.
 *
 * @param nodes - The parsed rich-text tree.
 * @param slotAccessor - The Astro slot accessor (or a structural mock).
 *
 * @returns The HTML output.
 */
export async function renderRichText(
  nodes: RichTextNode[],
  slotAccessor: SlotAccessor,
): Promise<string> {
  const slotTemplates: Record<string, string> = {};
  for (const name of extractTagNames(nodes)) {
    if (slotAccessor.has(name)) {
      slotTemplates[name] = await slotAccessor.render(name);
    }
  }
  return renderNodes(nodes, slotTemplates);
}

function extractTagNames(nodes: RichTextNode[]): Set<string> {
  const names = new Set<string>();
  walk(nodes);
  return names;

  function walk(ns: RichTextNode[]): void {
    for (const node of ns) {
      if (node.type === 'tag') {
        names.add(node.name);
        walk(node.children);
        continue;
      }
      if (node.type === 'void') {
        names.add(node.name);
      }
    }
  }
}

function renderNodes(
  nodes: RichTextNode[],
  templates: Record<string, string>,
): string {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      out += escapeHtml(node.text);
      continue;
    }
    if (node.type === 'void') {
      const template = templates[node.name];
      if (template !== undefined) {
        out += template.replaceAll(CHILDREN_TOKEN, '');
        continue;
      }
      out += `&lt;${escapeHtml(node.name)}/&gt;`;
      continue;
    }
    const template = templates[node.name];
    if (template !== undefined) {
      const children = renderNodes(node.children, templates);
      out += template.replaceAll(CHILDREN_TOKEN, children);
      continue;
    }
    const safeName = escapeHtml(node.name);
    out += `&lt;${safeName}&gt;${renderNodes(node.children, templates)}&lt;/${safeName}&gt;`;
  }
  return out;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
