import { describe, expect, it } from 'vitest';

import { renderTranslationErrors } from './translation-error';

describe('renderTranslationErrors', () => {
  it('returns an empty string for an empty list', () => {
    expect(renderTranslationErrors([])).toBe('');
  });

  it('writes a count header for the failure total', () => {
    const output = renderTranslationErrors([
      {
        error: new Error('anthropic: 429 rate_limit'),
        fileId: 'src/a.tsx',
        locale: 'sv',
        source: 'Save',
      },
    ]);
    expect(output).toContain('1 failed');
  });

  it('writes each error message exactly once when grouped', () => {
    const output = renderTranslationErrors([
      {
        error: new Error('anthropic: 429 rate_limit'),
        fileId: 'src/a.tsx',
        locale: 'sv',
        source: 'Save',
      },
      {
        error: new Error('anthropic: 429 rate_limit'),
        fileId: 'src/b.tsx',
        locale: 'sv',
        source: 'Cancel',
      },
    ]);
    const matches = output.match(/anthropic: 429 rate_limit/g);
    expect(matches).toHaveLength(1);
  });

  it('writes every failing source under its grouped error', () => {
    const output = renderTranslationErrors([
      {
        error: new Error('anthropic: 429 rate_limit'),
        fileId: 'src/a.tsx',
        locale: 'sv',
        source: 'Save',
      },
      {
        error: new Error('placeholder mismatch'),
        fileId: 'src/b.tsx',
        locale: 'sv',
        source: 'Hi {name}',
      },
    ]);
    expect(output).toContain('Save');
    expect(output).toContain('Hi {name}');
    expect(output).toContain('placeholder mismatch');
  });

  it('writes a stringified value when the error is not an `Error` instance', () => {
    const output = renderTranslationErrors([
      {
        error: 'plain string error',
        fileId: 'src/a.tsx',
        locale: 'sv',
        source: 'Save',
      },
    ]);
    expect(output).toContain('plain string error');
  });
});
