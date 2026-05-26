import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');

const CATEGORIES = [
  'bindings',
  'calls',
  'diagnostics',
  'multi-locale',
  'single-locale',
] as const;

interface FixtureFile {
  name: string;
  source: string;
}

function loadFixtureCategory(category: string): readonly FixtureFile[] {
  const dir = join(FIXTURES_DIR, category);
  return readdirSync(dir)
    .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
    .sort()
    .map((name) => ({
      name,
      source: readFileSync(join(dir, name), 'utf-8'),
    }));
}

describe.each(CATEGORIES)('fixtures: %s', (category) => {
  for (const fixture of loadFixtureCategory(category)) {
    it(`parses ${fixture.name}`, () => {
      const scriptKind = fixture.name.endsWith('.tsx')
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS;
      const sourceFile = ts.createSourceFile(
        fixture.name,
        fixture.source,
        ts.ScriptTarget.ESNext,
        true,
        scriptKind,
      );
      expect(sourceFile.statements.length).toBeGreaterThan(0);
    });
  }
});
