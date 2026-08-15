import type {
  AttributeNode,
  DirectiveNode,
  ElementNode,
  ExpressionNode,
  InterpolationNode,
  RootNode,
  SimpleExpressionNode,
  TemplateChildNode,
} from '@vue/compiler-core';
import type * as VueSfc from '@vue/compiler-sfc';
import type { SFCScriptBlock } from '@vue/compiler-sfc';
import type {
  Fragment,
  FragmentSegment,
  Processor,
  ProcessorDiagnostic,
} from 'yapyak/processor';

import {
  createProcessor,
  rangeFromOffsets,
  segmentsFromOffset,
} from 'yapyak/processor';

import { createRequire } from 'node:module';

const SCRIPT_SETUP_RX = /<script\s+setup[^>]*>/;
const SCRIPT_RX = /<script[^>]*>/;

const NODE_TYPE_ELEMENT = 1;
const NODE_TYPE_SIMPLE_EXPRESSION = 4;
const NODE_TYPE_INTERPOLATION = 5;
const NODE_TYPE_DIRECTIVE = 7;

const TAG_TYPE_TEMPLATE = 3;

const requireFromHere = createRequire(import.meta.url);

let cached: typeof VueSfc | undefined;

/**
 * Creates a Vue processor for yapyak's compiler.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { vue } from '@yapyak/vue/processor';
 *
 * export default defineConfig({
 *   processors: [vue()]
 * });
 * ```
 */
export function vue(): Processor {
  return createProcessor({
    applyImport: (magicString, source, importStatement) => {
      const setupMatch = SCRIPT_SETUP_RX.exec(source);
      if (setupMatch !== null) {
        const insertAt = setupMatch.index + setupMatch[0].length;
        magicString.appendRight(insertAt, `\n${importStatement}`);
        return;
      }
      const scriptMatch = SCRIPT_RX.exec(source);
      if (scriptMatch !== null) {
        const insertAt = scriptMatch.index + scriptMatch[0].length;
        magicString.appendRight(insertAt, `\n${importStatement}`);
        return;
      }
      magicString.prepend(`<script setup>\n${importStatement}\n</script>\n`);
    },
    extensions: [
      '.vue',
    ],
    id: 'vue',
    parseSource: (source) => {
      const compiler = loadCompiler();
      const { descriptor, errors } = compiler.parse(source, {
        templateParseOptions: {
          prefixIdentifiers: false,
        },
      });
      const fragments: Fragment[] = [];

      if (descriptor.script !== null) {
        fragments.push(toScriptFragment(descriptor.script));
      }
      if (descriptor.scriptSetup !== null) {
        fragments.push(toScriptFragment(descriptor.scriptSetup));
      }
      if (descriptor.template?.ast) {
        fragments.push(
          ...fragmentsFromTemplate(descriptor.template.ast, source),
        );
      }
      return {
        diagnostics: toProcessorDiagnostics(errors, source),
        fragments,
      };
    },
    runtime: {
      module: '@yapyak/vue/internal',
      register: 'registerLocale',
    },
  });
}

function toProcessorDiagnostics(
  errors: VueSfc.SFCParseResult['errors'],
  source: string,
): ProcessorDiagnostic[] {
  return errors.map((error) => {
    const location = 'loc' in error ? error.loc : undefined;
    const start = location?.start.offset ?? 0;
    return {
      message: error.message,
      range: rangeFromOffsets(source, start, location?.end.offset ?? start),
    };
  });
}

function loadCompiler(): typeof VueSfc {
  if (cached) {
    return cached;
  }
  try {
    cached = requireFromHere('@vue/compiler-sfc') as typeof VueSfc;
    return cached;
  } catch (error) {
    throw new Error(
      '@vue/compiler-sfc is required to process Vue files. Install it as a dependency.',
      {
        cause: error,
      },
    );
  }
}

