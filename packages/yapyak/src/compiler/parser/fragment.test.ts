import { describe, expect, it } from 'vitest';

import { segmentsFromOffset } from '../../processor';
import { validateFragments } from './fragment';

const SOURCE = "import { t } from 'yapyak';";

describe('validateFragments', () => {
  it('preserves a fragment whose segments cover the code', () => {
    expect(() =>
      validateFragments({
        fileId: 'src/a.vue',
        fragments: [
          {
            code: SOURCE,
            language: 'ts',
            segments: segmentsFromOffset(SOURCE, 0),
            type: 'script',
          },
        ],
        processorId: 'template',
        source: SOURCE,
      }),
    ).not.toThrow();
  });

  it('preserves a fragment with empty code', () => {
    expect(() =>
      validateFragments({
        fileId: 'src/a.vue',
        fragments: [
          {
            code: '',
            language: 'ts',
            segments: segmentsFromOffset('', 0),
            type: 'script',
          },
        ],
        processorId: 'template',
        source: '',
      }),
    ).not.toThrow();
  });

  it('refuses a fragment when a segment has a negative code length', () => {
    expect(() =>
      validateFragments({
        fileId: 'src/a.vue',
        fragments: [
          {
            code: SOURCE,
            language: 'ts',
            segments: [
              {
                codeLength: -1,
                sourceOffset: 0,
              },
            ],
            type: 'script',
          },
        ],
        processorId: 'template',
        source: SOURCE,
      }),
    ).toThrow('code length -1');
  });

  it('refuses a fragment when a segment starts outside the source file', () => {
    expect(() =>
      validateFragments({
        fileId: 'src/a.vue',
        fragments: [
          {
            code: SOURCE,
            language: 'ts',
            segments: [
              {
                codeLength: SOURCE.length,
                sourceOffset: SOURCE.length + 1,
              },
            ],
            type: 'script',
          },
        ],
        processorId: 'template',
        source: SOURCE,
      }),
    ).toThrow('outside the source file');
  });

  it('refuses a fragment when the segments do not cover the code', () => {
    expect(() =>
      validateFragments({
        fileId: 'src/a.vue',
        fragments: [
          {
            code: SOURCE,
            language: 'ts',
            segments: [
              {
                codeLength: SOURCE.length - 10,
                sourceOffset: 0,
              },
            ],
            type: 'script',
          },
        ],
        processorId: 'template',
        source: SOURCE,
      }),
    ).toThrow(`covering ${SOURCE.length - 10} code units`);
  });
});
