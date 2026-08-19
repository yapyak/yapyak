import { describe, expect, it } from 'vitest';

import { toLocaleCodeError } from './code-error';

const compiler = {
  validateLocaleCode: (code: string) => {
    if (code === 'sv') {
      return {
        valid: true,
      };
    }
    if (code === 'en_US') {
      return {
        suggestion: 'en',
        valid: false,
      };
    }
    return {
      valid: false,
    };
  },
};

describe('toLocaleCodeError', () => {
  it('returns undefined for a valid code', () => {
    expect(toLocaleCodeError(compiler, 'sv')).toBeUndefined();
  });

  it('returns undefined for an empty value', () => {
    expect(toLocaleCodeError(compiler, '  ')).toBeUndefined();
  });

  it('builds an error naming the closest code', () => {
    expect(toLocaleCodeError(compiler, 'en_US')).toBe(
      '"en_US" is not a valid locale code. Did you mean en?',
    );
  });

  it('builds an error without a code when nothing is close', () => {
    expect(toLocaleCodeError(compiler, 'svenska')).toBe(
      '"svenska" is not a valid locale code.',
    );
  });
});
