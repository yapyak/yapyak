import type { Template } from './node';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../warn';
import { interpret } from './interpret';

describe('interpret', () => {
  it('renders an empty template as an empty string', () => {
    expect(interpret([], {}, 'en')).toBe('');
  });

  it('renders a single literal as-is', () => {
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

  it('renders a placeholder from params', () => {
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

  it('renders a missing placeholder as an empty string', () => {
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

  it('coerces numeric placeholder values to strings', () => {
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
    it('renders nothing for a CountNode outside any plural context', () => {
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

    it('renders the formatted count inside a plural branch', () => {
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

    it('falls back to `other` when the category has no branch', () => {
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

    it('renders nested placeholders inside a plural branch', () => {
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

    it('selects the matching branch', () => {
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

    it('falls back to `other` when no branch matches', () => {
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

    it('inherits the plural context through a nested select', () => {
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
  });

  describe('number', () => {
    it('formats with no options as decimal default', () => {
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

    it('formats `percent` style', () => {
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

    it('renders an empty string for null', () => {
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
  });

  describe('date', () => {
    it('formats a Date with the given style', () => {
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

    it('renders an empty string for an invalid date input', () => {
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
});
