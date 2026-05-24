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
      collectTemplateExpressions(descriptor.template.ast, fragments);
    }
    return fragments;
  },
};

function loadCompiler(): typeof VueSfc {
  if (cached !== undefined) return cached;
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
  fragments: Fragment[],
): void {
  if (isInterpolationNode(node)) {
    pushExpression(node.content, fragments);
  }
  if (isElementNode(node)) {
    for (const prop of node.props) {
      collectPropExpression(prop, fragments);
    }
  }
  if (hasChildren(node)) {
    for (const child of node.children) {
      collectTemplateExpressions(child, fragments);
    }
  }
}

function collectPropExpression(
  prop: AttributeNode | DirectiveNode,
  fragments: Fragment[],
): void {
  if (!isDirectiveNode(prop)) return;
  if (prop.exp === undefined) return;
  pushExpression(prop.exp, fragments);
}

function pushExpression(
  expression: ExpressionNode,
  fragments: Fragment[],
): void {
  if (!isSimpleExpression(expression)) return;
  if (expression.content === '') return;
  fragments.push({
    code: expression.content,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: expression.loc.start.offset,
  });
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
