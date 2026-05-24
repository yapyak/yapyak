import type MagicString from 'magic-string';
import type { Fragment, Processor } from '../type';

export const vanillaProcessor: Processor = {
  applyImport(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void {
    void source;
    magicString.prepend(`${importStatement}\n`);
  },

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
