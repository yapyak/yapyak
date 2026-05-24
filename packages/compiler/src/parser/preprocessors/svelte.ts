import type { ScriptBlock } from '../type';

const SCRIPT_TAG_RX = /<script((?:\s+[^>]*)?)>([\s\S]*?)<\/script>/g;
const LANG_ATTR_RX = /lang\s*=\s*['"]([^'"]+)['"]/;

export function parseSvelte(source: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];
  for (const match of source.matchAll(SCRIPT_TAG_RX)) {
    const attrs = match[1] ?? '';
    const code = match[2] ?? '';
    const matchStart = match.index;
    const openTagEnd = source.indexOf('>', matchStart);
    if (openTagEnd === -1) continue;
    blocks.push({
      code,
      lang: detectLang(attrs),
      offsetInSource: openTagEnd + 1,
    });
  }
  return blocks;
}

function detectLang(attrs: string): 'js' | 'ts' {
  const match = LANG_ATTR_RX.exec(attrs);
  const value = match?.[1];
  if (value === 'ts' || value === 'typescript') return 'ts';
  return 'js';
}
