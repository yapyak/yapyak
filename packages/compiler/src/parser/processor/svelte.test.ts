import type { Fragment } from '../fragment';

import { describe, expect, it } from 'vitest';

import { svelteProcessor } from './svelte';

function verifyOffsetInvariant(source: string, fragment: Fragment): void {
  const slice = source.slice(
    fragment.originalOffset,
    fragment.originalOffset + fragment.code.length,
  );
  expect(slice).toBe(fragment.code);
}

describe('svelteProcessor', () => {
  describe('parseFragments', () => {
    it('returns a script fragment for `<script lang="ts">`', () => {
      const source = [
        '<script lang="ts">',
        "  import { t } from 'yapyak';",
        "  const greeting = t('Hello');",
        '</script>',
      ].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      expect(fragments).toHaveLength(1);
      expect(fragments[0]?.kind).toBe('script');
      expect(fragments[0]?.lang).toBe('ts');
      expect(fragments[0]?.code).toContain('t');
      verifyOffsetInvariant(source, fragments[0] as Fragment);
    });

    it('returns `lang=js` for non-typescript script blocks', () => {
      const source = ['<script>', '  const x = 1;', '</script>'].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      expect(fragments[0]?.lang).toBe('js');
    });

    it('returns a separate script fragment for `<script module>`', () => {
      const source = [
        '<script module lang="ts">',
        '  export const stored = 1;',
        '</script>',
        '<script lang="ts">',
        "  import { t } from 'yapyak';",
        '</script>',
      ].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const scripts = fragments.filter((f) => f.kind === 'script');
      expect(scripts).toHaveLength(2);
    });

    it('returns a template expression for `ExpressionTag` `{expr}`', () => {
      const source = [
        '<script lang="ts">',
        "  import { t } from 'yapyak';",
        '</script>',
        `<h1>{t('Hello')}</h1>`,
      ].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe("t('Hello')");
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns a template expression for `HtmlTag` `{@html expr}`', () => {
      const source = [`<div>{@html t('<strong>Bold</strong>')}</div>`].join(
        '\n',
      );
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe("t('<strong>Bold</strong>')");
    });

    it('returns a template expression for `RenderTag` `{@render snippet()}`', () => {
      const source = [
        '<script lang="ts">',
        `  function greet(): unknown { return null; }`,
        '</script>',
        `{@render greet()}`,
      ].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe('greet()');
    });

    it('returns a template expression for an attribute single `ExpressionTag` value', () => {
      const source = [`<button aria-label={t('Save')}>x</button>`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe("t('Save')");
    });

    it('returns a template expression for `ExpressionTag` inside string-interpolated attribute', () => {
      const source = [`<div class="prefix-{t('mid')}-suffix">x</div>`].join(
        '\n',
      );
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe("t('mid')");
    });

    it('returns a template expression for `SpreadAttribute`', () => {
      const source = [`<input {...props} />`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe('props');
    });

    it('returns expressions for `IfBlock` test and body', () => {
      const source = [`{#if cond}{t('Save')}{:else}{t('Cancel')}{/if}`].join(
        '\n',
      );
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      const codes = exprs.map((e) => e.code).sort();
      expect(codes).toContain('cond');
      expect(codes).toContain("t('Save')");
      expect(codes).toContain("t('Cancel')");
    });

    it('returns expressions for `EachBlock` expression and body', () => {
      const source = [`{#each items as item}{t('Hello')}{/each}`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      const codes = exprs.map((e) => e.code);
      expect(codes).toContain('items');
      expect(codes).toContain("t('Hello')");
    });

    it('returns expressions for `AwaitBlock` and its then/catch branches', () => {
      const source = [
        `{#await promise}`,
        `  {t('Loading...')}`,
        `{:then value}`,
        `  {t('Save')}`,
        `{:catch err}`,
        `  {t('Hello')}`,
        `{/await}`,
      ].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('promise');
      expect(codes).toContain("t('Loading...')");
      expect(codes).toContain("t('Save')");
      expect(codes).toContain("t('Hello')");
    });

    it('returns expressions for `KeyBlock`', () => {
      const source = [`{#key x}{t('K')}{/key}`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('x');
      expect(codes).toContain("t('K')");
    });

    it('returns expressions for `SnippetBlock` body', () => {
      const source = [`{#snippet item(x)}{t('S')}{/snippet}`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain("t('S')");
    });

    it('returns a template expression for `ClassDirective`', () => {
      const source = [`<div class:active={isActive}>x</div>`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('isActive');
    });

    it('returns a template expression for `BindDirective`', () => {
      const source = [`<input bind:value={text} />`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('text');
    });

    it('returns a template expression for legacy `OnDirective`', () => {
      const source = [`<button on:click={() => t('Save')}>x</button>`].join(
        '\n',
      );
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes.some((c) => c.includes("t('Save')"))).toBe(true);
    });

    it('returns a template expression for `StyleDirective` value', () => {
      const source = [`<div style:color={accent}>x</div>`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('accent');
    });

    it('returns a template expression for `UseDirective`', () => {
      const source = [`<div use:action={params}>x</div>`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('params');
    });

    it('returns a template expression for `TransitionDirective`', () => {
      const source = [`<div transition:fade={params}>x</div>`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('params');
    });

    it('returns a template expression for `AnimateDirective`', () => {
      const source = [
        `{#each items as item (item.id)}`,
        `  <div animate:flip={settings}>x</div>`,
        `{/each}`,
      ].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('settings');
    });

    it('returns a template expression for `SvelteElement` tag', () => {
      const source = [`<svelte:element this={tagName} />`].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const codes = fragments
        .filter((f) => f.kind === 'template-expression')
        .map((e) => e.code);
      expect(codes).toContain('tagName');
    });

    it('returns expressions for nested elements', () => {
      const source = [
        '<script lang="ts">',
        "  import { t } from 'yapyak';",
        '</script>',
        `<article>`,
        `  <header><h1>{t('Hello')}</h1></header>`,
        `  <section>`,
        `    <p>{t('Hi {name}', { name })}</p>`,
        `    <button aria-label={t('Save')}>{t('Save')}</button>`,
        `  </section>`,
        `</article>`,
      ].join('\n');
      const fragments = svelteProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs.length).toBeGreaterThanOrEqual(4);
      for (const fragment of exprs) {
        verifyOffsetInvariant(source, fragment);
      }
    });

    it('returns an empty array for empty source', () => {
      expect(svelteProcessor.parseFragments('')).toEqual([]);
    });
  });
});
