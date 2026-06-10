import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildReport } from './report';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseOptions = {
  defaultLocale: 'en',
  exclude: [],
  include: [
    'src/**/*.ts',
  ],
  localesDir: 'locales',
};

describe('buildReport', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-report-'));
    mkdirSync(join(root, 'src'), {
      recursive: true,
    });
    mkdirSync(join(root, 'locales'), {
      recursive: true,
    });
  });

  afterEach(() => {
    rmSync(root, {
      force: true,
      recursive: true,
    });
  });

  it('returns an empty report when no source files exist', () => {
    const report = buildReport({
      ...baseOptions,
      projectRoot: root,
    });
    expect(report.totalMessages).toBe(0);
    expect(report.messages).toEqual([]);
    expect(report.missing).toEqual([]);
  });

  it('lists every extracted message across the source tree', () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    const report = buildReport({
      ...baseOptions,
      projectRoot: root,
    });
    expect(report.totalMessages).toBe(1);
    expect(report.messages[0]?.source).toBe('Save');
  });

  it('builds `perLocale` stats with the default locale fully translated', () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    const report = buildReport({
      ...baseOptions,
      projectRoot: root,
    });
    expect(report.perLocale.en).toEqual({
      missing: 0,
      translated: 1,
    });
  });

  it('lists every missing translation in a non-default locale', () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/app.ts': {
          Save: '',
        },
      }),
    );
    const report = buildReport({
      ...baseOptions,
      projectRoot: root,
    });
    expect(report.missing).toHaveLength(1);
    expect(report.missing[0]).toMatchObject({
      locale: 'sv',
      source: 'Save',
    });
  });
});
