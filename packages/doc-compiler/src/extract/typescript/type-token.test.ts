import ts from '@typescript/typescript6';
import { describe, expect, it } from 'vitest';

import { buildTypeTokens } from './type-token';

function parseType(code: string): ts.TypeNode | undefined {
  const sourceFile = ts.createSourceFile(
    'a.ts',
    `type Probe = ${code};`,
    ts.ScriptTarget.Latest,
    true,
  );
  const alias = sourceFile.statements.find(ts.isTypeAliasDeclaration);
  return alias?.type;
}

describe('buildTypeTokens', () => {
  it('returns a single text token with the node source for a primitive', () => {
    const node = parseType('string');
    expect(buildTypeTokens(node)).toEqual([
      {
        kind: 'text',
        text: 'string',
      },
    ]);
  });

  it('preserves the source text of a generic application', () => {
    const node = parseType('Record<string, number>');
    expect(buildTypeTokens(node)).toEqual([
      {
        kind: 'text',
        text: 'Record<string, number>',
      },
    ]);
  });

  it('returns an empty list when no node is provided', () => {
    expect(buildTypeTokens()).toEqual([]);
  });
});
