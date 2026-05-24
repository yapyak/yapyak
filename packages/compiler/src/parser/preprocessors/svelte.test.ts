import { describe, expect, it } from 'vitest';

import { parseSvelte } from './svelte';

describe('parseSvelte', () => {
  it('extracts <script lang="ts">', () => {
    const source = [
      '<script lang="ts">',
      "  import { $t } from '@yapyak/core';",
      "  let greeting = $t('Hello');",
      '</script>',
      '<div>{greeting}</div>',
    ].join('\n');
    const blocks = parseSvelte(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.lang).toBe('ts');
    expect(blocks[0]?.code).toContain('$t');
  });

  it('defaults lang to js without attribute', () => {
    const source = ['<script>', 'let x = 1;', '</script>'].join('\n');
    const blocks = parseSvelte(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.lang).toBe('js');
  });

  it('extracts multiple script blocks (module + instance)', () => {
    const source = [
      '<script context="module" lang="ts">',
      '  export const stored = 1;',
      '</script>',
      '<script lang="ts">',
      '  let x = 1;',
      '</script>',
    ].join('\n');
    const blocks = parseSvelte(source);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.code).toContain('stored');
    expect(blocks[1]?.code).toContain('let x');
  });

  it('returns empty when no script block', () => {
    const source = '<div>Hi</div>';
    expect(parseSvelte(source)).toEqual([]);
  });

  it('offsets map back to original source', () => {
    const source =
      '<div>before</div>\n<script lang="ts">\nconst x = 1;\n</script>';
    const blocks = parseSvelte(source);
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
});
