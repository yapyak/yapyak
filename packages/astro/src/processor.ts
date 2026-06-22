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

/**
 * Creates an Astro processor for yapyak's compiler.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { astro } from '@yapyak/astro/processor';
 *
 * export default defineConfig({
 *   processors: [astro()],
 * });
 * ```
 */
export function astro(): Processor {
  return createProcessor({
    applyImport: (magicString, source, importStatement) => {
      const match = FRONTMATTER_OPEN_RX.exec(source);
      if (match !== null) {
        const insertAt = match.index + match[0].length;
        magicString.appendRight(insertAt, `${importStatement}\n`);
        return;
      }
      magicString.prepend(`${importStatement}\n`);
    },
    extensions: [
      '.astro',
    ],
    id: 'astro',
    parseFragments: (source) => {
      if (!FRONTMATTER_OPEN_RX.test(source)) {
        return [
          {
            code: source,
            kind: 'script',
            lang: 'ts',
            originalOffset: 0,
          },
        ];
      }
      const compiler = loadCompiler();
      const { ast } = compiler.parse(source, undefined);
      return fragmentsFromNode(ast, source);
    },
    skipHmrCallback: true,
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
      {
        cause: error,
      },
    );
  }
}

function fragmentsFromNode(node: Node, source: string): Fragment[] {
  if (isFrontmatterNode(node)) {
    return fragmentsFromFrontmatter(node);
  }
  if (isExpressionNode(node)) {
    return fragmentsFromExpressionNode(node, source);
  }
  if (isTagLikeNode(node)) {
    const fragments: Fragment[] = [];
    for (const attribute of node.attributes) {
      fragments.push(...fragmentsFromAttribute(attribute, source));
    }
    for (const child of node.children) {
      fragments.push(...fragmentsFromNode(child, source));
    }
    return fragments;
  }
  if (isRootNode(node) && Array.isArray(node.children)) {
    const fragments: Fragment[] = [];
    for (const child of node.children) {
      fragments.push(...fragmentsFromNode(child, source));
    }
    return fragments;
  }
  return [];
}

function fragmentsFromFrontmatter(node: FrontmatterNode): Fragment[] {
  const startOfBlock = node.position?.start.offset;
  if (typeof startOfBlock !== 'number') {
    return [];
  }
  const codeStart = startOfBlock + 3;
  return [
    {
      code: node.value,
      kind: 'script',
      lang: 'ts',
      originalOffset: codeStart,
    },
  ];
}

function fragmentsFromExpressionNode(
  node: ExpressionNode,
  source: string,
): Fragment[] {
  const children = Array.isArray(node.children) ? node.children : [];
  const elision = resolveExpressionElision(children, source);
  const fragments: Fragment[] = [];
  for (const child of children) {
    if (child.type === 'text') {
      fragments.push(...fragmentsFromTextExpression(child, elision));
      continue;
    }
    fragments.push(...fragmentsFromNode(child, source));
  }
  return fragments;
}

function resolveExpressionElision(
  children: Node[],
  source: string,
): Fragment['elision'] | undefined {
  if (children.length !== 1) {
    return undefined;
  }
  const onlyChild = children[0];
  if (onlyChild?.type !== 'text') {
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
):
  | {
      end: number;
      start: number;
    }
  | undefined {
  let openIdx = textStart - 1;
  while (openIdx >= 0 && source[openIdx] !== '{') {
    const char = source[openIdx] ?? '';
    if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
      return undefined;
    }
    openIdx -= 1;
  }
  if (openIdx < 0) {
    return undefined;
  }
  let depth = 1;
  let index = textStart;
  while (index < source.length) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          end: index + 1,
          start: openIdx,
        };
      }
    }
    index += 1;
  }
  return undefined;
}

function fragmentsFromTextExpression(
  node: {
    position?: {
      start: {
        offset: number;
      };
    };
    value: string;
  },
  elision: Fragment['elision'],
): Fragment[] {
  const start = node.position?.start.offset;
  if (typeof start !== 'number') {
    return [];
  }
  if (node.value.trim() === '') {
    return [];
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
  return [
    fragment,
  ];
}

function fragmentsFromAttribute(
  node: AttributeNode,
  source: string,
): Fragment[] {
  if (node.kind === 'empty' || node.kind === 'quoted') {
    return [];
  }
  const code = getAttributeExpressionText(node);
  if (!code) {
    return [];
  }
  const offset = findExpressionOffset(node, code, source);
  if (offset === undefined) {
    return [];
  }
  const fragment: Fragment = {
    code,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: offset,
  };
  const elision = resolveAttributeElision(node, source, offset);
  if (elision) {
    fragment.elision = elision;
  }
  return [
    fragment,
  ];
}

function resolveAttributeElision(
  node: AttributeNode,
  source: string,
  valueOffset: number,
): Fragment['elision'] | undefined {
  if (node.kind !== 'expression') {
    return undefined;
  }
  const attributeStart = node.position?.start.offset;
  if (typeof attributeStart !== 'number') {
    return undefined;
  }
  const braces = findEnclosingBraces(source, valueOffset);
  if (!braces) {
    return undefined;
  }
  return {
    attributeName: node.name,
    mode: 'attribute',
    range: rangeFromOffsets(source, attributeStart, braces.end),
  };
}

function getAttributeExpressionText(node: AttributeNode): string | undefined {
  if (node.kind === 'shorthand' || node.kind === 'spread') {
    return node.value === '' ? node.name : node.value;
  }
  return node.value;
}

function findExpressionOffset(
  attributeNode: AttributeNode,
  code: string,
  source: string,
): number | undefined {
  const start = attributeNode.position?.start.offset;
  const end = attributeNode.position?.end?.offset;
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
