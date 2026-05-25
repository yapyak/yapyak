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
import type MagicString from 'magic-string';
import type { Fragment, Processor } from '../type';

import { rangeFromOffsets } from '../position';
import { createRequire } from 'node:module';

const SCRIPT_SETUP_RX = /<script\s+setup[^>]*>/;
const SCRIPT_RX = /<script[^>]*>/;

const NODE_TYPE_ELEMENT = 1;
const NODE_TYPE_SIMPLE_EXPRESSION = 4;
const NODE_TYPE_INTERPOLATION = 5;
const NODE_TYPE_DIRECTIVE = 7;

const requireFromHere = createRequire(import.meta.url);

let cached: typeof VueSfc | undefined;

export const vueProcessor: Processor = {
  applyImport(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void {
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

  parseFragments(source: string): Fragment[] {
    const compiler = loadCompiler();
    const { descriptor } = compiler.parse(source);
    const fragments: Fragment[] = [];

    if (descriptor.script !== null) {
      fragments.push(toScriptFragment(descriptor.script));
    }
    if (descriptor.scriptSetup !== null) {
      fragments.push(toScriptFragment(descriptor.scriptSetup));
    }
    if (descriptor.template !== null && descriptor.template.ast !== undefined) {
      collectTemplateExpressions(descriptor.template.ast, source, fragments);
    }
    return fragments;
  },
};

function loadCompiler(): typeof VueSfc {
  if (cached !== undefined) {
    return cached;
  }
  try {
    cached = requireFromHere('@vue/compiler-sfc') as typeof VueSfc;
    return cached;
  } catch (error) {
    throw new Error(
      '@vue/compiler-sfc is required to process Vue files. Install it as a dependency.',
      { cause: error },
    );
  }
}

function toScriptFragment(block: SFCScriptBlock): Fragment {
  return {
    code: block.content,
    kind: 'script',
    lang: block.lang === 'ts' || block.lang === 'typescript' ? 'ts' : 'js',
    originalOffset: block.loc.start.offset,
  };
}

function collectTemplateExpressions(
  node: RootNode | TemplateChildNode,
  source: string,
  fragments: Fragment[],
): void {
  if (isInterpolationNode(node)) {
    pushInterpolationExpression(node, source, fragments);
  }
  if (isElementNode(node)) {
    for (const prop of node.props) {
      collectPropExpression(prop, source, fragments);
    }
  }
  if (hasChildren(node)) {
    for (const child of node.children) {
      collectTemplateExpressions(child, source, fragments);
    }
  }
}

function pushInterpolationExpression(
  node: InterpolationNode,
  source: string,
  fragments: Fragment[],
): void {
  const mustache = readMustache(source, node.loc.start.offset);
  if (mustache === undefined) {
    return;
  }
  fragments.push({
    code: mustache.code,
    elision: {
      mode: 'text',
      range: rangeFromOffsets(
        source,
        node.loc.start.offset,
        mustache.endOffset,
      ),
    },
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: mustache.codeOffset,
  });
}

function collectPropExpression(
  prop: AttributeNode | DirectiveNode,
  source: string,
  fragments: Fragment[],
): void {
  if (!isDirectiveNode(prop)) {
    return;
  }
  if (prop.exp === undefined) {
    return;
  }
  pushDirectiveExpression(prop, source, fragments);
}

function pushDirectiveExpression(
  prop: DirectiveNode,
  source: string,
  fragments: Fragment[],
): void {
  const expression = prop.exp;
  if (expression === undefined) {
    return;
  }
  if (!isSimpleExpression(expression)) {
    return;
  }
  if (expression.content === '') {
    return;
  }
  const fragment: Fragment = {
    code: expression.content,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: expression.loc.start.offset,
  };
  const attrName = readVBindAttrName(prop);
  if (attrName !== undefined) {
    fragment.elision = {
      attrName,
      mode: 'attribute',
      range: rangeFromOffsets(
        source,
        prop.loc.start.offset,
        prop.loc.end.offset,
      ),
    };
  }
  fragments.push(fragment);
}

function readVBindAttrName(prop: DirectiveNode): string | undefined {
  if (prop.name !== 'bind') {
    return undefined;
  }
  const arg = prop.arg;
  if (arg === undefined) {
    return undefined;
  }
  if (!isSimpleExpression(arg)) {
    return undefined;
  }
  if (!arg.isStatic) {
    return undefined;
  }
  return arg.content;
}

interface MustacheExpression {
  code: string;
  codeOffset: number;
  endOffset: number;
}

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

function findMustacheClose(source: string, from: number): number {
  let i = from;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'") {
      i = skipString(source, i, ch);
      continue;
    }
    if (ch === '`') {
      i = skipTemplateLiteral(source, i);
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      i = skipLineComment(source, i);
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i = skipBlockComment(source, i);
      continue;
    }
    if (ch === '{') {
      i = skipBalancedBraces(source, i);
      continue;
    }
    if (ch === '}' && source[i + 1] === '}') {
      return i;
    }
    if (ch === '}') {
      return -1;
    }
    i += 1;
  }
  return -1;
}

function skipString(source: string, from: number, quote: string): number {
  let i = from + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return i + 1;
    }
    i += 1;
  }
  return i;
}

function skipTemplateLiteral(source: string, from: number): number {
  let i = from + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') {
      return i + 1;
    }
    if (ch === '$' && source[i + 1] === '{') {
      i = skipBalancedBraces(source, i + 1);
      continue;
    }
    i += 1;
  }
  return i;
}

function skipLineComment(source: string, from: number): number {
  let i = from + 2;
  while (i < source.length && source[i] !== '\n') i += 1;
  return i;
}

function skipBlockComment(source: string, from: number): number {
  let i = from + 2;
  while (i < source.length) {
    if (source[i] === '*' && source[i + 1] === '/') {
      return i + 2;
    }
    i += 1;
  }
  return i;
}

function skipBalancedBraces(source: string, from: number): number {
  let depth = 1;
  let i = from + 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === '"' || ch === "'") {
      i = skipString(source, i, ch);
      continue;
    }
    if (ch === '`') {
      i = skipTemplateLiteral(source, i);
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      i = skipLineComment(source, i);
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i = skipBlockComment(source, i);
      continue;
    }
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') depth -= 1;
    i += 1;
  }
  return i;
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
    Array.isArray((node as { children?: unknown }).children)
  );
}
