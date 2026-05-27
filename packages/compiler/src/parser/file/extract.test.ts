import type { ExtractFileResult } from './extract';

import { describe, expect, it } from 'vitest';

import { extractFile } from './extract';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'fixtures');

function extractFixture(
  category: string,
  name: string,
  locales: readonly string[] = ['en'],
): ExtractFileResult {
  const source = readFileSync(join(ROOT, category, name), 'utf-8');
  return extractFile({ fileId: name, locales, source });
}

describe('extractFile', () => {
  it('returns messages from direct import calls', () => {
    const result = extractFixture('calls', 'simple.ts');
    expect(result.messages).toHaveLength(2);
    const sources = result.messages.map((m) => m.source).sort();
    expect(sources).toEqual(['Goodbye', 'Hello']);
  });

  it('returns placeholders for messages with interpolation', () => {
    const result = extractFixture('calls', 'placeholders.ts');
    expect(result.messages).toHaveLength(2);
    const greeting = result.messages.find((m) => m.source === 'Hi {name}');
    expect(greeting?.placeholders).toEqual([{ kind: 'simple', name: 'name' }]);
  });

  it('folds identical calls into one message with multiple locations', () => {
    const result = extractFile({
      fileId: 'multi.ts',
      locales: ['en'],
      source: `
        import { t } from 'yapyak';
        export const a = t('Hello');
        export const b = t('Hello');
      `,
    });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.locations).toHaveLength(2);
  });

  it('returns call-site context per location', () => {
    const result = extractFixture('calls', 'nested-jsx.tsx');
    expect(result.messages).toHaveLength(3);
    for (const message of result.messages) {
      expect(message.locations[0]?.callSiteContext.componentName).toBe(
        'Greeting',
      );
    }
  });

  it('returns stable ids across runs', () => {
    const first = extractFixture('calls', 'simple.ts');
    const second = extractFixture('calls', 'simple.ts');
    expect(first.messages.map((m) => m.id)).toEqual(
      second.messages.map((m) => m.id),
    );
  });

  it('returns every discovered call-site in `callSites` for transform reuse', () => {
    const result = extractFixture('calls', 'nested-jsx.tsx');
    expect(result.callSites).toHaveLength(3);
  });

  it('parses `.tsx` fixtures with JSX', () => {
    const result = extractFixture('calls', 'nested-jsx.tsx');
    expect(
      result.diagnostics.filter((d) => d.severity === 'error'),
    ).toHaveLength(0);
    expect(result.messages).toHaveLength(3);
  });

  describe('diagnostics', () => {
    it('returns no diagnostics for clean fixtures', () => {
      const result = extractFixture('calls', 'simple.ts');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('emits YPK001 from `parse-arguments`', () => {
      const result = extractFixture('diagnostics', 'ypk001-dynamic-source.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK001')).toBe(true);
    });

    it('emits YPK002 from `parse-arguments`', () => {
      const result = extractFixture('diagnostics', 'ypk002-missing-param.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK002')).toBe(true);
    });

    it('emits YPK007 from `parse-arguments`', () => {
      const result = extractFixture('diagnostics', 'ypk007-invalid-plural.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK007')).toBe(true);
    });
  });

  describe('with Vue cross-fragment binding', () => {
    it('returns template messages resolved against `<script setup>` import', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <h1>{{ t('Welcome') }}</h1>`,
        '</template>',
      ].join('\n');
      const result = extractFile({
        fileId: 'app.vue',
        locales: ['en'],
        source,
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]?.source).toBe('Welcome');
    });

    it('returns messages from both script and template under one import', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        "const inScript = t('From script');",
        '</script>',
        '<template>',
        `  <h1>{{ t('From template') }}</h1>`,
        `  <button :aria-label="t('Button label')">x</button>`,
        '</template>',
      ].join('\n');
      const result = extractFile({
        fileId: 'app.vue',
        locales: ['en'],
        source,
      });
      const sources = result.messages.map((m) => m.source).sort();
      expect(sources).toEqual(['Button label', 'From script', 'From template']);
    });

    it('returns template messages resolved against plain `<script>`', () => {
      const source = [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        "export default { name: 'X' };",
        '</script>',
        '<template>',
        `  <h1>{{ t('Welcome') }}</h1>`,
        '</template>',
      ].join('\n');
      const result = extractFile({
        fileId: 'app.vue',
        locales: ['en'],
        source,
      });
      const templateMessages = result.messages.filter(
        (m) => m.source === 'Welcome',
      );
      expect(templateMessages).toHaveLength(1);
    });

    it('returns template messages using an aliased import shared with template', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t as tr } from 'yapyak';",
        '</script>',
        '<template>',
        `  <h1>{{ tr('Welcome') }}</h1>`,
        '</template>',
      ].join('\n');
      const result = extractFile({
        fileId: 'app.vue',
        locales: ['en'],
        source,
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]?.source).toBe('Welcome');
    });

    it('folds the same source string across script and template', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        "const inScript = t('Save');",
        '</script>',
        '<template>',
        `  <button>{{ t('Save') }}</button>`,
        '</template>',
      ].join('\n');
      const result = extractFile({
        fileId: 'app.vue',
        locales: ['en'],
        source,
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]?.locations).toHaveLength(2);
    });

    it('returns no messages when no script imports `yapyak`', () => {
      const source = [
        '<template>',
        `  <h1>{{ t('Welcome') }}</h1>`,
        '</template>',
      ].join('\n');
      const result = extractFile({
        fileId: 'app.vue',
        locales: ['en'],
        source,
      });
      expect(result.messages).toHaveLength(0);
    });
  });
});
