import type { Fragment } from '../type';

import { describe, expect, it } from 'vitest';

import { vueProcessor } from './vue';

function verifyOffsetInvariant(source: string, fragment: Fragment): void {
  const slice = source.slice(
    fragment.originalOffset,
    fragment.originalOffset + fragment.code.length,
  );
  expect(slice).toBe(fragment.code);
}

describe('vueProcessor', () => {
  it('returns empty for empty source', () => {
    expect(vueProcessor.parseFragments('')).toEqual([]);
  });

  it('extracts <script lang="ts"> as script fragment', () => {
    const source = [
      '<script lang="ts">',
      "import { $t } from '@yapyak/core';",
      "export const x = $t('Hello');",
      '</script>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    expect(fragments).toHaveLength(1);
    expect(fragments[0]?.kind).toBe('script');
    expect(fragments[0]?.lang).toBe('ts');
    expect(fragments[0]?.code).toContain('$t');
    verifyOffsetInvariant(source, fragments[0] as Fragment);
  });

  it('extracts <script setup> as script fragment', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      "const greeting = $t('Hello');",
      '</script>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    expect(fragments).toHaveLength(1);
    expect(fragments[0]?.kind).toBe('script');
  });

  it('extracts both <script> and <script setup> as separate fragments', () => {
    const source = [
      '<script lang="ts">',
      "export default { name: 'X' };",
      '</script>',
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      '</script>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const scriptCount = fragments.filter((f) => f.kind === 'script').length;
    expect(scriptCount).toBe(2);
  });

  it('extracts {{ ... }} interpolation as template-expression fragment', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      '</script>',
      '<template>',
      "  <h1>{{ $t('Welcome') }}</h1>",
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprFragments = fragments.filter(
      (f) => f.kind === 'template-expression',
    );
    expect(exprFragments).toHaveLength(1);
    expect(exprFragments[0]?.code).toBe("$t('Welcome')");
    verifyOffsetInvariant(source, exprFragments[0] as Fragment);
  });

  it('extracts :foo="..." attribute (v-bind shorthand)', () => {
    const source = [
      '<script setup lang="ts">',
      "import { $t } from '@yapyak/core';",
      '</script>',
      '<template>',
      `  <button :aria-label="$t('Cool')">x</button>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprFragments = fragments.filter(
      (f) => f.kind === 'template-expression',
    );
    expect(exprFragments).toHaveLength(1);
    expect(exprFragments[0]?.code).toBe("$t('Cool')");
    verifyOffsetInvariant(source, exprFragments[0] as Fragment);
  });

  it('extracts v-bind:foo="..." attribute (verbose)', () => {
    const source = [
      '<template>',
      `  <img v-bind:alt="$t('Hero')" />`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprFragments = fragments.filter(
      (f) => f.kind === 'template-expression',
    );
    expect(exprFragments).toHaveLength(1);
    expect(exprFragments[0]?.code).toBe("$t('Hero')");
  });

  it('extracts @click="..." event handler (v-on shorthand)', () => {
    const source = [
      '<template>',
      `  <button @click="setLocale('sv')">x</button>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprFragments = fragments.filter(
      (f) => f.kind === 'template-expression',
    );
    expect(exprFragments).toHaveLength(1);
    expect(exprFragments[0]?.code).toBe("setLocale('sv')");
  });

  it('extracts v-on:click="..." event handler (verbose)', () => {
    const source = [
      '<template>',
      `  <button v-on:click="handler()">x</button>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprFragments = fragments.filter(
      (f) => f.kind === 'template-expression',
    );
    expect(exprFragments).toHaveLength(1);
    expect(exprFragments[0]?.code).toBe('handler()');
  });

  it('extracts multiple expressions from nested elements', () => {
    const source = [
      '<template>',
      '  <article>',
      `    <header><h1>{{ $t('Welcome') }}</h1></header>`,
      '    <section>',
      `      <p>{{ $t('Hi {name}', { name }) }}</p>`,
      `      <button :aria-label="$t('Save')">{{ $t('Save') }}</button>`,
      '    </section>',
      '  </article>',
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprFragments = fragments.filter(
      (f) => f.kind === 'template-expression',
    );
    expect(exprFragments).toHaveLength(4);
    for (const fragment of exprFragments) {
      verifyOffsetInvariant(source, fragment);
    }
  });

  it('extracts static attribute as NOT a template-expression', () => {
    const source = [
      '<template>',
      '  <button class="btn">x</button>',
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    expect(fragments).toHaveLength(0);
  });

  it('returns lang=js for non-typescript script blocks', () => {
    const source = [
      '<script>',
      "import { $t } from '@yapyak/core';",
      '</script>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    expect(fragments[0]?.lang).toBe('js');
  });

  it('handles SFC with template but no script', () => {
    const source = [
      '<template>',
      `  <h1>{{ $t('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    expect(fragments).toHaveLength(1);
    expect(fragments[0]?.kind).toBe('template-expression');
  });

  it('extracts ICU plural in {{ }} without truncating on inner }}', () => {
    const source = [
      '<template>',
      `  <p>{{ $t('You have {count, plural, one {# message} other {# messages}}', { count: 3 }) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe(
      `$t('You have {count, plural, one {# message} other {# messages}}', { count: 3 })`,
    );
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('extracts ICU select in {{ }} without truncating on inner }}', () => {
    const source = [
      '<template>',
      `  <p>{{ $t('{theme, select, dark {Dark mode} other {Light mode}}', { theme: 'dark' }) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe(
      `$t('{theme, select, dark {Dark mode} other {Light mode}}', { theme: 'dark' })`,
    );
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('extracts nested ICU (plural with embedded placeholder)', () => {
    const source = [
      '<template>',
      `  <p>{{ $t('You have {count, plural, one {# by {author}} other {# by {author}}}', { count: 1, author: 'Alex' }) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toContain('author');
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('handles double-quoted string with }} inside', () => {
    const source = [
      '<template>',
      `  <p>{{ $t("Closing braces: }}", {}) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe(`$t("Closing braces: }}", {})`);
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('handles template literal with ${} interpolation inside expression', () => {
    const source = [
      '<template>',
      '  <p>{{ `${name}-${greeting}` }}</p>',
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe('`${name}-${greeting}`');
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('handles escaped quotes inside strings', () => {
    const source = [
      '<template>',
      `  <p>{{ $t('It\\'s }} a test', {}) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe(`$t('It\\'s }} a test', {})`);
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('handles nested object literal in 2nd arg', () => {
    const source = [
      '<template>',
      `  <p>{{ $t('Hi {user}', { user: { name: 'Alex', id: 1 } }) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe(
      `$t('Hi {user}', { user: { name: 'Alex', id: 1 } })`,
    );
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('handles block comment containing }} inside expression', () => {
    const source = [
      '<template>',
      `  <p>{{ $t('Hello' /* ignore }} this */, {}) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe(`$t('Hello' /* ignore }} this */, {})`);
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('handles multiple interpolations on the same line', () => {
    const source = [
      '<template>',
      `  <p>{{ $t('{count, plural, one {#} other {#}}', { count: 1 }) }} and {{ $t('{x, plural, one {1} other {n}}', { x: 2 }) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(2);
    expect(exprs[0]?.code).toContain('count');
    expect(exprs[1]?.code).toContain('x: 2');
    verifyOffsetInvariant(source, exprs[0] as Fragment);
    verifyOffsetInvariant(source, exprs[1] as Fragment);
  });

  it('skips empty {{ }} and {{   }} interpolations', () => {
    const source = [
      '<template>',
      `  <p>{{ }}</p>`,
      `  <p>{{    }}</p>`,
      `  <p>{{ $t('real') }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe(`$t('real')`);
  });

  it('handles object literal as standalone expression', () => {
    const source = [
      '<template>',
      `  <p>{{ ({ a: 1, b: 2 }) }}</p>`,
      '</template>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe('({ a: 1, b: 2 })');
  });

  it('handles SFC with script but no template', () => {
    const source = [
      '<script setup lang="ts">',
      "const x = 'hello';",
      '</script>',
    ].join('\n');
    const fragments = vueProcessor.parseFragments(source);
    expect(fragments).toHaveLength(1);
    expect(fragments[0]?.kind).toBe('script');
  });
});
