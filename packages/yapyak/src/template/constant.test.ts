import type { Template } from './node';

import { describe, expect, it } from 'vitest';

import { resolveConstants } from './constant';

describe('resolveConstants', () => {
  it('returns an empty template unchanged', () => {
    expect(resolveConstants([], {})).toEqual([]);
  });

  it('returns a literal-only template unchanged', () => {
    const template: Template = [
      {
        kind: 'literal',
        value: 'Hello',
      },
    ];
    expect(resolveConstants(template, {})).toEqual(template);
  });

  it('folds a placeholder when its param is known', () => {
    const template: Template = [
      {
        kind: 'placeholder',
        name: 'name',
      },
    ];
    expect(
      resolveConstants(template, {
        name: 'World',
      }),
    ).toEqual([
      {
        kind: 'literal',
        value: 'World',
      },
    ]);
  });

  it('preserves a placeholder when its param is missing', () => {
    const template: Template = [
      {
        kind: 'placeholder',
        name: 'name',
      },
    ];
    expect(resolveConstants(template, {})).toEqual(template);
  });

  it('folds adjacent literals after a placeholder resolves', () => {
    const template: Template = [
      {
        kind: 'literal',
        value: 'Hello ',
      },
      {
        kind: 'placeholder',
        name: 'name',
      },
      {
        kind: 'literal',
        value: '!',
      },
    ];
    expect(
      resolveConstants(template, {
        name: 'World',
      }),
    ).toEqual([
      {
        kind: 'literal',
        value: 'Hello World!',
      },
    ]);
  });

  it('folds non-string values via `String()`', () => {
    const template: Template = [
      {
        kind: 'placeholder',
        name: 'n',
      },
    ];
    expect(
      resolveConstants(template, {
        n: 42,
      }),
    ).toEqual([
      {
        kind: 'literal',
        value: '42',
      },
    ]);
  });

  it('preserves number/date/time nodes', () => {
    const template: Template = [
      {
        kind: 'number',
        name: 'v',
        options: {},
      },
      {
        kind: 'date',
        name: 'd',
        style: 'short',
      },
      {
        kind: 'time',
        name: 't',
        style: 'full',
      },
    ];
    expect(
      resolveConstants(template, {
        d: 0,
        t: 0,
        v: 1,
      }),
    ).toEqual(template);
  });

  it('preserves count nodes', () => {
    const template: Template = [
      {
        kind: 'count',
      },
    ];
    expect(resolveConstants(template, {})).toEqual(template);
  });

  describe('plural', () => {
    it('walks into plural branches and folds placeholders there', () => {
      const template: Template = [
        {
          branches: {
            one: [
              {
                kind: 'count',
              },
              {
                kind: 'literal',
                value: ' from ',
              },
              {
                kind: 'placeholder',
                name: 'name',
              },
            ],
            other: [
              {
                kind: 'count',
              },
              {
                kind: 'literal',
                value: ' from ',
              },
              {
                kind: 'placeholder',
                name: 'name',
              },
            ],
          },
          kind: 'plural',
          name: 'count',
          type: 'cardinal',
        },
      ];
      const result = resolveConstants(template, {
        name: 'Ada',
      });
      const node = result[0];
      expect(node?.kind).toBe('plural');
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.one).toEqual([
        {
          kind: 'count',
        },
        {
          kind: 'literal',
          value: ' from Ada',
        },
      ]);
    });

    it('preserves the plural node when the count param is unknown', () => {
      const template: Template = [
        {
          branches: {
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
        },
      ];
      expect(resolveConstants(template, {})).toEqual(template);
    });
  });

  describe('select', () => {
    it('walks into select branches and folds placeholders', () => {
      const template: Template = [
        {
          branches: {
            male: [
              {
                kind: 'literal',
                value: 'he is ',
              },
              {
                kind: 'placeholder',
                name: 'role',
              },
            ],
            other: [
              {
                kind: 'literal',
                value: 'they are ',
              },
              {
                kind: 'placeholder',
                name: 'role',
              },
            ],
          },
          kind: 'select',
          name: 'gender',
        },
      ];
      const result = resolveConstants(template, {
        role: 'admin',
      });
      const node = result[0];
      if (node?.kind !== 'select') {
        return;
      }
      expect(node.branches.male).toEqual([
        {
          kind: 'literal',
          value: 'he is admin',
        },
      ]);
    });
  });

  describe('purity', () => {
    it('preserves the input template', () => {
      const template: Template = [
        {
          kind: 'literal',
          value: 'Hello ',
        },
        {
          kind: 'placeholder',
          name: 'name',
        },
      ];
      const original = JSON.parse(JSON.stringify(template));
      resolveConstants(template, {
        name: 'World',
      });
      expect(template).toEqual(original);
    });
  });
});
