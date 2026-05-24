import type { Fragment, Processor } from '../type';

export const vanillaProcessor: Processor = {
  parseFragments(source: string): Fragment[] {
    return [
      {
        code: source,
        kind: 'script',
        lang: 'ts',
        originalOffset: 0,
      },
    ];
  },
};
