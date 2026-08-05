import { describe, expect, it } from 'vitest';

import { renderLocaleWarning } from './locale-warning';

describe('renderLocaleWarning', () => {
  it('renders the BCP 47 reason for an `invalid-structure` issue', () => {
    expect(
      renderLocaleWarning(
        {
          code: '1234',
          issue: 'invalid-structure',
        },
        'locales',
      ),
    ).toBe(
      "[yapyak] locale '1234' does not look like a BCP 47 locale tag. yapyak will skip syncing stubs and translating for this locale. Rename `locales/1234.json` to a valid locale code, or remove the file.",
    );
  });

  it('renders the ISO 639-1 reason for an `unknown-language` issue', () => {
    expect(
      renderLocaleWarning(
        {
          code: 'zz',
          issue: 'unknown-language',
        },
        'locales',
      ),
    ).toBe(
      "[yapyak] locale 'zz' is not a recognized ISO 639-1 language code. yapyak will skip syncing stubs and translating for this locale. Rename `locales/zz.json` to a valid locale code, or remove the file.",
    );
  });

  it('renders a rename hint when a suggestion exists', () => {
    expect(
      renderLocaleWarning(
        {
          code: 'sv_SE',
          issue: 'invalid-structure',
          suggestion: 'sv',
        },
        'locales',
      ),
    ).toBe(
      "[yapyak] locale 'sv_SE' does not look like a BCP 47 locale tag. yapyak will skip syncing stubs and translating for this locale. Did you mean 'sv'? Rename `locales/sv_SE.json` to `locales/sv.json` to enable.",
    );
  });
});
