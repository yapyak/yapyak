import { describe, expect, it } from 'vitest';

import { createDiagnostic } from './diagnostic';

const range = {
  end: { column: 10, line: 1, offset: 9 },
  start: { column: 1, line: 1, offset: 0 },
};

describe('createDiagnostic', () => {
  it('builds a diagnostic with every field set when a hint is provided', () => {
    expect(
      createDiagnostic({
        code: 'YPK101',
        fileId: 'src/a.ts',
        hint: 'Pass the source inline.',
        message: 'Missing source.',
        range,
        severity: 'error',
        source: 't()',
      }),
    ).toEqual({
      code: 'YPK101',
      fileId: 'src/a.ts',
      hint: 'Pass the source inline.',
      message: 'Missing source.',
      range,
      severity: 'error',
      source: 't()',
    });
  });

  it('builds a diagnostic without `hint` when none is provided', () => {
    const result = createDiagnostic({
      code: 'YPK101',
      fileId: 'src/a.ts',
      message: 'Missing source.',
      range,
      severity: 'error',
      source: 't()',
    });
    expect(result.hint).toBeUndefined();
  });
});
