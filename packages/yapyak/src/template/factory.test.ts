import { describe, expect, it } from 'vitest';

import {
  count,
  date,
  literal,
  number,
  placeholder,
  plural,
  select,
  time,
} from './factory';

describe('factory', () => {
  it('literal returns a LiteralNode', () => {
    expect(literal('Hello')).toEqual({ kind: 'literal', value: 'Hello' });
  });

  it('placeholder returns a PlaceholderNode', () => {
    expect(placeholder('name')).toEqual({ kind: 'placeholder', name: 'name' });
  });

  it('count returns a CountNode', () => {
    expect(count()).toEqual({ kind: 'count' });
  });

  it('plural returns a PluralNode with cardinal type', () => {
    const node = plural('count', 'cardinal', {
      one: [literal('item')],
      other: [literal('items')],
    });
    expect(node).toEqual({
      branches: {
        one: [{ kind: 'literal', value: 'item' }],
        other: [{ kind: 'literal', value: 'items' }],
      },
      kind: 'plural',
      name: 'count',
      type: 'cardinal',
    });
  });

  it('select returns a SelectNode', () => {
    const node = select('gender', {
      male: [literal('he')],
      other: [literal('they')],
    });
    expect(node).toEqual({
      branches: {
        male: [{ kind: 'literal', value: 'he' }],
        other: [{ kind: 'literal', value: 'they' }],
      },
      kind: 'select',
      name: 'gender',
    });
  });

  it('number returns a NumberNode with options', () => {
    expect(number('value', { style: 'percent' })).toEqual({
      kind: 'number',
      name: 'value',
      options: { style: 'percent' },
    });
  });

  it('date returns a DateNode with style', () => {
    expect(date('when', 'short')).toEqual({
      kind: 'date',
      name: 'when',
      style: 'short',
    });
  });

  it('time returns a TimeNode with style', () => {
    expect(time('when', 'full')).toEqual({
      kind: 'time',
      name: 'when',
      style: 'full',
    });
  });

  it('composes nodes that interpret can render correctly', () => {
    const ast = [literal('Hi '), placeholder('name')];
    expect(ast).toEqual([
      { kind: 'literal', value: 'Hi ' },
      { kind: 'placeholder', name: 'name' },
    ]);
  });
});
