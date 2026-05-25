import type { Fragment } from '../type';

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
  it('returns empty for empty source', () => {
    expect(svelteProcessor.parseFragments('')).toEqual([]);
  });

  it('extracts <script lang="ts"> as script fragment', () => {
    const source = [
      '<script lang="ts">',
      "  import { $t } from 'yapyak';",
      "  const greeting = $t('Hello');",
      '</script>',
    ].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    expect(fragments).toHaveLength(1);
    expect(fragments[0]?.kind).toBe('script');
    expect(fragments[0]?.lang).toBe('ts');
    expect(fragments[0]?.code).toContain('$t');
    verifyOffsetInvariant(source, fragments[0] as Fragment);
  });

  it('extracts <script module> as separate script fragment', () => {
    const source = [
      '<script module lang="ts">',
      '  export const stored = 1;',
      '</script>',
      '<script lang="ts">',
      "  import { $t } from 'yapyak';",
      '</script>',
    ].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const scripts = fragments.filter((f) => f.kind === 'script');
    expect(scripts).toHaveLength(2);
  });

  it('extracts ExpressionTag {expr}', () => {
    const source = [
      '<script lang="ts">',
      "  import { $t } from 'yapyak';",
      '</script>',
      `<h1>{$t('Welcome')}</h1>`,
    ].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe("$t('Welcome')");
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('extracts HtmlTag {@html expr}', () => {
    const source = [`<div>{@html $t('<strong>Bold</strong>')}</div>`].join(
      '\n',
    );
    const fragments = svelteProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe("$t('<strong>Bold</strong>')");
  });

  it('extracts RenderTag {@render snippet()}', () => {
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

  it('extracts attribute single ExpressionTag value', () => {
    const source = [`<button aria-label={$t('Save')}>x</button>`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe("$t('Save')");
  });

  it('extracts ExpressionTag inside string-interpolated attribute', () => {
    const source = [`<div class="prefix-{$t('mid')}-suffix">x</div>`].join(
      '\n',
    );
    const fragments = svelteProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe("$t('mid')");
  });

  it('extracts SpreadAttribute expression', () => {
    const source = [`<input {...props} />`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe('props');
  });

  it('extracts IfBlock test + body expressions', () => {
    const source = [`{#if cond}{$t('Yes')}{:else}{$t('No')}{/if}`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    const codes = exprs.map((e) => e.code).sort();
    expect(codes).toContain('cond');
    expect(codes).toContain("$t('Yes')");
    expect(codes).toContain("$t('No')");
  });

  it('extracts EachBlock expression + body', () => {
    const source = [`{#each items as item}{$t('Item')}{/each}`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    const codes = exprs.map((e) => e.code);
    expect(codes).toContain('items');
    expect(codes).toContain("$t('Item')");
  });

  it('extracts AwaitBlock + then/catch branches', () => {
    const source = [
      `{#await promise}`,
      `  {$t('Loading')}`,
      `{:then value}`,
      `  {$t('Done')}`,
      `{:catch err}`,
      `  {$t('Failed')}`,
      `{/await}`,
    ].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain('promise');
    expect(codes).toContain("$t('Loading')");
    expect(codes).toContain("$t('Done')");
    expect(codes).toContain("$t('Failed')");
  });

  it('extracts KeyBlock', () => {
    const source = [`{#key x}{$t('K')}{/key}`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain('x');
    expect(codes).toContain("$t('K')");
  });

  it('extracts SnippetBlock body', () => {
    const source = [`{#snippet item(x)}{$t('S')}{/snippet}`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain("$t('S')");
  });

  it('extracts ClassDirective expression', () => {
    const source = [`<div class:active={isActive}>x</div>`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain('isActive');
  });

  it('extracts BindDirective expression', () => {
    const source = [`<input bind:value={text} />`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain('text');
  });

  it('extracts OnDirective expression (legacy)', () => {
    const source = [`<button on:click={() => $t('Click')}>x</button>`].join(
      '\n',
    );
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes.some((c) => c.includes("$t('Click')"))).toBe(true);
  });

  it('extracts StyleDirective value expression', () => {
    const source = [`<div style:color={accent}>x</div>`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain('accent');
  });

  it('extracts UseDirective expression', () => {
    const source = [`<div use:action={params}>x</div>`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain('params');
  });

  it('extracts TransitionDirective expression', () => {
    const source = [`<div transition:fade={params}>x</div>`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain('params');
  });

  it('extracts AnimateDirective expression', () => {
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

  it('extracts SvelteElement tag expression', () => {
    const source = [`<svelte:element this={tagName} />`].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    const codes = fragments
      .filter((f) => f.kind === 'template-expression')
      .map((e) => e.code);
    expect(codes).toContain('tagName');
  });

  it('handles nested elements with multiple expressions', () => {
    const source = [
      '<script lang="ts">',
      "  import { $t } from 'yapyak';",
      '</script>',
      `<article>`,
      `  <header><h1>{$t('Welcome')}</h1></header>`,
      `  <section>`,
      `    <p>{$t('Hi {name}', { name })}</p>`,
      `    <button aria-label={$t('Save')}>{$t('Save')}</button>`,
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

  it('returns lang=js for non-typescript script blocks', () => {
    const source = ['<script>', '  const x = 1;', '</script>'].join('\n');
    const fragments = svelteProcessor.parseFragments(source);
    expect(fragments[0]?.lang).toBe('js');
  });
});
