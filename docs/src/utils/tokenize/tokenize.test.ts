import { describe, expect, it } from 'vitest';

import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('returns `diff-add` tokens for a `diff` source', () => {
    expect(
      tokenize('+Hello', 'diff').some((token) => token.kind === 'diff-add'),
    ).toBe(true);
  });

  it('returns `bash-flag` tokens for a `bash` source', () => {
    expect(
      tokenize('cmd --hello', 'bash').some(
        (token) => token.kind === 'bash-flag',
      ),
    ).toBe(true);
  });

  it('returns `jsx-tag` tokens for an `html` source', () => {
    expect(
      tokenize('<div>', 'html').some((token) => token.kind === 'jsx-tag'),
    ).toBe(true);
  });

  it('returns `keyword` tokens for a `yaml` source', () => {
    expect(
      tokenize('title: Hello', 'yaml').some(
        (token) => token.kind === 'keyword',
      ),
    ).toBe(true);
  });

  it('returns `tx-source` tokens for a `json` source value after `:`', () => {
    expect(
      tokenize('{"key": "Hello"}', 'json').some(
        (token) => token.kind === 'tx-source',
      ),
    ).toBe(true);
  });

  it('returns `tx-source` tokens for a `translation` source', () => {
    expect(
      tokenize('Hello', 'translation').some(
        (token) => token.kind === 'tx-source',
      ),
    ).toBe(true);
  });

  it('returns a `keyword` token for `const` in a `ts` source', () => {
    expect(
      tokenize('const x = 1', 'ts').some(
        (token) => token.kind === 'keyword' && token.value === 'const',
      ),
    ).toBe(true);
  });

  it('marks a `yapyak` import string as `tx-yapyak` in a `ts` source', () => {
    expect(
      tokenize("import { t } from 'yapyak'", 'ts').some(
        (token) => token.kind === 'tx-yapyak',
      ),
    ).toBe(true);
  });

  it('marks a `t()` source argument as `tx-source` in a `ts` source', () => {
    const tokens = tokenize("t('Hello')", 'ts');
    expect(
      tokens.some(
        (token) => token.kind === 'tx-source' && token.value === "'Hello'",
      ),
    ).toBe(true);
    expect(
      tokens.some((token) => token.kind === 'tx-call' && token.value === 't'),
    ).toBe(true);
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
  it('expands a `${expr}` interpolation in a `ts` template', () => {
    expect(
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      tokenize('`Hello, ${name}`', 'ts').some(
        (token) => token.kind === 'punct' && token.value === '${',
      ),
    ).toBe(true);
  });

  it('marks an identifier after `:` as `type` in a `ts` source', () => {
    expect(
      tokenize('const value: Settings = {}', 'ts').some(
        (token) => token.kind === 'type' && token.value === 'Settings',
      ),
    ).toBe(true);
  });
});