function toScriptFragment(block: SFCScriptBlock): Fragment {
  return {
    code: block.content,
    language: block.lang === 'ts' || block.lang === 'typescript' ? 'ts' : 'js',
    segments: segmentsFromOffset(block.content, block.loc.start.offset),
    type: 'script',
  };
}

type EnclosingContext = {
  element: string;
  snippet: string;
};

function getEnclosingContext(
  node: ElementNode,
  source: string,
): EnclosingContext {
  return {
    element: node.tag,
    snippet: source.slice(node.loc.start.offset, node.loc.end.offset),
  };
}

function fragmentsFromTemplate(
  node: RootNode | TemplateChildNode,
  source: string,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  const fragments: Fragment[] = [];
  if (isInterpolationNode(node)) {
    fragments.push(
      ...fragmentsFromInterpolation(node, source, enclosingContext),
    );
  }
  if (isElementNode(node)) {
    const context = getEnclosingContext(node, source);
    for (const prop of node.props) {
      fragments.push(...fragmentsFromProp(prop, source, context));
    }
  }
  if (hasChildren(node)) {
    const childContext =
      isElementNode(node) && node.tagType !== TAG_TYPE_TEMPLATE
        ? getEnclosingContext(node, source)
        : enclosingContext;
    for (const child of node.children) {
      fragments.push(...fragmentsFromTemplate(child, source, childContext));
    }
  }
  return fragments;
}

function fragmentsFromInterpolation(
  node: InterpolationNode,
  source: string,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  const mustache = readMustache(source, node.loc.start.offset);
  if (!mustache) {
    return [];
  }
  const fragment: Fragment = {
    code: mustache.code,
    elisionContext: {
      mode: 'text',
      range: rangeFromOffsets(
        source,
        node.loc.start.offset,
        mustache.endOffset,
      ),
    },
    language: 'ts',
    segments: segmentsFromOffset(mustache.code, mustache.codeOffset),
    type: 'template-expression',
  };
  if (enclosingContext) {
    fragment.enclosingElement = enclosingContext.element;
    fragment.snippet = enclosingContext.snippet;
  }
  return [
    fragment,
  ];
}

function fragmentsFromProp(
  prop: AttributeNode | DirectiveNode,
  source: string,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  if (!isDirectiveNode(prop)) {
    return [];
  }
  if (!prop.exp) {
    return [];
  }
  return fragmentsFromDirective(prop, source, enclosingContext);
}

function fragmentsFromDirective(
  prop: DirectiveNode,
  source: string,
  enclosingContext?: EnclosingContext,
): Fragment[] {
  const expression = prop.exp;
  if (!expression) {
    return [];
  }
  if (!isSimpleExpression(expression)) {
    return [];
  }
  if (expression.content === '') {
    return [];
  }
  const fragment: Fragment = {
    code: expression.content,
    language: 'ts',
    segments: segmentsFromDecoded(
      source,
      expression.loc.start.offset,
      expression.content,
    ),
    type: 'template-expression',
  };
  const attributeName = readVBindAttributeName(prop);
  if (attributeName) {
    fragment.elisionContext = {
      attributeName,
      mode: 'attribute',
      range: rangeFromOffsets(
        source,
        prop.loc.start.offset,
        prop.loc.end.offset,
      ),
    };
  }
  if (enclosingContext) {
    fragment.enclosingElement = enclosingContext.element;
    fragment.snippet = enclosingContext.snippet;
  }
  return [
    fragment,
  ];
}

const HIGHEST_SINGLE_UNIT_CODE_POINT = 0xff_ff;

