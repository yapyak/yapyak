import type { Expression } from 'oxc-parser';

import { describe, expect, it } from 'vitest';

import { collectChildren } from './child';
import { parseSourceFile } from './source-file';

function parseExpression(code: string): Expression {
  const [statement] = parseSourceFile('src/a.ts', {
    code,
    language: 'ts',
    type: 'script',
  }).program.body;
  if (statement?.type !== 'ExpressionStatement') {
    throw new Error('test setup expects an expression statement');
  }
  return statement.expression;
}

describe('collectChildren', () => {
  it('lists the children of a node in source order', () => {
    const children = collectChildren(parseExpression("t('Hello', params);"));

    expect(children.map((child) => child.type)).toEqual([
      'Identifier',
      'Literal',
      'Identifier',
    ]);
  });

  it('skips the holes in a list of children', () => {
    const children = collectChildren(parseExpression("['Hello', , 'World'];"));

    expect(children).toHaveLength(2);
  });

  it('skips the absent children of a node', () => {
    const [classExpression] = collectChildren(parseExpression('(class {});'));
    if (classExpression === undefined) {
      throw new Error('test setup expects a class expression');
    }

    expect(collectChildren(classExpression).map((child) => child.type)).toEqual(
      [
        'ClassBody',
      ],
    );
  });

  it('lists no children for a leaf node', () => {
    expect(collectChildren(parseExpression("'Hello';"))).toEqual([]);
  });

  it('throws for a node type without visitor keys', () => {
    expect(() =>
      collectChildren(
        JSON.parse('{ "type": "Unknown", "start": 0, "end": 0 }'),
      ),
    ).toThrow(/has no visitor keys/);
  });
});
