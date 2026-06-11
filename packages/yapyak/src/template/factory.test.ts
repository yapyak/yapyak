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

describe('count', () => {
  it('returns a CountNode', () => {
    expect(count()).toEqual({
      kind: 'count',
    });
  });
});

describe('date', () => {
  it('returns a DateNode with the given style', () => {
    expect(date('when', 'short')).toEqual({
      kind: 'date',
      name: 'when',
      style: 'short',
    });
  });
});

describe('literal', () => {
  it('returns a LiteralNode', () => {
    expect(literal('Hello')).toEqual({
      kind: 'literal',
      value: 'Hello',
    });
  });

  it('builds nodes that interpret can read back', () => {
    const ast = [
      literal('Hi '),
      placeholder('name'),
    ];
    expect(ast).toEqual([
      {
        kind: 'literal',
        value: 'Hi ',
      },
      {
        kind: 'placeholder',
        name: 'name',
      },
    ]);
  });
});

describe('number', () => {
  it('returns a NumberNode with options', () => {
    expect(
      number('value', {
        style: 'percent',
      }),
    ).toEqual({
      kind: 'number',
      name: 'value',
      options: {
        style: 'percent',
      },
    });
  });
});

describe('placeholder', () => {
  it('returns a PlaceholderNode', () => {
    expect(placeholder('name')).toEqual({
      kind: 'placeholder',
      name: 'name',
    });
  });
});

describe('plural', () => {
  it('returns a PluralNode with cardinal type', () => {
    const node = plural('count', 'cardinal', {
      one: [
        literal('item'),
      ],
      other: [
        literal('items'),
      ],
    });
    expect(node).toEqual({
      branches: {
        one: [
          {
            kind: 'literal',
            value: 'item',
          },
        ],
        other: [
          {
            kind: 'literal',
            value: 'items',
          },
        ],
      },
      kind: 'plural',
      name: 'count',
      type: 'cardinal',
    });
  });
});

describe('select', () => {
  it('returns a SelectNode', () => {
    const node = select('gender', {
      male: [
        literal('he'),
      ],
      other: [
        literal('they'),
      ],
    });
    expect(node).toEqual({
      branches: {
        male: [
          {
            kind: 'literal',
            value: 'he',
          },
        ],
        other: [
          {
            kind: 'literal',
            value: 'they',
          },
        ],
      },
      kind: 'select',
      name: 'gender',
    });
  });
});

describe('time', () => {
  it('returns a TimeNode with the given style', () => {
    expect(time('when', 'full')).toEqual({
      kind: 'time',
      name: 'when',
      style: 'full',
    });
  });
});
