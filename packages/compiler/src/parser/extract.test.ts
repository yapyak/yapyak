import type { ExtractFileResult } from './type';

import { describe, expect, it } from 'vitest';

import { extractFile } from './extract';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, 'fixtures');

function extractFixture(
  category: string,
  name: string,
  locales: readonly string[] = ['en'],
): ExtractFileResult {
  const source = readFileSync(join(ROOT, category, name), 'utf-8');
  return extractFile({ fileId: name, locales, source });
}

describe('extractFile', () => {
  describe('messages', () => {
    it('extracts simple messages from direct import', () => {
      const result = extractFixture('calls', 'simple.ts');
      expect(result.messages).toHaveLength(2);
      const sources = result.messages.map((m) => m.source).sort();
      expect(sources).toEqual(['Goodbye', 'Hello']);
    });

    it('extracts placeholders', () => {
      const result = extractFixture('calls', 'placeholders.ts');
      expect(result.messages).toHaveLength(2);
      const greeting = result.messages.find((m) => m.source === 'Hi {name}');
      expect(greeting?.placeholders).toEqual([
        { kind: 'simple', name: 'name' },
      ]);
    });

    it('dedupes identical calls into one message with multiple locations', () => {
      const result = extractFile({
        fileId: 'multi.ts',
        locales: ['en'],
        source: `
          import { $t } from '@yapyak/core';
          export const a = $t('Hello');
          export const b = $t('Hello');
        `,
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]?.locations).toHaveLength(2);
    });

    it('preserves call-site context per location', () => {
      const result = extractFixture('calls', 'nested-jsx.tsx');
      expect(result.messages).toHaveLength(3);
      for (const message of result.messages) {
        expect(message.locations[0]?.callSiteContext.componentName).toBe(
          'Greeting',
        );
      }
    });

    it('produces stable ids deterministically', () => {
      const first = extractFixture('calls', 'simple.ts');
      const second = extractFixture('calls', 'simple.ts');
      expect(first.messages.map((m) => m.id)).toEqual(
        second.messages.map((m) => m.id),
      );
    });
  });

  describe('diagnostics', () => {
    it('forwards YPK001 from parse-arguments', () => {
      const result = extractFixture('diagnostics', 'ypk001-dynamic-source.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK001')).toBe(true);
    });

    it('forwards YPK002 from parse-arguments', () => {
      const result = extractFixture('diagnostics', 'ypk002-missing-param.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK002')).toBe(true);
    });

    it('forwards YPK007 from parse-arguments', () => {
      const result = extractFixture('diagnostics', 'ypk007-invalid-plural.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK007')).toBe(true);
    });

    it('produces no diagnostics for clean fixtures', () => {
      const result = extractFixture('calls', 'simple.ts');
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('callSites returned', () => {
    it('includes every discovered call-site for transform reuse', () => {
      const result = extractFixture('calls', 'nested-jsx.tsx');
      expect(result.callSites).toHaveLength(3);
    });
  });

  describe('processor detection', () => {
    it('parses .tsx fixtures with JSX correctly', () => {
      const result = extractFixture('calls', 'nested-jsx.tsx');
      expect(
        result.diagnostics.filter((d) => d.severity === 'error'),
      ).toHaveLength(0);
      expect(result.messages).toHaveLength(3);
    });
  });

  describe('Vue cross-fragment binding-resolution', () => {
    it('resolves template $t against <script setup> import', () => {
      const source = [
        '<script setup lang="ts">',
        "import { $t } from '@yapyak/core';",
        '</script>',
        '<template>',
        `  <h1>{{ $t('Welcome') }}</h1>`,
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

    it('extracts both script and template messages with same import', () => {
      const source = [
        '<script setup lang="ts">',
        "import { $t } from '@yapyak/core';",
        "const inScript = $t('From script');",
        '</script>',
        '<template>',
        `  <h1>{{ $t('From template') }}</h1>`,
        `  <button :aria-label="$t('Button label')">x</button>`,
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

    it('resolves template $t against plain <script> (not setup)', () => {
      const source = [
        '<script lang="ts">',
        "import { $t } from '@yapyak/core';",
        "export default { name: 'X' };",
        '</script>',
        '<template>',
        `  <h1>{{ $t('Welcome') }}</h1>`,
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

    it('does not resolve template $t when no script imports yapyak', () => {
      const source = [
        '<template>',
        `  <h1>{{ $t('Welcome') }}</h1>`,
        '</template>',
      ].join('\n');
      const result = extractFile({
        fileId: 'app.vue',
        locales: ['en'],
        source,
      });
      expect(result.messages).toHaveLength(0);
    });

    it('resolves aliased import shared with template', () => {
      const source = [
        '<script setup lang="ts">',
        "import { $t as tr } from '@yapyak/core';",
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

    it('dedupes same source string across script and template', () => {
      const source = [
        '<script setup lang="ts">',
        "import { $t } from '@yapyak/core';",
        "const inScript = $t('Save');",
        '</script>',
        '<template>',
        `  <button>{{ $t('Save') }}</button>`,
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
  });
});
