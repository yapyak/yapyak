import { describe, expect, it } from 'vitest';

import { t } from './t';

describe('t', () => {
  it('throws a clear error when `t()` is called without compiler rewrite', () => {
    expect(() => t('Save')).toThrow(/t\(\) was not rewritten at build time/);
  });

  it('throws a clear error when `.as` is called without compiler rewrite', () => {
    expect(() => t.as('button', 'Save')).toThrow(
      /t\.as\(\) was not rewritten at build time/,
    );
  });

  it('throws a clear error when `.in` is called without compiler rewrite', () => {
    expect(() => t.in('sv', 'Save')).toThrow(
      /t\.in\(\) was not rewritten at build time/,
    );
  });

  it('throws on chain forms because the inner call throws first', () => {
    expect(() => t.in('sv').as('action', 'Save')).toThrow(
      /t\.in\(\) was not rewritten at build time/,
    );
    expect(() => t.as('button').in('sv', 'Save')).toThrow(
      /t\.as\(\) was not rewritten at build time/,
    );
  });

  it('points to the build-tool plugin in the error message', () => {
    expect(() => t('Save')).toThrow(/register a yapyak build-tool plugin/);
  });
});
