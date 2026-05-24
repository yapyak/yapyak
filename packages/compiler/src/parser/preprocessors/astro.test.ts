import { describe, expect, it } from 'vitest';

import { parseAstro } from './astro';

describe('parseAstro', () => {
  it('extracts frontmatter script', () => {
    const source = [
      '---',
      "import { $t } from '@yapyak/core';",
      "const greeting = $t('Hello');",
      '---',
      '<div>{greeting}</div>',
    ].join('\n');
    const blocks = parseAstro(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.lang).toBe('ts');
    expect(blocks[0]?.code).toContain('$t');
  });

  it('returns empty when no frontmatter', () => {
    const source = '<div>Hi</div>';
    expect(parseAstro(source)).toEqual([]);
  });

  it('returns empty for unclosed frontmatter', () => {
    const source = '---\nimport x from "y";\n<div>Hi</div>';
    expect(parseAstro(source)).toEqual([]);
  });

  it('offsets map back to original source', () => {
    const source = '---\nconst x = 1;\n---\n<div />';
    const blocks = parseAstro(source);
    expect(blocks).toHaveLength(1);
    const block = blocks[0];
    if (block === undefined) throw new Error('expected block');
    expect(
      source.slice(
        block.offsetInSource,
        block.offsetInSource + block.code.length,
      ),
    ).toBe(block.code);
  });

  it('handles CRLF line endings', () => {
    const source = '---\r\nconst x = 1;\r\n---\r\n<div />';
    const blocks = parseAstro(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.code).toContain('const x');
  });
});
