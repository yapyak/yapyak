import type { DiagnosticLabel, DiagnosticMessage } from '@astrojs/compiler-rs';
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
import type {
  ElisionContext,
  Fragment,
  FragmentSegment,
  Processor,
  ProcessorDiagnostic,
  Range,
} from 'yapyak/processor';

import { parse } from '@astrojs/compiler-rs';
import {
  createProcessor,
  rangeFromOffsets,
  segmentsFromOffset,
} from 'yapyak/processor';

const FRONTMATTER_DELIMITER = '---';

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
      const frontmatter = (parse(source).ast as AstroRoot).frontmatter;
      if (frontmatter.end > frontmatter.start) {
        const fenceStart = source.indexOf(FRONTMATTER_DELIMITER);
        const fenceLineEnd = source.indexOf('\n', fenceStart) + 1;
        magicString.appendRight(fenceLineEnd, `${importStatement}\n`);
        return;
      }
      magicString.prepend(`${importStatement}\n`);
    },
    extensions: [
      '.astro',
    ],
    id: 'astro',
    parseSource: (source) => {
      const result = parse(source);
      const ast = result.ast as AstroRoot;
      if (ast.frontmatter.end === ast.frontmatter.start) {
        return {
          fragments: [
            {
              code: source,
              language: 'ts',
              scope: 'instance',
              segments: segmentsFromOffset(source, 0),
              type: 'script',
            },
          ],
        };
      }
      normalizeOffsets(
        {
          ast,
          diagnostics: result.diagnostics,
        },
        source,
      );
      return {
        diagnostics: toProcessorDiagnostics(result.diagnostics, source),
        fragments: [
          fragmentsFromFrontmatter(ast.frontmatter, source),
          ...ast.body.flatMap((node) => fragmentsFromBodyNode(node, source)),
        ],
      };
    },
    skipHmrCallback: true,
  });
}

function normalizeOffsets(parsed: object, source: string): void {
  if (!hasNonAscii(source)) {
    return;
  }
  remapOffsets(parsed, buildUtf16Offsets(source));
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

function toProcessorDiagnostics(
  diagnostics: DiagnosticMessage[],
  source: string,
): ProcessorDiagnostic[] {
  const result: ProcessorDiagnostic[] = [];
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity !== 'error') {
      continue;
    }
    result.push({
      message: diagnostic.text,
      range: toLabelRange(diagnostic.labels, source),
    });
  }
  return result;
}

function toLabelRange(labels: DiagnosticLabel[], source: string): Range {
  const label = labels[0];
  if (label === undefined) {
    return rangeFromOffsets(source, 0, 0);
  }
  return rangeFromOffsets(source, label.start, label.end);
}

function fragmentsFromFrontmatter(
  frontmatter: AstroFrontmatter,
  source: string,
): Fragment {
  const fenceStart = source.indexOf(FRONTMATTER_DELIMITER, frontmatter.start);
  const codeStart = fenceStart + FRONTMATTER_DELIMITER.length;
  const codeEnd = frontmatter.end - FRONTMATTER_DELIMITER.length;
  const code = source.slice(codeStart, codeEnd);
  return {
    code,
    language: 'tsx',
    scope: 'instance',
    segments: segmentsFromOffset(code, codeStart),
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
  const masked = buildFragmentCode(source, range, embedded);
  const fragment: Fragment = {
    code: masked.code,
    elisionContext:
      elisionContext && embedded.length === 0 ? elisionContext : undefined,
    language: 'ts',
    scope: 'instance',
    segments: masked.segments,
    type: 'template-expression',
  };
  if (elisionContext?.mode === 'attribute' && elisionContext.attributeName) {
    fragment.enclosingAttribute = elisionContext.attributeName;
  }
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

const JSX_PLACEHOLDER = '0';

function buildFragmentCode(
  source: string,
  range: OffsetRange,
  embedded: (JSXElement | JSXFragment)[],
): Pick<Fragment, 'code' | 'segments'> {
  const ranges: OffsetRange[] = [];
  for (const node of embedded) {
    const embeddedRange = findOffsetRange(node);
    if (embeddedRange !== undefined) {
      ranges.push(embeddedRange);
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const segments: FragmentSegment[] = [];
  let code = '';
  let cursor = range.start;
  for (const embeddedRange of ranges) {
    const verbatim = source.slice(cursor, embeddedRange.start);
    if (verbatim.length > 0) {
      code += verbatim;
      segments.push({
        codeLength: verbatim.length,
        sourceOffset: cursor,
      });
    }
    code += JSX_PLACEHOLDER;
    segments.push({
      codeLength: JSX_PLACEHOLDER.length,
      sourceOffset: embeddedRange.start,
    });
    cursor = embeddedRange.end;
  }
  const tail = source.slice(cursor, range.end);
  if (tail.length > 0) {
    code += tail;
    segments.push({
      codeLength: tail.length,
      sourceOffset: cursor,
    });
  }
  return {
    code,
    segments,
  };
}
