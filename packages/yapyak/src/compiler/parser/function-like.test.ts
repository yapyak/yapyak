import { describe, expect, it } from 'vitest';

import { isFunctionLike } from './function-like';
import { parseSourceFile } from './source-file';

describe('isFunctionLike', () => {
  it('returns true for an arrow function', () => {
    const [statement] = parseSourceFile('src/a.ts', {
      code: "() => t('Hello');",
      language: 'ts',
      type: 'script',
    }).program.body;
    if (statement?.type !== 'ExpressionStatement') {
      throw new Error('test setup expects an expression statement');
    }

    expect(isFunctionLike(statement.expression)).toBe(true);
  });

  it('returns false for a call expression', () => {
    const [statement] = parseSourceFile('src/a.ts', {
      code: "t('Hello');",
      language: 'ts',
      type: 'script',
    }).program.body;
    if (statement?.type !== 'ExpressionStatement') {
      throw new Error('test setup expects an expression statement');
    }

    expect(isFunctionLike(statement.expression)).toBe(false);
  });
});
