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
import type { Fragment, Processor } from 'yapyak/processor';

import { createProcessor, rangeFromOffsets } from 'yapyak/processor';

import { createRequire } from 'node:module';

const FRONTMATTER_OPEN_RX = /^---\r?\n/;

const requireFromHere = createRequire(import.meta.url);

let cached: typeof AstroCompilerSync | undefined;

export type AstroProcessorOptions = {};

/**
 * Creates an Astro processor for yapyak's compiler.
 *
 * @remarks
 * Handles `.astro` components. Extracts frontmatter and template expressions for yapyak's `t()` scanning.
 *
 * @param options - The processor options.
 *
 * @example Register in yapyak.config.ts
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { astro } from '@yapyak/astro/processor';
 *
 * export default defineConfig({
 *   processors: [astro()],
 * });
 * ```
 */
export function astro(options: AstroProcessorOptions = {}): Processor {
  void options;
  return createProcessor({
    applyImport(magicString, source, importStatement) {
      const match = FRONTMATTER_OPEN_RX.exec(source);
      if (match !== null) {
        const insertAt = match.index + match[0].length;
        magicString.appendRight(insertAt, `${importStatement}\n`);
        return;
      }
      magicString.prepend(`---\n${importStatement}\n---\n`);
    },
    extensions: ['.astro'],
    id: 'astro',
    parseFragments(source) {
      const compiler = loadCompiler();
      const { ast } = compiler.parse(source, undefined);
      const fragments: Fragment[] = [];
      walkNode(ast, source, fragments);
      return fragments;
    },
  });
}

function loadCompiler(): typeof AstroCompilerSync {
  if (cached) {
    return cached;
  }
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
  if (typeof startOfBlock !== 'number') {
    return;
  }
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
  const elision = computeExpressionElision(node, children, source);
  for (const child of children) {
    if (child.type === 'text') {
      pushTextExpression(child, fragments, elision);
      continue;
    }
    walkNode(child, source, fragments);
  }
}

function computeExpressionElision(
  node: ExpressionNode,
  children: readonly Node[],
  source: string,
): Fragment['elision'] | undefined {
  void node;
  if (children.length !== 1) {
    return undefined;
  }
  const onlyChild = children[0];
  if (!onlyChild || onlyChild.type !== 'text') {
    return undefined;
  }
  const textStart = onlyChild.position?.start.offset;
  if (typeof textStart !== 'number') {
    return undefined;
  }
  const range = findEnclosingBraces(source, textStart);
  if (!range) {
    return undefined;
  }
  return {
    mode: 'text',
    range: rangeFromOffsets(source, range.start, range.end),
  };
}

function findEnclosingBraces(
  source: string,
  textStart: number,
): { end: number; start: number } | undefined {
  let openIdx = textStart - 1;
  while (openIdx >= 0 && source[openIdx] !== '{') {
    const ch = source[openIdx] ?? '';
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
      return undefined;
    }
    openIdx -= 1;
  }
  if (openIdx < 0) {
    return undefined;
  }
  let depth = 1;
  let i = textStart;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return { end: i + 1, start: openIdx };
      }
    }
    i += 1;
  }
  return undefined;
}

function pushTextExpression(
  node: { position?: { start: { offset: number } }; value: string },
  fragments: Fragment[],
  elision: Fragment['elision'],
): void {
  const start = node.position?.start.offset;
  if (typeof start !== 'number') {
    return;
  }
  if (node.value.trim() === '') {
    return;
  }
  const fragment: Fragment = {
    code: node.value,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: start,
  };
  if (elision) {
    fragment.elision = elision;
  }
  fragments.push(fragment);
}

function handleAttribute(
  attr: AttributeNode,
  source: string,
  fragments: Fragment[],
): void {
  if (attr.kind === 'empty' || attr.kind === 'quoted') {
    return;
  }
  const code = getAttributeExpressionText(attr);
  if (!code) {
    return;
  }
  const offset = findExpressionOffset({ attr, code, source });
  if (offset === undefined) {
    return;
  }
  const fragment: Fragment = {
    code,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: offset,
  };
  const elision = computeAttributeElision(attr, source, offset);
  if (elision) {
    fragment.elision = elision;
  }
  fragments.push(fragment);
}

function computeAttributeElision(
  attr: AttributeNode,
  source: string,
  valueOffset: number,
): Fragment['elision'] | undefined {
  if (attr.kind !== 'expression') {
    return undefined;
  }
  const attrStart = attr.position?.start.offset;
  if (typeof attrStart !== 'number') {
    return undefined;
  }
  const braces = findEnclosingBraces(source, valueOffset);
  if (!braces) {
    return undefined;
  }
  return {
    attrName: attr.name,
    mode: 'attribute',
    range: rangeFromOffsets(source, attrStart, braces.end),
  };
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
  if (typeof start !== 'number') {
    return undefined;
  }
  const searchEnd = typeof end === 'number' ? end : source.length;
  const range = source.slice(start, searchEnd);
  const valueIndex = range.indexOf(code);
  if (valueIndex === -1) {
    return undefined;
  }
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
