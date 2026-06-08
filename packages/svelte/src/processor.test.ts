// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler';

import { svelte } from './processor';

const processors = [svelte()];

function extractSvelte(source: string, locales: string[] = ['en']) {
  return extractFile({
    fileId: 'src/a.svelte',
    locales,
    processors,
    source,
  });
}

function runSvelteTransform(
  source: string,
  locales: string[] = ['en'],
): string {
  const fileId = 'src/a.svelte';
  const extracted = extractFile({ fileId, locales, processors, source });
  return transformFile({
    extracted,
    fileId,
    locales,
    processors,
    source,
    translations: {},
  }).code;
}

describe('svelte processor — extract', () => {
  it('extracts `t()` from inside an `{#if}` block', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  let show = true;',
        '</script>',
        "{#if show}<p>{t('Hello')}</p>{/if}",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });

  it('extracts `t()` from the `else` branch of an `{#if}` block', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  let show = true;',
        '</script>',
        "{#if show}foo{:else}<p>{t('Save')}</p>{/if}",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Save');
  });

  it('extracts `t()` from inside an `{#each}` block', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  let items = [1];',
        '</script>',
        "{#each items as item (item)}<p>{t('Hello')}</p>{/each}",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });

  it('extracts `t()` from an `{#each}` block fallback', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  let items = [];',
        '</script>',
        "{#each items as item}body{:else}<p>{t('Cancel')}</p>{/each}",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Cancel');
  });

  it('extracts `t()` from an `{#await}` block', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  let p = Promise.resolve(0);',
        '</script>',
        "{#await p}<p>{t('Loading...')}</p>{:then v}done{:catch e}err{/await}",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Loading...');
  });

  it('extracts `t()` from a `{#key}` block', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  let value = 1;',
        '</script>',
        "{#key value}<p>{t('Hello')}</p>{/key}",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });

  it('extracts `t()` from a `{#snippet}` block', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        "{#snippet greet()}<p>{t('Hello')}</p>{/snippet}",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });

  it('extracts `t()` from an `{@html}` tag', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        "{@html t('Hello')}",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });

  it('extracts `t()` from a spread attribute', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        "  const attrs = { title: t('Save') };",
        '</script>',
        '<button {...attrs}>x</button>',
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Save');
  });

  it('extracts `t()` from a `style:` directive', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        "<div style:color={t('Hello')}>x</div>",
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });

  it('returns `ts` lang for `<script lang="typescript">`', () => {
    const result = extractSvelte(
      [
        '<script lang="typescript">',
        "import { t } from 'yapyak';",
        "const x = t('Hello');",
        '</script>',
      ].join('\n'),
    );
    expect(result.messages.map((m) => m.source)).toContain('Hello');
  });
});

describe('svelte processor — transform', () => {
  it('elides Svelte mustache `{t("Hello")}` to bare `Hello`', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<p>{t('Hello')}</p>`,
      ].join('\n'),
    );
    expect(code).toContain('<p>Hello</p>');
  });

  it('elides Svelte attribute `aria-label={t("Save")}` to `aria-label="Save"`', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<button aria-label={t('Save')}>x</button>`,
      ].join('\n'),
    );
    expect(code).toContain('aria-label="Save"');
    expect(code).not.toContain('aria-label={');
  });

  it('prepends a `<script>` block when the source has none', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<p>{t('Hello')}</p>`,
      ].join('\n'),
      ['en', 'sv'],
    );
    expect(code).toMatch(/import \{ pick as _pick \} from 'yapyak\/internal'/);
  });
});
