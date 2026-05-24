import type { ScriptBlock } from '../type';

const FRONTMATTER_RX = /^---\r?\n([\s\S]*?)\r?\n---/;

export function parseAstro(source: string): ScriptBlock[] {
  const match = FRONTMATTER_RX.exec(source);
  if (match === null) return [];
  const code = match[1] ?? '';
  const firstNewline = source.indexOf('\n');
  if (firstNewline === -1) return [];
  return [
    {
      code,
      lang: 'ts',
      offsetInSource: firstNewline + 1,
    },
  ];
}
