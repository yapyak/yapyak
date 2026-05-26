import { describe, expect, it } from 'vitest';

import { vanillaProcessor } from './vanilla';

describe('vanillaProcessor', () => {
  describe('parseFragments', () => {
    it('returns a single fragment covering the entire source', () => {
      const source =
        "import { t } from 'yapyak';\nexport const x = t('Hello');\n";
      const fragments = vanillaProcessor.parseFragments(source);
      expect(fragments).toHaveLength(1);
      expect(fragments[0]?.code).toBe(source);
      expect(fragments[0]?.originalOffset).toBe(0);
      expect(fragments[0]?.kind).toBe('script');
    });

    it('returns the source byte-for-byte', () => {
      const source = '\n\nlet x = 1;\n\t  console.log(x);\n';
      const fragments = vanillaProcessor.parseFragments(source);
      expect(fragments[0]?.code).toBe(source);
    });

    it('returns a single empty fragment for empty source', () => {
      const fragments = vanillaProcessor.parseFragments('');
      expect(fragments).toHaveLength(1);
      expect(fragments[0]?.code).toBe('');
    });
  });
});
