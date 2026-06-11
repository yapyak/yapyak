import type { Translator } from '../../translator';
import type { ExtractedMessage } from '../parser/file/extract';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { autoTranslate } from './translate';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('autoTranslate', () => {
  let projectRoot: string;
  let localePath: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-auto-translate-'));
    mkdirSync(join(projectRoot, 'locales'), {
      recursive: true,
    });
    localePath = join(projectRoot, 'locales', 'sv.json');
  });

  afterEach(() => {
    rmSync(projectRoot, {
      force: true,
      recursive: true,
    });
  });

  it('writes a fresh locale file when the target does not yet exist', async () => {
    const translator: Translator = Object.assign(
      () => Promise.reject(new Error('use batch')),
      {
        batch: () =>
          Promise.resolve([
            'Hej',
          ]),
        id: 'mock',
      },
    );

    const messages: ExtractedMessage[] = [
      {
        id: 'm1',
        locations: [
          {
            callSiteContext: {},
            fileId: 'src/a.tsx',
            range: {
              end: {
                column: 10,
                line: 1,
                offset: 10,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
          },
        ],
        placeholders: [],
        source: 'Hello',
      },
    ];

    expect(existsSync(localePath)).toBe(false);

    const result = await autoTranslate(
      {
        messages,
        translator,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      projectRoot,
    );

    expect(result.translated).toBe(1);
    expect(existsSync(localePath)).toBe(true);
    expect(JSON.parse(readFileSync(localePath, 'utf-8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });
});
