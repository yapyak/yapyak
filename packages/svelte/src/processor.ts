import type * as SvelteCompiler from 'svelte/compiler';
import type { AST } from 'svelte/compiler';
import type { Fragment, Processor } from 'yapyak/processor';

import { createProcessor, rangeFromOffsets } from 'yapyak/processor';

import { createRequire } from 'node:module';

const SCRIPT_RX = /<script(?:\s+[^>]*)?>/;

const requireFromHere = createRequire(import.meta.url);

let cached: typeof SvelteCompiler | undefined;

/**
 * Creates a Svelte processor for yapyak's compiler.
 *
 * @remarks
 * Handles `.svelte` components. Extracts `<script>` blocks and template expressions for yapyak's `t()` scanning.
 *
 * @example Register in yapyak.config.ts
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { svelte } from '@yapyak/svelte/processor';
 *
 * export default defineConfig({
 *   processors: [svelte()],
 * });
 * ```
 */
export function svelte(): Processor {
  return createProcessor(
    (magicString, source, importStatement) => {
      const match = SCRIPT_RX.exec(source);
      if (match !== null) {
        const insertAt = match.index + match[0].length;
        magicString.appendRight(insertAt, `\n${importStatement}`);
        return;
      }
      magicString.prepend(`<script>\n${importStatement}\n</script>\n`);
    },
    [
      '.svelte',
    ],
    'svelte',
    (source) => {
      const compiler = loadCompiler();
      const ast = compiler.parse(source, {
        modern: true,
      });
      const fragments: Fragment[] = [];

      if (ast.instance != null) {
        fragments.push(...fragmentsFromScript(ast.instance, source));
      }
      if (ast.module != null) {
        fragments.push(...fragmentsFromScript(ast.module, source));
      }
      if (ast.fragment != null) {
        fragments.push(...fragmentsFromAst(ast.fragment, source));
      }
      return fragments;
    },
  );
}

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
      {
        cause: error,
      },
    );
  }
}

function fragmentsFromScript(script: AST.Script, source: string): Fragment[] {
  const start = (
    script.content as {
      start?: unknown;
    }
  ).start;
  const end = (
    script.content as {
      end?: unknown;
    }
  ).end;
  if (typeof start !== 'number' || typeof end !== 'number') {
    return [];
  }
  return [
    {
      code: source.slice(start, end),
      kind: 'script',
      lang: getScriptLang(script),
      originalOffset: start,
    },
  ];
}

function getScriptLang(script: AST.Script): 'js' | 'ts' {
  for (const attribute of script.attributes) {
    if (attribute.name !== 'lang') {
      continue;
    }
    const value = attribute.value;
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

function fragmentsFromAst(ast: AST.Fragment, source: string): Fragment[] {
  const fragments: Fragment[] = [];
  for (const node of ast.nodes) {
    fragments.push(...fragmentsFromNode(node, source));
  }
  return fragments;
}

type FragmentNode = AST.Fragment['nodes'][number];

function fragmentsFromNode(node: FragmentNode, source: string): Fragment[] {
  if (isExpressionTagLike(node)) {
    const elision =
      node.type === 'ExpressionTag'
        ? {
            mode: 'text' as const,
            range: rangeFromOffsets(source, node.start, node.end),
          }
        : undefined;
    return fragmentsFromExpression(node.expression, source, elision);
  }
  if (node.type === 'IfBlock') {
    const fragments = fragmentsFromExpression(node.test, source);
    fragments.push(...fragmentsFromAst(node.consequent, source));
    if (node.alternate !== null) {
      fragments.push(...fragmentsFromAst(node.alternate, source));
    }
    return fragments;
  }
  if (node.type === 'EachBlock') {
    const fragments = fragmentsFromExpression(node.expression, source);
    if (node.key) {
      fragments.push(...fragmentsFromExpression(node.key, source));
    }
    fragments.push(...fragmentsFromAst(node.body, source));
    if (node.fallback) {
      fragments.push(...fragmentsFromAst(node.fallback, source));
    }
    return fragments;
  }
  if (node.type === 'AwaitBlock') {
    const fragments = fragmentsFromExpression(node.expression, source);
    if (node.pending !== null) {
      fragments.push(...fragmentsFromAst(node.pending, source));
    }
    if (node.then !== null) {
      fragments.push(...fragmentsFromAst(node.then, source));
    }
    if (node.catch !== null) {
      fragments.push(...fragmentsFromAst(node.catch, source));
    }
    return fragments;
  }
  if (node.type === 'KeyBlock') {
    const fragments = fragmentsFromExpression(node.expression, source);
    fragments.push(...fragmentsFromAst(node.fragment, source));
    return fragments;
  }
  if (node.type === 'SnippetBlock') {
    return fragmentsFromAst(node.body, source);
  }
  if (isElementLike(node)) {
    return fragmentsFromElement(node, source);
  }
  return [];
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

function fragmentsFromElement(
  element: ElementLikeNode,
  source: string,
): Fragment[] {
  const fragments: Fragment[] = [];
  for (const attribute of element.attributes) {
    fragments.push(...fragmentsFromAttribute(attribute, source));
  }
  fragments.push(...fragmentsFromAst(element.fragment, source));
  if (element.type === 'SvelteElement') {
    fragments.push(...fragmentsFromExpression(element.tag, source));
  }
  if (element.type === 'SvelteComponent') {
    fragments.push(...fragmentsFromExpression(element.expression, source));
  }
  return fragments;
}

type AttributeNode = ElementLikeNode['attributes'][number];

function fragmentsFromAttribute(
  node: AttributeNode,
  source: string,
): Fragment[] {
  if (node.type === 'Attribute') {
    const value = node.value;
    if (value === true) {
      return [];
    }
    if (Array.isArray(value)) {
      const fragments: Fragment[] = [];
      for (const item of value) {
        if (item.type === 'ExpressionTag') {
          fragments.push(...fragmentsFromExpression(item.expression, source));
        }
      }
      return fragments;
    }
    const elision =
      value.type === 'ExpressionTag'
        ? {
            attributeName: node.name,
            mode: 'attribute' as const,
            range: rangeFromOffsets(source, node.start, node.end),
          }
        : undefined;
    return fragmentsFromExpression(value.expression, source, elision);
  }
  if (node.type === 'SpreadAttribute') {
    return fragmentsFromExpression(node.expression, source);
  }
  if (node.type === 'StyleDirective') {
    const value = node.value;
    if (value === true) {
      return [];
    }
    if (Array.isArray(value)) {
      const fragments: Fragment[] = [];
      for (const item of value) {
        if (item.type === 'ExpressionTag') {
          fragments.push(...fragmentsFromExpression(item.expression, source));
        }
      }
      return fragments;
    }
    return fragmentsFromExpression(value.expression, source);
  }
  if (node.type === 'AttachTag') {
    return fragmentsFromExpression(node.expression, source);
  }
  if ('expression' in node && node.expression !== null) {
    return fragmentsFromExpression(node.expression, source);
  }
  return [];
}

function fragmentsFromExpression(
  expression: unknown,
  source: string,
  elision?: Fragment['elision'],
): Fragment[] {
  if (expression === null || expression === undefined) {
    return [];
  }
  if (typeof expression !== 'object') {
    return [];
  }
  const start = (
    expression as {
      start?: unknown;
    }
  ).start;
  const end = (
    expression as {
      end?: unknown;
    }
  ).end;
  if (typeof start !== 'number' || typeof end !== 'number') {
    return [];
  }
  const code = source.slice(start, end);
  if (code === '') {
    return [];
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
  return [
    fragment,
  ];
}
