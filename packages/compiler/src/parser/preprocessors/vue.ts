import type * as VueSfc from '@vue/compiler-sfc';
import type { ScriptBlock } from '../type';

import { createRequire } from 'node:module';

const requireFromHere = createRequire(import.meta.url);

let cached: typeof VueSfc | undefined;

export function parseVue(source: string): ScriptBlock[] {
  const compiler = loadCompiler();
  const { descriptor } = compiler.parse(source);
  const blocks: ScriptBlock[] = [];
  if (descriptor.script !== null) {
    blocks.push(toBlock(descriptor.script));
  }
  if (descriptor.scriptSetup !== null) {
    blocks.push(toBlock(descriptor.scriptSetup));
  }
  return blocks;
}

function loadCompiler(): typeof VueSfc {
  if (cached !== undefined) return cached;
  try {
    cached = requireFromHere('@vue/compiler-sfc') as typeof VueSfc;
    return cached;
  } catch (error) {
    throw new Error(
      '@vue/compiler-sfc is required to preprocess Vue files. Install it as a dependency.',
      { cause: error },
    );
  }
}

function toBlock(sfcBlock: VueSfc.SFCBlock): ScriptBlock {
  return {
    code: sfcBlock.content,
    lang:
      sfcBlock.lang === 'ts' || sfcBlock.lang === 'typescript' ? 'ts' : 'js',
    offsetInSource: sfcBlock.loc.start.offset,
  };
}
