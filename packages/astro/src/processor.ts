import type {
  Expression,
  JSXAttribute,
  JSXElement,
  JSXEmptyExpression,
  JSXFragment,
  JSXIdentifier,
  JSXNamespacedName,
  JSXSpreadAttribute,
} from 'estree-jsx';
import type { ElisionContext, Fragment, Processor } from 'yapyak/processor';

import { parse } from '@astrojs/compiler-rs';
import { createProcessor, rangeFromOffsets } from 'yapyak/processor';

declare module 'estree' {
  // biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
  interface BaseNode {
    end: number;
    start: number;
  }
}

const FRONTMATTER_OPEN_RX = /^---\r?\n/;
const FRONTMATTER_DELIMITER_LENGTH = 3;

type AstroRoot = {
  body: BodyNode[];
  end: number;
  frontmatter: AstroFrontmatter;
  start: number;
  type: 'AstroRoot';
};

type AstroFrontmatter = {
  end: number;
  start: number;
  type: 'AstroFrontmatter';
};

type AstroComment = {
  end: number;
  start: number;
  type: 'AstroComment';
  value: string;
};

type AstroDoctype = {
  end: number;
  start: number;
  type: 'AstroDoctype';
  value: string;
};

type BodyNode = AstroComment | AstroDoctype | JSXElement['children'][number];

/**
 * Creates an Astro processor for yapyak's compiler.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { astro } from '@yapyak/astro/processor';
 *
 * export default defineConfig({
 *   processors: [astro()]
 * });
 * ```
 */
export function astro(): Processor {
  return createProcessor({
    applyImport: (magicString, source, importStatement) => {
      const match = FRONTMATTER_OPEN_RX.exec(source);
      if (match !== null) {
        magicString.appendRight(
          match.index + match[0].length,
          `${importStatement}\n`,
        );
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
            lang: 'ts',
            originalOffset: 0,
            type: 'script',
          },
        ];
      }
      const ast = parse(source).ast as AstroRoot;
      return [
        frontmatterFragment(ast.frontmatter, source),
        ...ast.body.flatMap((node) => fragmentsFromBodyNode(node, source)),
      ];
    },
    skipHmrCallback: true,
  });
}

function frontmatterFragment(
  frontmatter: AstroFrontmatter,
  source: string,
): Fragment {
  const codeStart = frontmatter.start + FRONTMATTER_DELIMITER_LENGTH;
  const codeEnd = frontmatter.end - FRONTMATTER_DELIMITER_LENGTH;
  return {
    code: source.slice(codeStart, codeEnd),
    lang: 'ts',
    originalOffset: codeStart,
    type: 'script',
  };
}

function fragmentsFromBodyNode(node: BodyNode, source: string): Fragment[] {
  if (node.type === 'JSXElement') {
    return fragmentsFromJsxElement(node, source);
  }
  if (node.type === 'JSXFragment') {
    return node.children.flatMap((child) =>
      fragmentsFromBodyNode(child, source),
    );
  }
  if (node.type === 'JSXExpressionContainer') {
    return fragmentsFromExpression(node.expression, source, {
      mode: 'text',
      range: rangeFromOffsets(source, node.start, node.end),
    });
  }
  if (node.type === 'JSXSpreadChild') {
    return fragmentsFromExpression(node.expression, source);
  }
  return [];
}

function fragmentsFromJsxElement(node: JSXElement, source: string): Fragment[] {
  return [
    ...node.openingElement.attributes.flatMap((attribute) =>
      fragmentsFromAttribute(attribute, source),
    ),
    ...node.children.flatMap((child) => fragmentsFromBodyNode(child, source)),
  ];
}

function fragmentsFromAttribute(
  attribute: JSXAttribute | JSXSpreadAttribute,
  source: string,
): Fragment[] {
  if (attribute.type === 'JSXSpreadAttribute') {
    return fragmentsFromExpression(attribute.argument, source);
  }
  const value = attribute.value;
  if (value === null || value.type === 'Literal') {
    return [];
  }
  if (value.type === 'JSXElement') {
    return fragmentsFromJsxElement(value, source);
  }
  if (value.type === 'JSXFragment') {
    return value.children.flatMap((child) =>
      fragmentsFromBodyNode(child, source),
    );
  }
  return fragmentsFromExpression(value.expression, source, {
    attributeName: attributeNameString(attribute.name),
    mode: 'attribute',
    range: rangeFromOffsets(source, attribute.start, attribute.end),
  });
}

function attributeNameString(name: JSXIdentifier | JSXNamespacedName): string {
  return name.type === 'JSXIdentifier'
    ? name.name
    : `${name.namespace.name}:${name.name.name}`;
}

function fragmentsFromExpression(
  expression: Expression | JSXEmptyExpression,
  source: string,
  elision?: ElisionContext,
): Fragment[] {
  if (expression.type === 'JSXEmptyExpression') {
    return [];
  }
  if (expression.type === 'JSXElement') {
    return fragmentsFromJsxElement(expression, source);
  }
  if (expression.type === 'JSXFragment') {
    return expression.children.flatMap((child) =>
      fragmentsFromBodyNode(child, source),
    );
  }
  const embedded: (JSXElement | JSXFragment)[] = [];
  collectJsx(expression, embedded);
  return [
    {
      code: source.slice(expression.start, expression.end),
      elision: elision && embedded.length === 0 ? elision : undefined,
      lang: 'ts',
      originalOffset: expression.start,
      type: 'template-expression',
    },
    ...embedded.flatMap((node) => fragmentsFromBodyNode(node, source)),
  ];
}

function collectJsx(
  node: unknown,
  results: (JSXElement | JSXFragment)[],
): void {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectJsx(item, results);
    }
    return;
  }
  const type = (
    node as {
      type?: unknown;
    }
  ).type;
  if (type === 'JSXElement' || type === 'JSXFragment') {
    results.push(node as JSXElement | JSXFragment);
    return;
  }
  for (const value of Object.values(node)) {
    collectJsx(value, results);
  }
}