function segmentsFromDecoded(
  source: string,
  sourceStart: number,
  decoded: string,
): FragmentSegment[] {
  const segments: FragmentSegment[] = [];
  let sourceIndex = sourceStart;
  let decodedIndex = 0;
  let runStart = sourceStart;
  let runLength = 0;
  while (decodedIndex < decoded.length) {
    const entity = readEntity(source, sourceIndex, decoded, decodedIndex);
    if (entity === undefined) {
      runLength += 1;
      sourceIndex += 1;
      decodedIndex += 1;
      continue;
    }
    if (runLength > 0) {
      segments.push({
        codeLength: runLength,
        sourceOffset: runStart,
      });
    }
    const codePoint = decoded.codePointAt(decodedIndex);
    const codeLength =
      codePoint !== undefined && codePoint > HIGHEST_SINGLE_UNIT_CODE_POINT
        ? 2
        : 1;
    segments.push({
      codeLength,
      sourceOffset: sourceIndex,
    });
    sourceIndex += entity.length;
    decodedIndex += codeLength;
    runStart = sourceIndex;
    runLength = 0;
  }
  if (runLength > 0) {
    segments.push({
      codeLength: runLength,
      sourceOffset: runStart,
    });
  }
  return segments;
}

const ENTITY_RX = /^&(?:#\d+|#[Xx][\dA-Fa-f]+|[A-Za-z][\dA-Za-z]*);?/;

function readEntity(
  source: string,
  sourceIndex: number,
  decoded: string,
  decodedIndex: number,
): string | undefined {
  if (source[sourceIndex] !== '&') {
    return undefined;
  }
  const match = ENTITY_RX.exec(source.slice(sourceIndex));
  if (match === null) {
    return undefined;
  }
  if (decoded.startsWith(match[0], decodedIndex)) {
    return undefined;
  }
  return match[0];
}

function readVBindAttributeName(prop: DirectiveNode): string | undefined {
  if (prop.name !== 'bind') {
    return undefined;
  }
  const directiveArgument = prop.arg;
  if (!directiveArgument) {
    return undefined;
  }
  if (!isSimpleExpression(directiveArgument)) {
    return undefined;
  }
  if (!directiveArgument.isStatic) {
    return undefined;
  }
  return directiveArgument.content;
}

type MustacheExpression = {
  code: string;
  codeOffset: number;
  endOffset: number;
};

function readMustache(
  source: string,
  openOffset: number,
): MustacheExpression | undefined {
  if (source[openOffset] !== '{' || source[openOffset + 1] !== '{') {
    return undefined;
  }
  const exprStart = openOffset + 2;
  const exprEnd = findMustacheClose(source, exprStart);
  if (exprEnd === -1) {
    return undefined;
  }
  const raw = source.slice(exprStart, exprEnd);
  const leading = raw.length - raw.trimStart().length;
  const code = raw.slice(leading).trimEnd();
  if (code === '') {
    return undefined;
  }
  return {
    code,
    codeOffset: exprStart + leading,
    endOffset: exprEnd + 2,
  };
}

const WHITESPACE_RX = /\s/;

function findMustacheClose(source: string, from: number): number {
  let index = from;
  let previousCharacter: string | undefined;
  while (index < source.length) {
    const character = source[index];
    if (character === '"' || character === "'") {
      index = skipString(source, index, character);
      previousCharacter = character;
      continue;
    }
    if (character === '`') {
      index = skipTemplateLiteral(source, index);
      previousCharacter = character;
      continue;
    }
    if (character === '/' && source[index + 1] === '/') {
      index = skipLineComment(source, index);
      continue;
    }
    if (character === '/' && source[index + 1] === '*') {
      index = skipBlockComment(source, index);
      continue;
    }
    if (character === '/' && isRegexStart(previousCharacter)) {
      index = skipRegex(source, index);
      previousCharacter = '/';
      continue;
    }
    if (character === '{') {
      index = skipBalancedBraces(source, index);
      previousCharacter = '}';
      continue;
    }
    if (character === '}' && source[index + 1] === '}') {
      return index;
    }
    if (character === '}') {
      return -1;
    }
    if (character !== undefined && !WHITESPACE_RX.test(character)) {
      previousCharacter = character;
    }
    index += 1;
  }
  return -1;
}

function skipString(source: string, from: number, quote: string): number {
  let index = from + 1;
  while (index < source.length) {
    const character = source[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    if (character === quote) {
      return index + 1;
    }
    index += 1;
  }
  return index;
}

function skipTemplateLiteral(source: string, from: number): number {
  let index = from + 1;
  while (index < source.length) {
    const character = source[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    if (character === '`') {
      return index + 1;
    }
    if (character === '$' && source[index + 1] === '{') {
      index = skipBalancedBraces(source, index + 1);
      continue;
    }
    index += 1;
  }
  return index;
}

function skipLineComment(source: string, from: number): number {
  let index = from + 2;
  while (index < source.length && source[index] !== '\n') {
    index += 1;
  }
  return index;
}

function skipBlockComment(source: string, from: number): number {
  let index = from + 2;
  while (index < source.length) {
    if (source[index] === '*' && source[index + 1] === '/') {
      return index + 2;
    }
    index += 1;
  }
  return index;
}

const DIVISION_OPERAND_END_RX = /[A-Za-z0-9_$)\]}'"`/]/;

function isRegexStart(previousCharacter: string | undefined): boolean {
  if (previousCharacter === undefined) {
    return true;
  }
  return !DIVISION_OPERAND_END_RX.test(previousCharacter);
}

function skipRegex(source: string, from: number): number {
  let index = from + 1;
  let isInCharacterClass = false;
  while (index < source.length) {
    const character = source[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    if (character === '[') {
      isInCharacterClass = true;
      index += 1;
      continue;
    }
    if (character === ']') {
      isInCharacterClass = false;
      index += 1;
      continue;
    }
    if (character === '/' && !isInCharacterClass) {
      return index + 1;
    }
    if (character === '\n') {
      return index;
    }
    index += 1;
  }
  return index;
}

function skipBalancedBraces(source: string, from: number): number {
  let depth = 1;
  let index = from + 1;
  let previousCharacter: string | undefined;
  while (index < source.length && depth > 0) {
    const character = source[index];
    if (character === '"' || character === "'") {
      index = skipString(source, index, character);
      previousCharacter = character;
      continue;
    }
    if (character === '`') {
      index = skipTemplateLiteral(source, index);
      previousCharacter = character;
      continue;
    }
    if (character === '/' && source[index + 1] === '/') {
      index = skipLineComment(source, index);
      continue;
    }
    if (character === '/' && source[index + 1] === '*') {
      index = skipBlockComment(source, index);
      continue;
    }
    if (character === '/' && isRegexStart(previousCharacter)) {
      index = skipRegex(source, index);
      previousCharacter = '/';
      continue;
    }
    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
    }
    if (character !== undefined && !WHITESPACE_RX.test(character)) {
      previousCharacter = character;
    }
    index += 1;
  }
  return index;
}

function isInterpolationNode(
  node: RootNode | TemplateChildNode,
): node is InterpolationNode {
  return node.type === NODE_TYPE_INTERPOLATION;
}

function isElementNode(
  node: RootNode | TemplateChildNode,
): node is ElementNode {
  return node.type === NODE_TYPE_ELEMENT;
}

function isDirectiveNode(
  prop: AttributeNode | DirectiveNode,
): prop is DirectiveNode {
  return prop.type === NODE_TYPE_DIRECTIVE;
}

function isSimpleExpression(
  expression: ExpressionNode,
): expression is SimpleExpressionNode {
  return expression.type === NODE_TYPE_SIMPLE_EXPRESSION;
}

function hasChildren(node: RootNode | TemplateChildNode): node is (
  | RootNode
  | TemplateChildNode
) & {
  children: TemplateChildNode[];
} {
  return (
    'children' in node &&
    Array.isArray(
      (
        node as {
          children?: unknown;
        }
      ).children,
    )
  );
}
