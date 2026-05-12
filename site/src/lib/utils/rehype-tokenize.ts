import { type Lang, tokenize } from './tokenize.js';

interface HastElement {
  type: 'element';
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
}

interface HastText {
  type: 'text';
  value: string;
}

type HastNode = HastElement | HastText | { type: string; [key: string]: unknown };

interface HastRoot {
  type: 'root';
  children: HastNode[];
}

const SUPPORTED_LANGS = new Set<Lang>([
  'tsx',
  'ts',
  'jsx',
  'js',
  'svelte',
  'vue',
  'bash',
  'json',
]);

export function rehypeTokenize(): (tree: HastRoot) => void {
  return (tree) => {
    visit(tree, (node, parent, index) => {
      if (!isPre(node)) {
        return;
      }
      const code = findCode(node);
      if (code === null) {
        return;
      }
      const lang = extractLang(code);
      if (lang === null) {
        return;
      }
      const text = collectText(code);
      const tokens = tokenize(text, lang);
      code.children = tokens.map((token) => ({
        type: 'element',
        tagName: 'span',
        properties: { className: [`tx-${token.type}`] },
        children: [{ type: 'text', value: token.value }],
      }));
      if (
        parent !== null &&
        typeof index === 'number' &&
        'children' in parent &&
        Array.isArray(parent.children)
      ) {
        const wrapper: HastElement = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['CodeBlock'],
            'data-lang': lang,
          },
          children: [node],
        };
        (parent.children as HastNode[])[index] = wrapper;
      }
    });
  };
}

function visit(
  node: HastNode | HastRoot,
  callback: (node: HastElement, parent: HastNode | null, index: number) => void,
  parent: HastNode | null = null,
  index = 0,
): void {
  if (isElement(node)) {
    callback(node, parent, index);
  }
  if ('children' in node && Array.isArray(node.children)) {
    node.children.forEach((child, childIndex) => {
      visit(child as HastNode, callback, node as HastNode, childIndex);
    });
  }
}

function isElement(node: HastNode | HastRoot): node is HastElement {
  return (node as HastElement).type === 'element';
}

function isPre(node: HastNode | HastRoot): node is HastElement {
  return isElement(node) && node.tagName === 'pre';
}

function findCode(pre: HastElement): HastElement | null {
  for (const child of pre.children) {
    if (isElement(child) && child.tagName === 'code') {
      return child;
    }
  }
  return null;
}

function extractLang(code: HastElement): Lang | null {
  const className = (code.properties?.className ?? []) as unknown;
  if (!Array.isArray(className)) {
    return null;
  }
  for (const entry of className) {
    if (typeof entry !== 'string') {
      continue;
    }
    if (entry.startsWith('language-')) {
      const candidate = entry.slice('language-'.length) as Lang;
      if (SUPPORTED_LANGS.has(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

function collectText(node: HastElement | HastText | HastNode): string {
  if ((node as HastText).type === 'text') {
    return (node as HastText).value;
  }
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as HastNode[]).map(collectText).join('');
  }
  return '';
}
