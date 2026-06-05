import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler';

import { svelte } from './processor';

const processors = [svelte()];

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
});
