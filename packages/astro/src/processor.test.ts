import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler';

import { astro } from './processor';

const processors = [astro()];

function runAstroTransform(source: string, locales: string[] = ['en']): string {
  const fileId = 'src/a.astro';
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

describe('astro processor — transform', () => {
  it('elides Astro mustache `{t("Hello")}` to bare `Hello`', () => {
    const code = runAstroTransform(
      ['---', "import { t } from 'yapyak';", '---', `<p>{t('Hello')}</p>`].join(
        '\n',
      ),
    );
    expect(code).toContain('<p>Hello</p>');
  });

  it('elides Astro attribute `aria-label={t("Save")}` to `aria-label="Save"`', () => {
    const code = runAstroTransform(
      [
        '---',
        "import { t } from 'yapyak';",
        '---',
        `<button aria-label={t('Save')}>x</button>`,
      ].join('\n'),
    );
    expect(code).toContain('aria-label="Save"');
    expect(code).not.toContain('aria-label={');
  });
});
