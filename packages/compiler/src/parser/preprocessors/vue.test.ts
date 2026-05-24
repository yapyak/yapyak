import { describe, expect, it } from 'vitest';

import { parseVue } from './vue';

describe('parseVue', () => {
  it('extracts <script lang="ts">', () => {
    const source = [
      '<script lang="ts">',
      "import { $t } from '@yapyak/core';",
      "export const x = $t('Hello');",
      '</script>',
      '<template><div>Hi</div></template>',
    ].join('\n');
    const blocks = parseVue(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.lang).toBe('ts');
    expect(blocks[0]?.code).toContain('$t');
    expect(blocks[0]?.offsetInSource).toBeGreaterThan(0);
  });

  it('extracts <script setup>', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      "const greeting = $t('Hello');",
      '</script>',
      '<template><div>{{ greeting }}</div></template>',
    ].join('\n');
    const blocks = parseVue(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.code).toContain('greeting');
  });

  it('extracts both <script> and <script setup>', () => {
    const source = [
      '<script lang="ts">',
      'export default { name: "Hi" };',
      '</script>',
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      "const greeting = $t('Hello');",
      '</script>',
      '<template><div>{{ greeting }}</div></template>',
    ].join('\n');
    const blocks = parseVue(source);
    expect(blocks).toHaveLength(2);
  });

  it('reports js for no lang attribute', () => {
    const source = [
      '<script>',
      "export default { name: 'Greeting' };",
      '</script>',
    ].join('\n');
    const blocks = parseVue(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.lang).toBe('js');
  });

  it('returns empty when no script block', () => {
    const source = '<template><div>Hi</div></template>';
    expect(parseVue(source)).toEqual([]);
  });

  it('offsets map back to original source', () => {
    const prefix = '<template>before</template>\n<script lang="ts">\n';
    const code = 'const x = 1;\n';
    const source = `${prefix}${code}</script>`;
    const blocks = parseVue(source);
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
