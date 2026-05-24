import type * as VueSfc from '@vue/compiler-sfc';
import type { SFCScriptBlock } from '@vue/compiler-sfc';
import type { Fragment, Processor } from '../type';

import { createRequire } from 'node:module';

const ELEMENT_NODE = 1;
const SIMPLE_EXPRESSION = 4;
const INTERPOLATION_NODE = 5;
const DIRECTIVE_NODE = 7;

interface VueExpression {
  content: string;
  loc: { start: { offset: number } };
  type: number;
}

interface VueProp {
  exp?: VueExpression;
  type: number;
}

interface VueNode {
  children?: VueNode[];
  content?: VueExpression;
  loc: { start: { offset: number } };
  props?: VueProp[];
  type: number;
}

const requireFromHere = createRequire(import.meta.url);

let cached: typeof VueSfc | undefined;

export const vueProcessor: Processor = {
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
      collectTemplateExpressions(descriptor.template.ast as VueNode, fragments);
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
  node: VueNode,
  fragments: Fragment[],
): void {
  if (node.type === INTERPOLATION_NODE && node.content !== undefined) {
    pushExpression(node.content, fragments);
  }
  if (node.type === ELEMENT_NODE && node.props !== undefined) {
    for (const prop of node.props) {
      collectPropExpression(prop, fragments);
    }
  }
  if (node.children !== undefined) {
    for (const child of node.children) {
      collectTemplateExpressions(child, fragments);
    }
  }
}

function collectPropExpression(prop: VueProp, fragments: Fragment[]): void {
  if (prop.type !== DIRECTIVE_NODE) return;
  if (prop.exp === undefined) return;
  pushExpression(prop.exp, fragments);
}

function pushExpression(
  expression: VueExpression,
  fragments: Fragment[],
): void {
  if (expression.type !== SIMPLE_EXPRESSION) return;
  if (expression.content === '') return;
  fragments.push({
    code: expression.content,
    kind: 'template-expression',
    lang: 'ts',
    originalOffset: expression.loc.start.offset,
  });
}
