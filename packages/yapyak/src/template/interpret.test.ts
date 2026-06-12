import type { Template } from './node';

import { fc, it } from '@fast-check/vitest';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';

import { resetWarn, setWarn } from '../warn';
import { literal, select } from './factory';
import { interpret } from './interpret';

describe('interpret', () => {
  it('interpolates an empty template as an empty string', () => {
    expect(interpret([], {}, 'en')).toBe('');
  });

  it('interpolates a single literal as-is', () => {
    expect(
      interpret(
        [
          {
            kind: 'literal',
            value: 'Hello',
          },
        ],
        {},
        'en',
      ),
    ).toBe('Hello');
  });

  it('interpolates a placeholder from params', () => {
    expect(
      interpret(
        [
          {
            kind: 'placeholder',
            name: 'name',
          },
        ],
        {
          name: 'Ada',
        },
        'en',
      ),
    ).toBe('Ada');
  });

  it('interpolates a missing placeholder as an empty string', () => {
    expect(
      interpret(
        [
          {
            kind: 'placeholder',
            name: 'name',
          },
        ],
        {},
        'en',
      ),
    ).toBe('');
  });

  it('interpolates numeric placeholder values as strings', () => {
    expect(
      interpret(
        [
          {
            kind: 'placeholder',
            name: 'n',
          },
        ],
        {
          n: 42,
        },
        'en',
      ),
    ).toBe('42');
  });

  describe('count', () => {
    it('interpolates nothing for a CountNode outside any plural context', () => {
      expect(
        interpret(
          [
            {
              kind: 'count',
            },
          ],
          {
            count: 5,
          },
          'en',
        ),
      ).toBe('');
    });

    it('interpolates the formatted count inside a plural branch', () => {
      const template: Template = [
        {
          branches: {
            other: [
              {
                kind: 'count',
              },
              {
                kind: 'literal',
                value: ' items',
              },
            ],
          },
          kind: 'plural',
          name: 'count',
          type: 'cardinal',
        },
      ];
      expect(
        interpret(
          template,
          {
            count: 1234,
          },
          'en',
        ),
      ).toBe('1,234 items');
    });
  });

  describe('plural', () => {
    const oneOrMany: Template = [
      {
        branches: {
          one: [
            {
              kind: 'count',
            },
            {
              kind: 'literal',
              value: ' item',
            },
          ],
          other: [
            {
              kind: 'count',
            },
            {
              kind: 'literal',
              value: ' items',
            },
          ],
        },
        kind: 'plural',
        name: 'count',
        type: 'cardinal',
      },
    ];

    it('picks the `one` branch for cardinality one', () => {
      expect(
        interpret(
          oneOrMany,
          {
            count: 1,
          },
          'en',
        ),
      ).toBe('1 item');
    });

    it('picks the `other` branch for cardinality many', () => {
      expect(
        interpret(
          oneOrMany,
          {
            count: 5,
          },
          'en',
        ),
      ).toBe('5 items');
    });

    it('picks an exact `=N` branch over the category branch', () => {
      const template: Template = [
        {
          branches: {
            '=0': [
              {
                kind: 'literal',
                value: 'none',
              },
            ],
            one: [
              {
                kind: 'count',
              },
              {
                kind: 'literal',
                value: ' item',
              },
            ],
            other: [
              {
                kind: 'count',
              },
              {
                kind: 'literal',
                value: ' items',
              },
            ],
          },
          kind: 'plural',
          name: 'count',
          type: 'cardinal',
        },
      ];
      expect(
        interpret(
          template,
          {
            count: 0,
          },
          'en',
        ),
      ).toBe('none');
    });

    it('picks the `other` branch when the category has no match', () => {
      const template: Template = [
        {
          branches: {
            other: [
              {
                kind: 'literal',
                value: 'many',
              },
            ],
          },
          kind: 'plural',
          name: 'count',
          type: 'cardinal',
        },
      ];
      expect(
        interpret(
          template,
          {
            count: 1,
          },
          'en',
        ),
      ).toBe('many');
    });

    it('interpolates nested placeholders inside a plural branch', () => {
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
      expect(
        interpret(
          template,
          {
            count: 1,
            name: 'Ann',
          },
          'en',
        ),
      ).toBe('1 from Ann');
    });
  });

  describe('select', () => {
    const template: Template = [
      {
        branches: {
          female: [
            {
              kind: 'literal',
              value: 'she',
            },
          ],
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
      },
    ];

    it('picks the matching branch', () => {
      expect(
        interpret(
          template,
          {
            gender: 'female',
          },
          'en',
        ),
      ).toBe('she');
    });

    it('picks the `other` branch when no other branch matches', () => {
      expect(
        interpret(
          template,
          {
            gender: 'unknown',
          },
          'en',
        ),
      ).toBe('they');
    });

    it('preserves the plural context through a nested select', () => {
      const nested: Template = [
        {
          branches: {
            one: [
              {
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
                name: 'g',
              },
              {
                kind: 'literal',
                value: ' sent ',
              },
              {
                kind: 'count',
              },
            ],
          },
          kind: 'plural',
          name: 'count',
          type: 'cardinal',
        },
      ];
      expect(
        interpret(
          nested,
          {
            count: 1,
            g: 'male',
          },
          'en',
        ),
      ).toBe('he sent 1');
    });

    it('returns the `other` branch for a select value that names a prototype method', () => {
      const template: Template = [
        select('gender', {
          female: [
            literal('she'),
          ],
          male: [
            literal('he'),
          ],
          other: [
            literal('they'),
          ],
        }),
      ];
      expect(
        interpret(
          template,
          {
            gender: 'constructor',
          },
          'en',
        ),
      ).toBe('they');
    });

    it('returns the `other` branch for a select value of `__proto__`', () => {
      const template: Template = [
        select('gender', {
          female: [
            literal('she'),
          ],
          male: [
            literal('he'),
          ],
          other: [
            literal('they'),
          ],
        }),
      ];
      expect(
        interpret(
          template,
          {
            gender: '__proto__',
          },
          'en',
        ),
      ).toBe('they');
    });
  });

  describe('number', () => {
    it('interpolates a number with decimal as the default', () => {
      expect(
        interpret(
          [
            {
              kind: 'number',
              name: 'value',
              options: {},
            },
          ],
          {
            value: 1234.5,
          },
          'en',
        ),
      ).toBe('1,234.5');
    });

    it('interpolates a number with `percent` style', () => {
      expect(
        interpret(
          [
            {
              kind: 'number',
              name: 'value',
              options: {
                style: 'percent',
              },
            },
          ],
          {
            value: 0.25,
          },
          'en',
        ),
      ).toBe('25%');
    });

    it('interpolates an empty string for `null`', () => {
      expect(
        interpret(
          [
            {
              kind: 'number',
              name: 'value',
              options: {},
            },
          ],
          {
            value: null,
          },
          'en',
        ),
      ).toBe('');
    });

    it('interpolates an empty string when the value is missing', () => {
      expect(
        interpret(
          [
            {
              kind: 'number',
              name: 'value',
              options: {},
            },
          ],
          {},
          'en',
        ),
      ).toBe('');
    });

    it('interpolates the raw `String()` when the value is not numeric', () => {
      expect(
        interpret(
          [
            {
              kind: 'number',
              name: 'value',
              options: {},
            },
          ],
          {
            value: 'Hello',
          },
          'en',
        ),
      ).toBe('Hello');
    });
  });

  describe('date', () => {
    it('interpolates a Date with the given style', () => {
      const result = interpret(
        [
          {
            kind: 'date',
            name: 'when',
            style: 'short',
          },
        ],
        {
          when: new Date('2026-06-10T00:00:00Z'),
        },
        'en',
      );
      expect(result).toMatch(/\d/);
    });

    it('interpolates an empty string for an invalid date input', () => {
      expect(
        interpret(
          [
            {
              kind: 'date',
              name: 'when',
              style: 'short',
            },
          ],
          {
            when: 'not-a-date',
          },
          'en',
        ),
      ).toBe('');
    });

    it('interpolates an empty string when the value is neither `Date` nor a primitive', () => {
      expect(
        interpret(
          [
            {
              kind: 'date',
              name: 'when',
              style: 'short',
            },
          ],
          {
            when: {
              foo: 'bar',
            },
          },
          'en',
        ),
      ).toBe('');
    });
  });

  describe('time', () => {
    it('interpolates a Date with the given style', () => {
      const result = interpret(
        [
          {
            kind: 'time',
            name: 'when',
            style: 'short',
          },
        ],
        {
          when: new Date('2026-06-10T08:30:00Z'),
        },
        'en',
      );
      expect(result).toMatch(/\d/);
    });

    it('interpolates an empty string for an invalid time input', () => {
      expect(
        interpret(
          [
            {
              kind: 'time',
              name: 'when',
              style: 'short',
            },
          ],
          {
            when: 'not-a-time',
          },
          'en',
        ),
      ).toBe('');
    });
  });

  describe('warnings', () => {
    let warnSpy: ReturnType<
      typeof vi.fn<(message: string, meta?: Record<string, unknown>) => void>
    >;

    beforeEach(() => {
      warnSpy =
        vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
      setWarn(warnSpy);
    });

    afterEach(() => {
      resetWarn();
    });

    it('warns when a placeholder is missing', () => {
      interpret(
        [
          {
            kind: 'placeholder',
            name: 'name',
          },
        ],
        {},
        'en',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing placeholder "name"'),
        undefined,
      );
    });

    it('warns when a placeholder gets `null`', () => {
      interpret(
        [
          {
            kind: 'placeholder',
            name: 'name',
          },
        ],
        {
          name: null,
        },
        'en',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Placeholder "name" got `null`'),
        undefined,
      );
    });

    it('warns when a placeholder gets an object', () => {
      const value = {
        toString: () => 'whatever',
      };
      interpret(
        [
          {
            kind: 'placeholder',
            name: 'name',
          },
        ],
        {
          name: value,
        },
        'en',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Placeholder "name" got an object'),
        expect.objectContaining({
          value,
        }),
      );
    });

    it('warns when a plural argument is not numeric', () => {
      interpret(
        [
          {
            branches: {
              one: [
                {
                  kind: 'literal',
                  value: 'one',
                },
              ],
              other: [
                {
                  kind: 'literal',
                  value: 'other',
                },
              ],
            },
            kind: 'plural',
            name: 'count',
            type: 'cardinal',
          },
        ],
        {
          count: 'not-a-number',
        },
        'en',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plural "count"'),
        expect.objectContaining({
          value: 'not-a-number',
        }),
      );
    });

    it('warns and falls to `other` when a plural argument is `null`', () => {
      const result = interpret(
        [
          {
            branches: {
              one: [
                {
                  kind: 'literal',
                  value: 'one',
                },
              ],
              other: [
                {
                  kind: 'literal',
                  value: 'other',
                },
              ],
            },
            kind: 'plural',
            name: 'count',
            type: 'cardinal',
          },
        ],
        {
          count: null,
        },
        'en',
      );
      expect(result).toBe('other');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plural "count" missing'),
        expect.objectContaining({
          value: null,
        }),
      );
    });

    it('warns and falls to `other` when a plural argument is missing', () => {
      const result = interpret(
        [
          {
            branches: {
              one: [
                {
                  kind: 'literal',
                  value: 'one',
                },
              ],
              other: [
                {
                  kind: 'literal',
                  value: 'other',
                },
              ],
            },
            kind: 'plural',
            name: 'count',
            type: 'cardinal',
          },
        ],
        {},
        'en',
      );
      expect(result).toBe('other');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plural "count" missing'),
        expect.objectContaining({
          value: undefined,
        }),
      );
    });

    it('warns and falls to `other` when a plural argument is an empty string', () => {
      const result = interpret(
        [
          {
            branches: {
              other: [
                {
                  kind: 'literal',
                  value: 'other',
                },
              ],
            },
            kind: 'plural',
            name: 'count',
            type: 'cardinal',
          },
        ],
        {
          count: '',
        },
        'en',
      );
      expect(result).toBe('other');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plural "count" missing'),
        expect.objectContaining({
          value: '',
        }),
      );
    });

    it('warns when a select argument is not a string', () => {
      interpret(
        [
          {
            branches: {
              other: [
                {
                  kind: 'literal',
                  value: 'fallback',
                },
              ],
            },
            kind: 'select',
            name: 'role',
          },
        ],
        {
          role: 42,
        },
        'en',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Select "role"'),
        expect.objectContaining({
          value: 42,
        }),
      );
    });

    it('preserves a select branch matched by a coerced non-string value without warning', () => {
      interpret(
        [
          {
            branches: {
              '1': [
                {
                  kind: 'literal',
                  value: 'first',
                },
              ],
              other: [
                {
                  kind: 'literal',
                  value: 'fallback',
                },
              ],
            },
            kind: 'select',
            name: 'rank',
          },
        ],
        {
          rank: 1,
        },
        'en',
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('preserves a placeholder with a string value without warning', () => {
      interpret(
        [
          {
            kind: 'placeholder',
            name: 'name',
          },
        ],
        {
          name: 'Ada',
        },
        'en',
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('properties', () => {
    beforeEach(() => {
      setWarn(() => {});
    });

    afterEach(() => {
      resetWarn();
    });

    it.prop([
      fc.string(),
    ])('preserves every literal value as the rendered output', (value) => {
      expect(
        interpret(
          [
            {
              kind: 'literal',
              value,
            },
          ],
          {},
          'en',
        ),
      ).toBe(value);
    });

    it.prop([
      fc.oneof(fc.string(), fc.integer(), fc.float(), fc.boolean()),
    ])(
      'interpolates `String(value)` for every placeholder param of primitive type',
      (value) => {
        expect(
          interpret(
            [
              {
                kind: 'placeholder',
                name: 'value',
              },
            ],
            {
              value,
            },
            'en',
          ),
        ).toBe(String(value));
      },
    );

    const nodeArbitrary: fc.Arbitrary<Template[number]> = fc.oneof(
      fc.string().map((value) => ({
        kind: 'literal' as const,
        value,
      })),
      fc.constant({
        kind: 'placeholder' as const,
        name: 'value',
      }),
    );

    it.prop([
      fc.array(nodeArbitrary),
      fc.string(),
    ])(
      'returns a string for every template of literal and placeholder nodes',
      (template, paramValue) => {
        const result = interpret(
          template,
          {
            value: paramValue,
          },
          'en',
        );
        expect(typeof result).toBe('string');
      },
    );

    it.prop([
      fc.string(),
    ])('returns a string for every select value', (value) => {
      const template: Template = [
        select('gender', {
          female: [
            literal('she'),
          ],
          male: [
            literal('he'),
          ],
          other: [
            literal('they'),
          ],
        }),
      ];
      const result = interpret(
        template,
        {
          gender: value,
        },
        'en',
      );
      expect(typeof result).toBe('string');
    });

    const sameOutputTemplate: Template = [
      {
        kind: 'literal',
        value: 'Hello ',
      },
      {
        kind: 'placeholder',
        name: 'name',
      },
    ];

    it.prop([
      fc.string(),
    ])(
      'returns the same output when given the same template, params, and locale',
      (name) => {
        const a = interpret(
          sameOutputTemplate,
          {
            name,
          },
          'en',
        );
        const b = interpret(
          sameOutputTemplate,
          {
            name,
          },
          'en',
        );
        expect(a).toBe(b);
      },
    );

    it.prop([
      fc.string(),
    ])(
      'returns an empty string for every placeholder when its param is missing',
      (name) => {
        expect(
          interpret(
            [
              {
                kind: 'placeholder',
                name,
              },
            ],
            {},
            'en',
          ),
        ).toBe('');
      },
    );
  });
});
