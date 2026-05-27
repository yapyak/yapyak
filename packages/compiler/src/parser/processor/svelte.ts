import type MagicString from 'magic-string';
import type * as SvelteCompiler from 'svelte/compiler';
import type { AST } from 'svelte/compiler';
import type { Fragment, Processor } from '../type';

import { rangeFromOffsets } from '../range';
import { createRequire } from 'node:module';

const SCRIPT_RX = /<script(?:\s+[^>]*)?>/;

const requireFromHere = createRequire(import.meta.url);

let cached: typeof SvelteCompiler | undefined;

export const svelteProcessor: Processor = {
  applyImport(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void {
    const match = SCRIPT_RX.exec(source);
    if (match !== null) {
      const insertAt = match.index + match[0].length;
      magicString.appendRight(insertAt, `\n${importStatement}`);
      return;
    }
    magicString.prepend(`<script>\n${importStatement}\n</script>\n`);
  },

  parseFragments(source: string): Fragment[] {
    const compiler = loadCompiler();
    const ast = compiler.parse(source, { modern: true });
    const fragments: Fragment[] = [];

    if (ast.instance != null) {
      pushScriptFragment(ast.instance, source, fragments);
    }
    if (ast.module != null) {
      pushScriptFragment(ast.module, source, fragments);
    }
    if (ast.fragment != null) {
      collectFromFragment(ast.fragment, source, fragments);
    }
    return fragments;
  },
};

function loadCompiler(): typeof SvelteCompiler {
  if (cached) {
    return cached;
  }
  try {
    cached = requireFromHere('svelte/compiler') as typeof SvelteCompiler;
    return cached;
  } catch (error) {
    throw new Error(
      'svelte is required to process Svelte files. Install it as a dependency.',
      { cause: error },
    );
  }
}

function pushScriptFragment(
  script: AST.Script,
  source: string,
  fragments: Fragment[],
): void {
  const start = (script.content as { start?: unknown }).start;
  const end = (script.content as { end?: unknown }).end;
  if (typeof start !== 'number' || typeof end !== 'number') {
    return;
  }
  fragments.push({
    code: source.slice(start, end),
    kind: 'script',
    lang: getScriptLang(script),
    originalOffset: start,
  });
}

function getScriptLang(script: AST.Script): 'js' | 'ts' {
  for (const attr of script.attributes) {
    if (attr.name !== 'lang') {
      continue;
    }
    const value = attr.value;
    if (value === true) {
      continue;
    }
    if (!Array.isArray(value)) {
      continue;
    }
    const text = value
      .map((item) => (item.type === 'Text' ? item.data : ''))
      .join('');
    if (text === 'ts' || text === 'typescript') {
      return 'ts';
    }
  }
  return 'js';
}

function collectFromFragment(
  fragment: AST.Fragment,
  source: string,
  fragments: Fragment[],
): void {
  for (const node of fragment.nodes) {
    collectFromNode(node, source, fragments);
  }
}

type FragmentNode = AST.Fragment['nodes'][number];

function collectFromNode(
  node: FragmentNode,
  source: string,
  fragments: Fragment[],
): void {
  if (isExpressionTagLike(node)) {
    const elision =
      node.type === 'ExpressionTag'
        ? {
            mode: 'text' as const,
            range: rangeFromOffsets(source, node.start, node.end),
          }
        : undefined;
    pushExpression(node.expression, source, fragments, elision);
    return;
  }
  if (node.type === 'IfBlock') {
    pushExpression(node.test, source, fragments);
    collectFromFragment(node.consequent, source, fragments);
    if (node.alternate !== null) {
      collectFromFragment(node.alternate, source, fragments);
    }
    return;
  }
  if (node.type === 'EachBlock') {
    pushExpression(node.expression, source, fragments);
    if (node.key) {
      pushExpression(node.key, source, fragments);
    }
    collectFromFragment(node.body, source, fragments);
    if (node.fallback) {
      collectFromFragment(node.fallback, source, fragments);
    }
    return;
  }
  if (node.type === 'AwaitBlock') {
    pushExpression(node.expression, source, fragments);
    if (node.pending !== null) {
      collectFromFragment(node.pending, source, fragments);
    }
    if (node.then !== null) {
      collectFromFragment(node.then, source, fragments);
    }
    if (node.catch !== null) {
      collectFromFragment(node.catch, source, fragments);
    }
    return;
  }
  if (node.type === 'KeyBlock') {
    pushExpression(node.expression, source, fragments);
    collectFromFragment(node.fragment, source, fragments);
    return;
  }
  if (node.type === 'SnippetBlock') {
    collectFromFragment(node.body, source, fragments);
    return;
  }
  if (isElementLike(node)) {
    collectFromElement(node, source, fragments);
  }
}

function isExpressionTagLike(
  node: FragmentNode,
): node is AST.ExpressionTag | AST.HtmlTag | AST.RenderTag {
  return (
    node.type === 'ExpressionTag' ||
    node.type === 'HtmlTag' ||
    node.type === 'RenderTag'
  );
}

function isElementLike(node: FragmentNode): node is ElementLikeNode {
  return (
    node.type === 'RegularElement' ||
    node.type === 'Component' ||
    node.type === 'SlotElement' ||
    node.type === 'TitleElement' ||
    node.type === 'SvelteBody' ||
    node.type === 'SvelteComponent' ||
    node.type === 'SvelteDocument' ||
    node.type === 'SvelteElement' ||
    node.type === 'SvelteFragment' ||
    node.type === 'SvelteHead' ||
    node.type === 'SvelteSelf' ||
    node.type === 'SvelteWindow' ||
    node.type === 'SvelteBoundary'
  );
}

type ElementLikeNode =
  | AST.Component
  | AST.RegularElement
  | AST.SlotElement
  | AST.SvelteBody
  | AST.SvelteBoundary
  | AST.SvelteComponent
  | AST.SvelteDocument
  | AST.SvelteElement
  | AST.SvelteFragment
  | AST.SvelteHead
  | AST.SvelteSelf
  | AST.SvelteWindow
  | AST.TitleElement;

function collectFromElement(
  element: ElementLikeNode,
  source: string,
  fragments: Fragment[],
): void {
  for (const attr of element.attributes) {
    collectFromAttribute(attr, source, fragments);
  }
  collectFromFragment(element.fragment, source, fragments);
  if (element.type === 'SvelteElement') {
    pushExpression(element.tag, source, fragments);
  }
  if (element.type === 'SvelteComponent') {
    pushExpression(element.expression, source, fragments);
  }
}

type AttributeNode = ElementLikeNode['attributes'][number];

function collectFromAttribute(
  attr: AttributeNode,
  source: string,
  fragments: Fragment[],
): void {
  if (attr.type === 'Attribute') {
    const value = attr.value;
    if (value === true) {
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item.type === 'ExpressionTag') {
          pushExpression(item.expression, source, fragments);
        }
      }
      return;
    }
    const elision =
      value.type === 'ExpressionTag'
        ? {
            attrName: attr.name,
            mode: 'attribute' as const,
            range: rangeFromOffsets(source, attr.start, attr.end),
          }
        : undefined;
    pushExpression(value.expression, source, fragments, elision);
    return;
  }
  if (attr.type === 'SpreadAttribute') {
    pushExpression(attr.expression, source, fragments);
    return;
  }
  if (attr.type === 'StyleDirective') {
    const value = attr.value;
    if (value === true) {
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item.type === 'ExpressionTag') {
          pushExpression(item.expression, source, fragments);
        }
      }
      return;
    }
    pushExpression(value.expression, source, fragments);
    return;
  }
  if (attr.type === 'AttachTag') {
    pushExpression(attr.expression, source, fragments);
    return;
  }
  if ('expression' in attr && attr.expression !== null) {
    pushExpression(attr.expression, source, fragments);
  }
}

function pushExpression(
  expression: unknown,
  source: string,
  fragments: Fragment[],
  elision?: Fragment['elision'],
): void {
  if (expression === null || expression === undefined) {
    return;
  }
  if (typeof expression !== 'object') {
    return;
  }
  const start = (expression as { start?: unknown }).start;
  const end = (expression as { end?: unknown }).end;
  if (typeof start !== 'number' || typeof end !== 'number') {
    return;
  }
  const code = source.slice(start, end);
  if (code === '') {
    return;
  }
  const fragment: Fragment = {
    code,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: start,
  };
  if (elision) {
    fragment.elision = elision;
  }
  fragments.push(fragment);
}
