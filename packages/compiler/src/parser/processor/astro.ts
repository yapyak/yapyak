import type * as AstroCompilerSync from '@astrojs/compiler/sync';
import type {
  AttributeNode,
  ComponentNode,
  CustomElementNode,
  ElementNode,
  ExpressionNode,
  FragmentNode,
  FrontmatterNode,
  Node,
  RootNode,
} from '@astrojs/compiler/types';
import type MagicString from 'magic-string';
import type { Fragment, Processor } from '../type';

import { createRequire } from 'node:module';

const FRONTMATTER_OPEN_RX = /^---\r?\n/;

const requireFromHere = createRequire(import.meta.url);

let cached: typeof AstroCompilerSync | undefined;

export const astroProcessor: Processor = {
  applyImport(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void {
    const match = FRONTMATTER_OPEN_RX.exec(source);
    if (match !== null) {
      const insertAt = match.index + match[0].length;
      magicString.appendRight(insertAt, `${importStatement}\n`);
      return;
    }
    magicString.prepend(`---\n${importStatement}\n---\n`);
  },

  parseFragments(source: string): Fragment[] {
    const compiler = loadCompiler();
    const { ast } = compiler.parse(source, undefined);
    const fragments: Fragment[] = [];
    walkNode(ast, source, fragments);
    return fragments;
  },
};

function loadCompiler(): typeof AstroCompilerSync {
  if (cached !== undefined) return cached;
  try {
    cached = requireFromHere(
      '@astrojs/compiler/sync',
    ) as typeof AstroCompilerSync;
    return cached;
  } catch (error) {
    throw new Error(
      '@astrojs/compiler is required to process Astro files. Install it as a dependency.',
      { cause: error },
    );
  }
}

function walkNode(node: Node, source: string, fragments: Fragment[]): void {
  if (isFrontmatterNode(node)) {
    pushFrontmatterFragment(node, source, fragments);
    return;
  }
  if (isExpressionNode(node)) {
    handleExpressionNode(node, source, fragments);
    return;
  }
  if (isTagLikeNode(node)) {
    if (Array.isArray(node.attributes)) {
      for (const attr of node.attributes) {
        handleAttribute(attr, source, fragments);
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walkNode(child, source, fragments);
      }
    }
    return;
  }
  if (isRootNode(node) && Array.isArray(node.children)) {
    for (const child of node.children) {
      walkNode(child, source, fragments);
    }
  }
}

function pushFrontmatterFragment(
  node: FrontmatterNode,
  source: string,
  fragments: Fragment[],
): void {
  const startOfBlock = node.position?.start.offset;
  if (typeof startOfBlock !== 'number') return;
  const codeStart = startOfBlock + 3;
  void source;
  fragments.push({
    code: node.value,
    kind: 'script',
    lang: 'ts',
    originalOffset: codeStart,
  });
}

function handleExpressionNode(
  node: ExpressionNode,
  source: string,
  fragments: Fragment[],
): void {
  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    if (child.type === 'text') {
      pushTextExpression(child, fragments);
      continue;
    }
    walkNode(child, source, fragments);
  }
}

function pushTextExpression(
  node: { position?: { start: { offset: number } }; value: string },
  fragments: Fragment[],
): void {
  const start = node.position?.start.offset;
  if (typeof start !== 'number') return;
  if (node.value.trim() === '') return;
  fragments.push({
    code: node.value,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: start,
  });
}

function handleAttribute(
  attr: AttributeNode,
  source: string,
  fragments: Fragment[],
): void {
  if (attr.kind === 'empty' || attr.kind === 'quoted') return;
  const code = getAttributeExpressionText(attr);
  if (code === undefined || code === '') return;
  const offset = findExpressionOffset({ attr, code, source });
  if (offset === undefined) return;
  fragments.push({
    code,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: offset,
  });
}

function getAttributeExpressionText(attr: AttributeNode): string | undefined {
  if (attr.kind === 'shorthand' || attr.kind === 'spread') {
    return attr.value !== '' ? attr.value : attr.name;
  }
  return attr.value;
}

interface FindExpressionOffsetInput {
  attr: AttributeNode;
  code: string;
  source: string;
}

function findExpressionOffset(
  input: FindExpressionOffsetInput,
): number | undefined {
  const { attr, code, source } = input;
  const start = attr.position?.start.offset;
  const end = attr.position?.end?.offset;
  if (typeof start !== 'number') return undefined;
  const searchEnd = typeof end === 'number' ? end : source.length;
  const range = source.slice(start, searchEnd);
  const valueIndex = range.indexOf(code);
  if (valueIndex === -1) return undefined;
  return start + valueIndex;
}

function isFrontmatterNode(node: Node): node is FrontmatterNode {
  return node.type === 'frontmatter';
}

function isExpressionNode(node: Node): node is ExpressionNode {
  return node.type === 'expression';
}

function isRootNode(node: Node): node is RootNode {
  return node.type === 'root';
}

function isTagLikeNode(
  node: Node,
): node is ComponentNode | CustomElementNode | ElementNode | FragmentNode {
  return (
    node.type === 'element' ||
    node.type === 'component' ||
    node.type === 'custom-element' ||
    node.type === 'fragment'
  );
}
