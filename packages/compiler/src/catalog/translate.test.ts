import type { Translator } from '@yapyak/translator';
import type { ExtractedMessage } from '../parser/file/extract';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { autoTranslate } from './translate';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('autoTranslate', () => {
  let projectRoot: string;
  let localePath: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-auto-translate-'));
    mkdirSync(join(projectRoot, 'locales'), { recursive: true });
    localePath = join(projectRoot, 'locales', 'sv.json');
  });

  afterEach(() => {
    rmSync(projectRoot, { force: true, recursive: true });
  });

  it('blocks the write when locale file is deleted mid-translation', async () => {
    writeFileSync(localePath, '{}');

    let resolveTranslation: (value: string[]) => void = () => {};
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () =>
          new Promise<string[]>((resolve) => {
            resolveTranslation = resolve;
          }),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/foo.tsx',
            range: {
              end: { column: 10, line: 1, offset: 10 },
              start: { column: 1, line: 1, offset: 0 },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    const promise = autoTranslate({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      messages,
      projectRoot,
      translator,
    });

    rmSync(localePath);
    resolveTranslation(['Hej']);
    await promise;

    expect(existsSync(localePath)).toBe(false);
  });
});
