import type { RichTextNode } from 'yapyak';

import _Children from './Children.astro';
import { CHILDREN_TOKEN } from './children-token';
import _RichText from './RichText.astro';

export type { RichTextProps } from './RichText.astro';

/**
 * Renders rich text by binding each named tag to a named slot.
 *
 * @example
 * ```astro
 * ---
 * import { RichText } from '@yapyak/astro';
 * import { t } from 'yapyak';
 * ---
 *
 * <RichText value={t('Click <link>here</link>.')}>
 *   <a slot="link" href="/docs"><RichText.Children /></a>
 * </RichText>
 * ```
 */
export const RichText: typeof _RichText & {
  /**
   * Marker for the matched tag's children inside a named slot.
   */
  // biome-ignore lint/style/useNamingConvention: yap yap yap
  Children: typeof _Children;
} = Object.assign(_RichText, {
  Children: _Children,
});

export type SlotAccessor = {
  has(name: string): boolean;
  render(name: string): Promise<string>;
};

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
        out += template.replaceAll(CHILDREN_TOKEN, () => '');
        continue;
      }
      out += `&lt;${escapeHtml(node.name)}/&gt;`;
      continue;
    }
    const template = templates[node.name];
    if (template !== undefined) {
      const children = renderNodes(node.children, templates);
      out += template.replaceAll(CHILDREN_TOKEN, () => children);
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
