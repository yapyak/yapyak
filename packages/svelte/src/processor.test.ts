// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler/internal';

import { svelte } from './processor';

const processors = [
  svelte(),
];

function extractSvelte(source: string) {
  return extractFile('src/a.svelte', source, {
    processors,
  });
}

function runSvelteTransform(
  source: string,
  locales: string[] = [
    'en',
  ],
): string {
  const fileId = 'src/a.svelte';
  const extracted = extractFile(fileId, source, {
    processors,
  });
  return transformFile({
    extracted,
    fileId,
    locales,
    processors,
    source,
    translations: {},
  }).code;
}

describe('svelte processor — shape', () => {
  it('returns a processor with the `svelte` id', () => {
    expect(svelte().id).toBe('svelte');
  });

  it('returns a processor that declares `@yapyak/svelte/internal` as the runtime module', () => {
    expect(svelte().runtime?.module).toBe('@yapyak/svelte/internal');
  });

  it('returns a processor that declares `registerLocale` as the runtime register', () => {
    expect(svelte().runtime?.register).toBe('registerLocale');
  });

  it('refuses to declare a component-hook', () => {
    expect(svelte().runtime?.componentHook).toBeUndefined();
  });
});

describe('svelte processor — extract', () => {
  it('returns call-site context for a template message', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<button>{t('Save changes')}</button>`,
      ].join('\n'),
    );
    expect(result.messages[0]?.locations[0]?.callSiteContext).toEqual({
      enclosingComponent: 'A',
      enclosingElement: 'button',
      snippet: `<button>{t('Save changes')}</button>`,
    });
  });

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
    expect(result.messages.map((message) => message.source)).toContain('Hello');
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
    expect(result.messages.map((message) => message.source)).toContain('Save');
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
    expect(result.messages.map((message) => message.source)).toContain('Hello');
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
    expect(result.messages.map((message) => message.source)).toContain(
      'Cancel',
    );
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
    expect(result.messages.map((message) => message.source)).toContain(
      'Loading...',
    );
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
    expect(result.messages.map((message) => message.source)).toContain('Hello');
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
    expect(result.messages.map((message) => message.source)).toContain('Hello');
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
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from inside a spread attribute expression', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        "<button {...{ title: t('Save') }}>x</button>",
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Save');
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
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from a `<script lang="typescript">` block', () => {
    const result = extractSvelte(
      [
        '<script lang="typescript">',
        "import { t } from 'yapyak';",
        "const x = t('Hello');",
        '</script>',
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from a `<script>` block without `lang`', () => {
    const result = extractSvelte(
      [
        '<script>',
        "import { t } from 'yapyak';",
        "const x = t('Hello');",
        '</script>',
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from a `<script module>` block', () => {
    const result = extractSvelte(
      [
        '<script module lang="ts">',
        "import { t } from 'yapyak';",
        "const x = t('Hello');",
        '</script>',
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from a `<svelte:element>` `this` expression', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        "<svelte:element this={t('div')}>x</svelte:element>",
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('div');
  });

  it('extracts `t()` from a `<svelte:component>` `this` expression', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  let Comp;',
        '</script>',
        "<svelte:component this={Comp ?? t('Hello')}>x</svelte:component>",
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from a multi-expression attribute', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<button title="a{t('Save')}b">x</button>`,
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from a multi-expression `style:` directive', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<div style:color="a{t('Hello')}b">x</div>`,
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from an `on:` directive expression', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        "<button on:click={() => t('Save')}>x</button>",
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from children when an attribute is boolean', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<button disabled>{t('Cancel')}</button>`,
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain(
      'Cancel',
    );
  });

  it('extracts `t()` from a `{@render}` tag expression', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  const snip = (label: string) => label;',
        '</script>',
        "{@render snip(t('Hello'))}",
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Hello');
  });

  it('extracts `t()` from an `{@attach}` tag', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '  function attach(node: HTMLElement, value: string) { node.title = value; }',
        '</script>',
        "<button {@attach attach(t('Save'))}>x</button>",
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Save');
  });

  it('extracts `t()` from children when a `style:` directive is boolean', () => {
    const result = extractSvelte(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<div style:color>{t('Hello')}</div>`,
      ].join('\n'),
    );
    expect(result.messages.map((message) => message.source)).toContain('Hello');
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

  it('writes a `<script>` block when the source has none', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        `<p>{t('Hello')}</p>`,
      ].join('\n'),
      [
        'en',
        'sv',
      ],
    );
    expect(code).toMatch(/import \{ pick as _pick \} from 'yapyak\/internal'/);
  });

  it('preserves a `locales` import referenced from an `{#each}` expression', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "  import { locales } from 'yapyak';",
        '</script>',
        '',
        '{#each locales as value}',
        '  <button>{value}</button>',
        '{/each}',
      ].join('\n'),
    );
    expect(code).toMatch(/import \{ locales \}/);
  });

  it('preserves a `format` import referenced from a mustache expression', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "  import { format } from 'yapyak';",
        '</script>',
        '',
        "<p>{format.list(['a', 'b'])}</p>",
      ].join('\n'),
    );
    expect(code).toMatch(/import \{ format \}/);
  });

  it('preserves a `getLocale` import referenced from an attribute expression', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "  import { getLocale } from 'yapyak';",
        '</script>',
        '',
        '<time datetime={getLocale()}>x</time>',
      ].join('\n'),
    );
    expect(code).toMatch(/import \{ getLocale \}/);
  });

  it('elides a `locales` import referenced only as plain template text', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "  import { locales } from 'yapyak';",
        '</script>',
        '',
        '<p>locales</p>',
      ].join('\n'),
    );
    expect(code).not.toMatch(/import \{ locales \}/);
  });

  it('elides a `locales` import referenced only inside a static `aria-label`', () => {
    const code = runSvelteTransform(
      [
        '<script lang="ts">',
        "  import { locales } from 'yapyak';",
        '</script>',
        '',
        '<button aria-label="locales">x</button>',
      ].join('\n'),
    );
    expect(code).not.toMatch(/import \{ locales \}/);
  });
});
