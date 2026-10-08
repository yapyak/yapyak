import { describe, expect, it } from 'vitest';

import { buildStatusText, buildUnsupportedStatusText } from './status-text';

describe('buildStatusText', () => {
  it('builds a spinning label with the remaining count when a run is in flight', () => {
    expect(
      buildStatusText({
        failed: 0,
        missing: 12,
        translating: 9,
      }),
    ).toBe('$(sync~spin) Translating (9)');
  });

  it('builds a warning label with the failed count when the last run failed', () => {
    expect(
      buildStatusText({
        failed: 3,
        missing: 12,
      }),
    ).toBe('$(warning) Failed (3)');
  });

  it('builds an untranslated label with the missing count', () => {
    expect(
      buildStatusText({
        failed: 0,
        missing: 12,
      }),
    ).toBe('$(globe) Untranslated (12)');
  });

  it('builds a check label when nothing is missing', () => {
    expect(
      buildStatusText({
        failed: 0,
        missing: 0,
      }),
    ).toBe('$(check) yapyak');
  });
});

describe('buildUnsupportedStatusText', () => {
  it('builds a warning label with the found and required versions', () => {
    expect(buildUnsupportedStatusText('0.0.12', '0.0.15')).toBe(
      '$(warning) yapyak 0.0.12 · needs 0.0.15',
    );
  });
});
