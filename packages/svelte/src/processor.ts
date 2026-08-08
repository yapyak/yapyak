import type * as SvelteCompiler from 'svelte/compiler';
import type { AST } from 'svelte/compiler';
import type { Fragment, Processor } from 'yapyak/processor';

import {
  createProcessor,
  rangeFromOffsets,
  segmentsFromOffset,
} from 'yapyak/processor';

import { createRequire } from 'node:module';

const SCRIPT_RX = /<script(?:\s+[^>]*)?>/;

const requireFromHere = createRequire(import.meta.url);

let cached: typeof SvelteCompiler | undefined;

/**
 * Creates a Svelte processor for yapyak's compiler.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { svelte } from '@yapyak/svelte/processor';
 *
 * export default defineConfig({
 *   processors: [svelte()]
 * });
 * ```
 */
export function svelte(): Processor {
  return createProcessor({
    applyImport: (magicString, source, importStatement) => {
      const match = SCRIPT_RX.exec(source);
      if (match !== null) {
        const insertAt = match.index + match[0].length;
        magicString.appendRight(insertAt, `\n${importStatement}`);
        return;
      }
      magicString.prepend(`<script>\n${importStatement}\n</script>\n`);
    },
    extensions: [
      '.svelte',
    ],
    id: 'svelte',
    parseFragments: (source) => {
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
    runtime: {
      module: '@yapyak/svelte/internal',
      register: 'registerLocale',
    },
  });
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
  const code = source.slice(start, end);
  return [
    {
      code,
      language: getScriptLang(script),
      segments: segmentsFromOffset(code, start),
      type: 'script',
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

type EnclosingContext = {
  element: string;
  snippet: string;
};

function fragmentsFromAst(
  ast: AST.Fragment,
  source: string,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  const fragments: Fragment[] = [];
  for (const node of ast.nodes) {
    fragments.push(...fragmentsFromNode(node, source, enclosingContext));
  }
  return fragments;
}

type FragmentNode = AST.Fragment['nodes'][number];

function fragmentsFromNode(
  node: FragmentNode,
  source: string,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  if (isExpressionTagLike(node)) {
    const elisionContext =
      node.type === 'ExpressionTag'
        ? {
            mode: 'text' as const,
            range: rangeFromOffsets(source, node.start, node.end),
          }
        : undefined;
    return fragmentsFromExpression(
      node.expression,
      source,
      elisionContext,
      enclosingContext,
    );
  }
  if (node.type === 'ConstTag' || node.type === 'DeclarationTag') {
    const fragments: Fragment[] = [];
    for (const declarator of node.declaration.declarations) {
      fragments.push(
        ...fragmentsFromExpression(
          declarator.init,
          source,
          undefined,
          enclosingContext,
        ),
      );
    }
    return fragments;
  }
  if (node.type === 'IfBlock') {
    const fragments = fragmentsFromExpression(
      node.test,
      source,
      undefined,
      enclosingContext,
    );
    fragments.push(
      ...fragmentsFromAst(node.consequent, source, enclosingContext),
    );
    if (node.alternate !== null) {
      fragments.push(
        ...fragmentsFromAst(node.alternate, source, enclosingContext),
      );
    }
    return fragments;
  }
  if (node.type === 'EachBlock') {
    const fragments = fragmentsFromExpression(
      node.expression,
      source,
      undefined,
      enclosingContext,
    );
    fragments.push(
      ...fragmentsFromExpression(
        node.context,
        source,
        undefined,
        enclosingContext,
      ),
    );
    if (node.key) {
      fragments.push(
        ...fragmentsFromExpression(
          node.key,
          source,
          undefined,
          enclosingContext,
        ),
      );
    }
    fragments.push(...fragmentsFromAst(node.body, source, enclosingContext));
    if (node.fallback) {
      fragments.push(
        ...fragmentsFromAst(node.fallback, source, enclosingContext),
      );
    }
    return fragments;
  }
  if (node.type === 'AwaitBlock') {
    const fragments = fragmentsFromExpression(
      node.expression,
      source,
      undefined,
      enclosingContext,
    );
    if (node.pending !== null) {
      fragments.push(
        ...fragmentsFromAst(node.pending, source, enclosingContext),
      );
    }
    if (node.then !== null) {
      fragments.push(...fragmentsFromAst(node.then, source, enclosingContext));
    }
    if (node.catch !== null) {
      fragments.push(...fragmentsFromAst(node.catch, source, enclosingContext));
    }
    return fragments;
  }
  if (node.type === 'KeyBlock') {
    const fragments = fragmentsFromExpression(
      node.expression,
      source,
      undefined,
      enclosingContext,
    );
    fragments.push(
      ...fragmentsFromAst(node.fragment, source, enclosingContext),
    );
    return fragments;
  }
  if (node.type === 'SnippetBlock') {
    const fragments: Fragment[] = [];
    for (const parameter of node.parameters) {
      fragments.push(
        ...fragmentsFromExpression(
          parameter,
          source,
          undefined,
          enclosingContext,
        ),
      );
    }
    fragments.push(...fragmentsFromAst(node.body, source, enclosingContext));
    return fragments;
  }
  if (isElementLike(node)) {
    return fragmentsFromElement(node, source);
  }
  node satisfies AST.Comment | AST.DebugTag | AST.SvelteOptionsRaw | AST.Text;
  return [];
}

function isExpressionTagLike(
  node: FragmentNode,
): node is AST.AttachTag | AST.ExpressionTag | AST.HtmlTag | AST.RenderTag {
  return (
    node.type === 'AttachTag' ||
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
  const enclosingContext = getEnclosingContext(element, source);
  for (const attribute of element.attributes) {
    fragments.push(
      ...fragmentsFromAttribute(attribute, source, enclosingContext),
    );
  }
  fragments.push(
    ...fragmentsFromAst(element.fragment, source, enclosingContext),
  );
  if (element.type === 'SvelteElement') {
    fragments.push(...fragmentsFromExpression(element.tag, source));
  }
  if (element.type === 'SvelteComponent') {
    fragments.push(...fragmentsFromExpression(element.expression, source));
  }
  return fragments;
}

function getEnclosingContext(
  element: ElementLikeNode,
  source: string,
): EnclosingContext | undefined {
  if (element.type === 'RegularElement' || element.type === 'Component') {
    return {
      element: element.name,
      snippet: source.slice(element.start, element.end),
    };
  }
  return undefined;
}

type AttributeNode = ElementLikeNode['attributes'][number];

function fragmentsFromAttribute(
  node: AttributeNode,
  source: string,
  enclosingContext?: EnclosingContext,
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
          fragments.push(
            ...fragmentsFromExpression(
              item.expression,
              source,
              undefined,
              enclosingContext,
            ),
          );
        }
      }
      return fragments;
    }
    const elisionContext =
      value.type === 'ExpressionTag'
        ? {
            attributeName: node.name,
            mode: 'attribute' as const,
            range: rangeFromOffsets(source, node.start, node.end),
          }
        : undefined;
    return fragmentsFromExpression(
      value.expression,
      source,
      elisionContext,
      enclosingContext,
    );
  }
  if (node.type === 'SpreadAttribute') {
    return fragmentsFromExpression(
      node.expression,
      source,
      undefined,
      enclosingContext,
    );
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
          fragments.push(
            ...fragmentsFromExpression(
              item.expression,
              source,
              undefined,
              enclosingContext,
            ),
          );
        }
      }
      return fragments;
    }
    return fragmentsFromExpression(
      value.expression,
      source,
      undefined,
      enclosingContext,
    );
  }
  if (node.type === 'AttachTag') {
    return fragmentsFromExpression(
      node.expression,
      source,
      undefined,
      enclosingContext,
    );
  }
  if ('expression' in node && node.expression !== null) {
    return fragmentsFromExpression(
      node.expression,
      source,
      undefined,
      enclosingContext,
    );
  }
  return [];
}

function fragmentsFromExpression(
  expression: unknown,
  source: string,
  elisionContext?: Fragment['elisionContext'],
  enclosingContext?: EnclosingContext,
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
    language: 'ts',
    segments: segmentsFromOffset(code, start),
    type: 'template-expression',
  };
  if (elisionContext) {
    fragment.elisionContext = elisionContext;
  }
  if (enclosingContext) {
    fragment.enclosingElement = enclosingContext.element;
    fragment.snippet = enclosingContext.snippet;
  }
  return [
    fragment,
  ];
}
