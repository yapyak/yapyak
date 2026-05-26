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
  describe('parseFragments', () => {
    it('returns a script fragment for <script lang="ts">', () => {
      const source = [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        "export const x = t('Hello');",
        '</script>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      expect(fragments).toHaveLength(1);
      expect(fragments[0]?.kind).toBe('script');
      expect(fragments[0]?.lang).toBe('ts');
      expect(fragments[0]?.code).toContain('t');
      verifyOffsetInvariant(source, fragments[0] as Fragment);
    });

    it('returns a script fragment for <script setup>', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        "const greeting = t('Hello');",
        '</script>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      expect(fragments).toHaveLength(1);
      expect(fragments[0]?.kind).toBe('script');
    });

    it('returns lang=js for non-typescript script blocks', () => {
      const source = [
        '<script>',
        "import { t } from 'yapyak';",
        '</script>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      expect(fragments[0]?.lang).toBe('js');
    });

    it('returns separate fragments for <script> and <script setup>', () => {
      const source = [
        '<script lang="ts">',
        "export default { name: 'X' };",
        '</script>',
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const scriptCount = fragments.filter((f) => f.kind === 'script').length;
      expect(scriptCount).toBe(2);
    });

    it('returns a template-expression fragment for {{ ... }} interpolation', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        "  <h1>{{ t('Welcome') }}</h1>",
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprFragments = fragments.filter(
        (f) => f.kind === 'template-expression',
      );
      expect(exprFragments).toHaveLength(1);
      expect(exprFragments[0]?.code).toBe("t('Welcome')");
      verifyOffsetInvariant(source, exprFragments[0] as Fragment);
    });

    it('returns a template-expression fragment for v-bind shorthand :foo="..."', () => {
      const source = [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <button :aria-label="t('Cool')">x</button>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprFragments = fragments.filter(
        (f) => f.kind === 'template-expression',
      );
      expect(exprFragments).toHaveLength(1);
      expect(exprFragments[0]?.code).toBe("t('Cool')");
      verifyOffsetInvariant(source, exprFragments[0] as Fragment);
    });

    it('returns a template-expression fragment for verbose v-bind:foo="..."', () => {
      const source = [
        '<template>',
        `  <img v-bind:alt="t('Hero')" />`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprFragments = fragments.filter(
        (f) => f.kind === 'template-expression',
      );
      expect(exprFragments).toHaveLength(1);
      expect(exprFragments[0]?.code).toBe("t('Hero')");
    });

    it('returns a template-expression fragment for v-on shorthand @click="..."', () => {
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

    it('returns a template-expression fragment for verbose v-on:click="..."', () => {
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

    it('returns multiple expressions from nested elements', () => {
      const source = [
        '<template>',
        '  <article>',
        `    <header><h1>{{ t('Welcome') }}</h1></header>`,
        '    <section>',
        `      <p>{{ t('Hi {name}', { name }) }}</p>`,
        `      <button :aria-label="t('Save')">{{ t('Save') }}</button>`,
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

    it('returns a single fragment when template-only SFC has no script', () => {
      const source = [
        '<template>',
        `  <h1>{{ t('Hello') }}</h1>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      expect(fragments).toHaveLength(1);
      expect(fragments[0]?.kind).toBe('template-expression');
    });

    it('returns a single fragment when script-only SFC has no template', () => {
      const source = [
        '<script setup lang="ts">',
        "const x = 'hello';",
        '</script>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      expect(fragments).toHaveLength(1);
      expect(fragments[0]?.kind).toBe('script');
    });

    it('returns the full ICU plural expression without truncating on inner }}', () => {
      const source = [
        '<template>',
        `  <p>{{ t('You have {count, plural, one {# message} other {# messages}}', { count: 3 }) }}</p>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe(
        `t('You have {count, plural, one {# message} other {# messages}}', { count: 3 })`,
      );
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns the full ICU select expression without truncating on inner }}', () => {
      const source = [
        '<template>',
        `  <p>{{ t('{theme, select, dark {Dark mode} other {Light mode}}', { theme: 'dark' }) }}</p>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe(
        `t('{theme, select, dark {Dark mode} other {Light mode}}', { theme: 'dark' })`,
      );
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns the full nested ICU expression (plural with embedded placeholder)', () => {
      const source = [
        '<template>',
        `  <p>{{ t('You have {count, plural, one {# by {author}} other {# by {author}}}', { count: 1, author: 'Alex' }) }}</p>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toContain('author');
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns the full expression when double-quoted string contains }}', () => {
      const source = [
        '<template>',
        `  <p>{{ t("Closing braces: }}", {}) }}</p>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe(`t("Closing braces: }}", {})`);
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns the full template literal with ${} interpolation inside expression', () => {
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

    it('returns the full expression when strings contain escaped quotes', () => {
      const source = [
        '<template>',
        `  <p>{{ t('It\\'s }} a test', {}) }}</p>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe(`t('It\\'s }} a test', {})`);
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns the full expression with a nested object literal in 2nd arg', () => {
      const source = [
        '<template>',
        `  <p>{{ t('Hi {user}', { user: { name: 'Alex', id: 1 } }) }}</p>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe(
        `t('Hi {user}', { user: { name: 'Alex', id: 1 } })`,
      );
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns the full expression when a block comment contains }} inside', () => {
      const source = [
        '<template>',
        `  <p>{{ t('Hello' /* ignore }} this */, {}) }}</p>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe(`t('Hello' /* ignore }} this */, {})`);
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns multiple expressions on the same line', () => {
      const source = [
        '<template>',
        `  <p>{{ t('{count, plural, one {#} other {#}}', { count: 1 }) }} and {{ t('{x, plural, one {1} other {n}}', { x: 2 }) }}</p>`,
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

    it('returns a fragment for an object literal as a standalone expression', () => {
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

    it('returns an empty array for empty source', () => {
      expect(vueProcessor.parseFragments('')).toEqual([]);
    });

    it('returns no fragments for static attributes', () => {
      const source = [
        '<template>',
        '  <button class="btn">x</button>',
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      expect(fragments).toHaveLength(0);
    });

    it('skips empty {{ }} and {{   }} interpolations', () => {
      const source = [
        '<template>',
        `  <p>{{ }}</p>`,
        `  <p>{{    }}</p>`,
        `  <p>{{ t('real') }}</p>`,
        '</template>',
      ].join('\n');
      const fragments = vueProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe(`t('real')`);
    });
  });
});
