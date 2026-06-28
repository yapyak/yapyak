import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { expandTemplateInterpolations } from './template-interpolation';

const NAME_TOKEN: Token = {
  type: 'plain',
  value: 'name',
};

const tokenizeStub = () => [
  NAME_TOKEN,
];

describe('expandTemplateInterpolations', () => {
  // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
  it('splits a template with `${expr}` into segments around the interpolation', () => {
    const tokens: Token[] = [
      {
        type: 'template',
        // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
        value: '`Hello, ${name}`',
      },
    ];

    const result = expandTemplateInterpolations(tokens, 'ts', tokenizeStub);

    expect(result).toEqual([
      {
        type: 'template',
        value: '`',
      },
      {
        type: 'template',
        value: 'Hello, ',
      },
      {
        type: 'punct',
        value: '${',
      },
      NAME_TOKEN,
      {
        type: 'punct',
        value: '}',
      },
      {
        type: 'template',
        value: '`',
      },
    ]);
  });

  it('preserves a template with no interpolation', () => {
    const tokens: Token[] = [
      {
        type: 'template',
        value: '`Hello`',
      },
    ];

    expect(expandTemplateInterpolations(tokens, 'ts', tokenizeStub)).toEqual(
      tokens,
    );
  });

  it('preserves a non-`template` token unchanged', () => {
    const tokens: Token[] = [
      {
        type: 'keyword',
        value: 'const',
      },
    ];

    expect(expandTemplateInterpolations(tokens, 'ts', tokenizeStub)).toEqual(
      tokens,
    );
  });
});
