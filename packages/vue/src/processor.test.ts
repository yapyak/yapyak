import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler';

import { vue } from './processor';

const processors = [
  vue(),
];

function extractVue(source: string) {
  return extractFile('src/a.vue', source, {
    processors,
  });
}

function runVueTransform(input: {
  source: string;
  locales: string[];
  translations?: Record<string, Record<string, string>>;
}): string {
  const fileId = 'src/a.vue';
  const extracted = extractFile(fileId, input.source, {
    processors,
  });
  const result = transformFile({
    extracted,
    fileId,
    locales: input.locales,
    processors,
    source: input.source,
    translations: input.translations ?? {},
  });
  return result.code;
}

describe('vue processor — shape', () => {
  it('returns a processor with the `vue` id', () => {
    expect(vue().id).toBe('vue');
  });

  it('returns a processor that declares `@yapyak/vue/internal` as the runtime module', () => {
    expect(vue().runtime?.module).toBe('@yapyak/vue/internal');
  });

  it('refuses to declare a runtime invocation', () => {
    const runtime = vue().runtime;
    expect(runtime && 'invoke' in runtime).toBe(false);
  });
});

describe('vue processor — extract', () => {
  it('returns template messages resolved against `<script setup>` import', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('returns messages from both script and template under one import', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      "const inScript = t('Hello');",
      '</script>',
      '<template>',
      `  <h1>{{ t('World') }}</h1>`,
      `  <button :aria-label="t('Save')">x</button>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    const sources = result.messages.map((message) => message.source).sort();
    expect(sources).toEqual([
      'Hello',
      'Save',
      'World',
    ]);
  });

  it('returns template messages resolved against plain `<script>`', () => {
    const source = [
      '<script lang="ts">',
      "import { t } from 'yapyak';",
      "export default { name: 'X' };",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    const templateMessages = result.messages.filter(
      (message) => message.source === 'Hello',
    );
    expect(templateMessages).toHaveLength(1);
  });

  it('returns template messages using an aliased import shared with template', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t as tr } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ tr('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
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
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.locations).toHaveLength(2);
  });

  it('returns no messages when no script imports `yapyak`', () => {
    const source = [
      '<template>',
      `  <h1>{{ t('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(0);
  });

  it('returns no messages when a mustache is empty', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      '  <h1>{{ }}</h1>',
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(0);
  });

  it('returns no messages when a mustache is unclosed', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello')`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(0);
  });

  it('extracts `t()` from a mustache holding a string with `}`', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello') + "with}brace" }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('extracts `t()` from a mustache holding a template literal', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      "const name = 'Yapyak';",
      '</script>',
      '<template>',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      "  <h1>{{ `prefix ${name}` + t('Hello') }}</h1>",
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('extracts `t()` from a mustache holding nested object braces', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ ({ a: { b: t('Hello') } }).a.b }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('extracts `t()` from a mustache holding a block comment inside object braces', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ ({ a: /* note */ t('Hello') }).a }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('extracts `t()` from a mustache holding a template literal inside object braces', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      "  <h1>{{ ({ a: `tpl ${1}` }).a + t('Hello') }}</h1>",
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('extracts `t()` from a mustache holding a block comment', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ /* a note */ t('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('extracts `t()` from a mustache holding a line comment on its own line', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      '  <h1>{{',
      "    t('Hello') // note",
      '  }}</h1>',
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('extracts `t()` from a mustache holding a string with an escaped quote', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello') + 'a\\'b' }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('returns no messages when a mustache contains a stray closing brace', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello') } }}</h1>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(0);
  });

  it('extracts `t()` from a `v-bind` with a dynamic arg', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      "const key = 'aria-label';",
      '</script>',
      '<template>',
      `  <button :[key]="t('Save')">x</button>`,
      '</template>',
    ].join('\n');
    const result = extractVue(source);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Save');
  });
});

describe('vue processor — transform', () => {
  it('elides `t` in `<script setup>` and `<template>` for single-locale', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      "const heading = t('Hello');",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({
      locales: [
        'en',
      ],
      source,
    });
    expect(code).toContain("'Hello'");
    expect(code).toContain('<h1>Hello</h1>');
    expect(code).not.toContain("t('Hello')");
    expect(code).not.toContain("from 'yapyak'");
  });

  it('emits `_pick` for multi-locale in template and script', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      "const heading = t('Hello');",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({
      locales: [
        'en',
        'sv',
      ],
      source,
      translations: {
        sv: {},
      },
    });
    expect(code).toMatch(/_pick\(_yapyak_catalog_\$\d+\)/);
    expect(code).toContain("_yapyak_catalog_$0 = { en: 'Hello', sv: 'Hello' }");
    expect(code).toMatch(/import \{ pick as _pick \} from 'yapyak\/internal'/);
  });

  it('transforms `:foo="..."` attribute expression', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <button :aria-label="t('Save changes')">Save</button>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({
      locales: [
        'en',
      ],
      source,
    });
    expect(code).toContain('aria-label="Save changes"');
    expect(code).not.toContain("t('Save changes')");
  });

  it('transforms `@click` event handler expression', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <button @click="alert(t('Hello'))">x</button>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({
      locales: [
        'en',
      ],
      source,
    });
    expect(code).toContain("alert('Hello')");
  });

  it('preserves `<script setup>` when there is no core `t` import', () => {
    const source = [
      '<script setup lang="ts">',
      "const heading = 'static';",
      '</script>',
      '<template>',
      '  <h1>{{ heading }}</h1>',
      '</template>',
    ].join('\n');
    const code = runVueTransform({
      locales: [
        'en',
        'sv',
      ],
      source,
    });
    expect(code).toContain("const heading = 'static'");
  });

  it('writes `_pick` into `<script setup>` in multi-locale even when only template uses `t`', () => {
    const source = [
      '<script setup lang="ts">',
      "import { t } from 'yapyak';",
      '</script>',
      '<template>',
      `  <h1>{{ t('Hello') }}</h1>`,
      '</template>',
    ].join('\n');
    const code = runVueTransform({
      locales: [
        'en',
        'sv',
      ],
      source,
      translations: {
        sv: {},
      },
    });
    expect(code).toMatch(
      /<script setup[^>]*>\s*\nimport \{ pick as _pick \} from 'yapyak\/internal';/,
    );
  });

  it('elides Vue mustache `{{ t("Hello") }}` to bare `Hello`', () => {
    const code = runVueTransform({
      locales: [
        'en',
      ],
      source: [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <p>{{ t('Hello') }}</p>`,
        '</template>',
      ].join('\n'),
    });
    expect(code).toContain('<p>Hello</p>');
    expect(code).not.toContain('{{');
  });

  it('elides Vue v-bind `:aria-label="t(\'Save\')"` to static `aria-label="Save"`', () => {
    const code = runVueTransform({
      locales: [
        'en',
      ],
      source: [
        '<script setup lang="ts">',
        "import { t } from 'yapyak';",
        '</script>',
        '<template>',
        `  <button :aria-label="t('Save')">x</button>`,
        '</template>',
      ].join('\n'),
    });
    expect(code).toContain('aria-label="Save"');
    expect(code).not.toContain(':aria-label');
  });
});
