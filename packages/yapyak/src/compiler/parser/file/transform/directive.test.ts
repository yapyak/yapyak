import { describe, expect, it } from 'vitest';

import {
  extractPrologueDirectives,
  resolveDirectivePrologueEnd,
} from './directive';

describe('extractPrologueDirectives', () => {
  it('lists no entries when source has no directives', () => {
    expect(extractPrologueDirectives('export const a = 1;\n')).toEqual([]);
  });

  it('lists a single `use client` directive', () => {
    expect(
      extractPrologueDirectives("'use client';\nexport const a = 1;\n"),
    ).toEqual([
      'use client',
    ]);
  });

  it('lists every directive in declaration order', () => {
    expect(
      extractPrologueDirectives(
        "'use strict';\n'use client';\nexport const a = 1;\n",
      ),
    ).toEqual([
      'use strict',
      'use client',
    ]);
  });

  it('lists directives after a shebang line', () => {
    expect(
      extractPrologueDirectives(
        "#!/usr/bin/env node\n'use strict';\nexport const a = 1;\n",
      ),
    ).toEqual([
      'use strict',
    ]);
  });

  it('lists directives after leading line comments', () => {
    expect(
      extractPrologueDirectives(
        "// banner comment\n'use client';\nexport const a = 1;\n",
      ),
    ).toEqual([
      'use client',
    ]);
  });

  it('lists directives written with double quotes', () => {
    expect(
      extractPrologueDirectives('"use client";\nexport const a = 1;\n'),
    ).toEqual([
      'use client',
    ]);
  });
});

describe('resolveDirectivePrologueEnd', () => {
  it('returns `0` when source has no directives', () => {
    expect(resolveDirectivePrologueEnd('export const a = 1;\n')).toBe(0);
  });

  it('returns the offset after a single `use client` directive', () => {
    const source = "'use client';\nexport const a = 1;\n";
    expect(resolveDirectivePrologueEnd(source)).toBe("'use client';\n".length);
  });

  it('returns the offset after multiple stacked directives', () => {
    const prologue = "'use strict';\n'use client';\n";
    const source = `${prologue}export const a = 1;\n`;
    expect(resolveDirectivePrologueEnd(source)).toBe(prologue.length);
  });
});
