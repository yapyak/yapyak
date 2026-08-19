import { describe, expect, it } from 'vitest';
import { getDocsUrl } from 'yapyak/compiler/internal';

import { toDiagnosticCode, toDiagnosticItem } from './diagnostic-item';

const COMPILER = {
  getDocsUrl,
};

const RANGE = {
  end: {
    column: 25,
    line: 3,
    offset: 137,
  },
  start: {
    column: 12,
    line: 3,
    offset: 124,
  },
};

describe('toDiagnosticCode', () => {
  it('returns the code when found', () => {
    expect(
      toDiagnosticCode({
        target: 'https://yapyak.dev/reference/diagnostics/YAP0053',
        value: 'YAP0053',
      }),
    ).toBe('YAP0053');
  });

  it('returns undefined when not found', () => {
    expect(toDiagnosticCode('YAP0053')).toBeUndefined();
  });
});

describe('toDiagnosticItem', () => {
  it('builds an item from a diagnostic', () => {
    expect(
      toDiagnosticItem(COMPILER, {
        code: 'YAP0004',
        fileId: 'src/a.tsx',
        message: 'Params is missing key `name` for placeholder `{name}`.',
        range: RANGE,
        severity: 'error',
      }),
    ).toEqual({
      code: 'YAP0004',
      docsUrl: 'https://yapyak.dev/reference/diagnostics/YAP0004',
      endOffset: 137,
      message: 'Params is missing key `name` for placeholder `{name}`.',
      severity: 'error',
      startOffset: 124,
    });
  });

  it('builds an item holding the hint below the message', () => {
    expect(
      toDiagnosticItem(COMPILER, {
        code: 'YAP0046',
        fileId: 'src/a.tsx',
        hint: 'Use one of `zero`, `one`, `two`, `few`, `many`, `other`.',
        message: 'Branch `oen` in `{count}` is not a plural keyword.',
        range: RANGE,
        severity: 'error',
      }).message,
    ).toBe(
      'Branch `oen` in `{count}` is not a plural keyword.\nUse one of `zero`, `one`, `two`, `few`, `many`, `other`.',
    );
  });

  it('builds an item for a warning', () => {
    expect(
      toDiagnosticItem(COMPILER, {
        code: 'YAP0039',
        fileId: 'src/a.tsx',
        message: 'Locale `sv` has no file.',
        range: RANGE,
        severity: 'warning',
      }).severity,
    ).toBe('warning');
  });
});
