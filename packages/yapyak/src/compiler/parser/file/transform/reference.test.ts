import { describe, expect, it } from 'vitest';

import { parseSourceFile } from '../../source-file';
import { isReference } from './reference';

describe('isReference', () => {
  it('returns true for an identifier read as a value', () => {
    const [statement] = parseSourceFile('src/a.ts', {
      code: 'format;',
      language: 'ts',
      type: 'script',
    }).program.body;
    if (
      statement?.type !== 'ExpressionStatement' ||
      statement.expression.type !== 'Identifier'
    ) {
      throw new Error('test setup expects an identifier statement');
    }

    expect(isReference(statement.expression)).toBe(true);
  });

  it('returns false for an identifier naming a property', () => {
    const [statement] = parseSourceFile('src/a.ts', {
      code: 'options.format;',
      language: 'ts',
      type: 'script',
    }).program.body;
    if (
      statement?.type !== 'ExpressionStatement' ||
      statement.expression.type !== 'MemberExpression' ||
      statement.expression.property.type !== 'Identifier'
    ) {
      throw new Error('test setup expects a member expression statement');
    }

    expect(isReference(statement.expression.property)).toBe(false);
  });
});
