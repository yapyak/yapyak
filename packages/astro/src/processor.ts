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
            language: 'ts',
            originalOffset: 0,
            type: 'script',
          },
        ];
      }
      const ast = parse(source).ast as AstroRoot;
      normalizeOffsets(ast, source);
      return [
        fragmentsFromFrontmatter(ast.frontmatter, source),
        ...ast.body.flatMap((node) => fragmentsFromBodyNode(node, source)),
      ];
    },
    skipHmrCallback: true,
  });
}

function normalizeOffsets(root: AstroRoot, source: string): void {
  if (!hasNonAscii(source)) {
    return;
  }
  remapOffsets(root, buildUtf16Offsets(source));
}

const HIGHEST_ASCII_CODE = 0x7f;

function hasNonAscii(source: string): boolean {
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) > HIGHEST_ASCII_CODE) {
      return true;
    }
  }
  return false;
}

function buildUtf16Offsets(source: string): number[] {
  const utf16Offsets: number[] = [];
  let utf16Offset = 0;
  for (const character of source) {
    const byteLength = toUtf8Length(character);
    for (let byte = 0; byte < byteLength; byte += 1) {
      utf16Offsets.push(utf16Offset);
    }
    utf16Offset += character.length;
  }
  utf16Offsets.push(utf16Offset);
  return utf16Offsets;
}

const HIGHEST_TWO_BYTE_CODE = 0x7_ff;

function toUtf8Length(character: string): number {
  if (character.length === 2) {
    return 4;
  }
  const code = character.charCodeAt(0);
  if (code <= HIGHEST_ASCII_CODE) {
    return 1;
  }
  if (code <= HIGHEST_TWO_BYTE_CODE) {
    return 2;
  }
  return 3;
}

function remapOffsets(node: unknown, utf16Offsets: number[]): void {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      remapOffsets(child, utf16Offsets);
    }
    return;
  }
  const range = node as {
    end?: unknown;
    start?: unknown;
  };
  if (typeof range.start === 'number') {
    range.start = utf16OffsetFromByte(utf16Offsets, range.start);
  }
  if (typeof range.end === 'number') {
    range.end = utf16OffsetFromByte(utf16Offsets, range.end);
  }
  for (const value of Object.values(node)) {
    remapOffsets(value, utf16Offsets);
  }
}

function utf16OffsetFromByte(
  utf16Offsets: number[],
  byteOffset: number,
): number {
  const utf16Offset = utf16Offsets[byteOffset];
  if (utf16Offset === undefined) {
    throw new Error(
      `[yapyak] The Astro compiler reported offset ${byteOffset}, which is outside the source file.`,
    );
  }
  return utf16Offset;
}

function fragmentsFromFrontmatter(
  frontmatter: AstroFrontmatter,
  source: string,
): Fragment {
  const codeStart = frontmatter.start + FRONTMATTER_DELIMITER_LENGTH;
  const codeEnd = frontmatter.end - FRONTMATTER_DELIMITER_LENGTH;
  return {
    code: source.slice(codeStart, codeEnd),
    language: 'ts',
    originalOffset: codeStart,
    type: 'script',
  };
}

type EnclosingContext = {
  element: string;
  snippet: string;
};

function getEnclosingContext(
  node: JSXElement,
  source: string,
): EnclosingContext | undefined {
  const name = node.openingElement.name;
  if (name.type !== 'JSXIdentifier') {
    return undefined;
  }
  const range = findOffsetRange(node);
  if (range === undefined) {
    return undefined;
  }
  return {
    element: name.name,
    snippet: source.slice(range.start, range.end),
  };
}

type OffsetRange = {
  end: number;
  start: number;
};

function findOffsetRange(node: unknown): OffsetRange | undefined {
  const { end, start } = node as {
    end?: unknown;
    start?: unknown;
  };
  if (typeof start !== 'number' || typeof end !== 'number') {
    return undefined;
  }
  return {
    end,
    start,
  };
}

function fragmentsFromBodyNode(
  node: BodyNode,
  source: string,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  if (node.type === 'JSXElement') {
    return fragmentsFromJsxElement(node, source);
  }
  if (node.type === 'JSXFragment') {
    return node.children.flatMap((child) =>
      fragmentsFromBodyNode(child, source, enclosingContext),
    );
  }
  if (node.type === 'JSXExpressionContainer') {
    const range = findOffsetRange(node);
    return fragmentsFromExpression(
      node.expression,
      source,
      range === undefined
        ? undefined
        : {
            mode: 'text',
            range: rangeFromOffsets(source, range.start, range.end),
          },
      enclosingContext,
    );
  }
  if (node.type === 'JSXSpreadChild') {
    return fragmentsFromExpression(
      node.expression,
      source,
      undefined,
      enclosingContext,
    );
  }
  return [];
}

function fragmentsFromJsxElement(node: JSXElement, source: string): Fragment[] {
  const enclosingContext = getEnclosingContext(node, source);
  return [
    ...node.openingElement.attributes.flatMap((attribute) =>
      fragmentsFromAttribute(attribute, source, enclosingContext),
    ),
    ...node.children.flatMap((child) =>
      fragmentsFromBodyNode(child, source, enclosingContext),
    ),
  ];
}

function fragmentsFromAttribute(
  attribute: JSXAttribute | JSXSpreadAttribute,
  source: string,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  if (attribute.type === 'JSXSpreadAttribute') {
    return fragmentsFromExpression(
      attribute.argument,
      source,
      undefined,
      enclosingContext,
    );
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
      fragmentsFromBodyNode(child, source, enclosingContext),
    );
  }
  const range = findOffsetRange(attribute);
  return fragmentsFromExpression(
    value.expression,
    source,
    range === undefined
      ? undefined
      : {
          attributeName: readAttributeName(attribute.name),
          mode: 'attribute',
          range: rangeFromOffsets(source, range.start, range.end),
        },
    enclosingContext,
  );
}

function readAttributeName(name: JSXIdentifier | JSXNamespacedName): string {
  return name.type === 'JSXIdentifier'
    ? name.name
    : `${name.namespace.name}:${name.name.name}`;
}

function fragmentsFromExpression(
  expression: Expression | JSXEmptyExpression,
  source: string,
  elisionContext?: ElisionContext,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  if (expression.type === 'JSXEmptyExpression') {
    return [];
  }
  if (expression.type === 'JSXElement') {
    return fragmentsFromJsxElement(expression, source);
  }
  if (expression.type === 'JSXFragment') {
    return expression.children.flatMap((child) =>
      fragmentsFromBodyNode(child, source, enclosingContext),
    );
  }
  const range = findOffsetRange(expression);
  if (range === undefined) {
    return [];
  }
  const embedded: (JSXElement | JSXFragment)[] = [];
  collectJsx(expression, embedded);
  const fragment: Fragment = {
    code: source.slice(range.start, range.end),
    elisionContext:
      elisionContext && embedded.length === 0 ? elisionContext : undefined,
    language: 'ts',
    originalOffset: range.start,
    type: 'template-expression',
  };
  if (enclosingContext) {
    fragment.enclosingElement = enclosingContext.element;
    fragment.snippet = enclosingContext.snippet;
  }
  return [
    fragment,
    ...embedded.flatMap((node) =>
      fragmentsFromBodyNode(node, source, enclosingContext),
    ),
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
