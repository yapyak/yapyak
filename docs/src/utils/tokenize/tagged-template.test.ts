import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { markTaggedTemplates } from './tagged-template';

describe('markTaggedTemplates', () => {
  it('marks an identifier preceding a template as `fn-call`', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: 'css',
      },
      {
        type: 'template',
        value: '`Hello`',
      },
    ];
    markTaggedTemplates(tokens);
    expect(tokens[0]?.type).toBe('fn-call');
  });

  it('preserves a `type` token preceding a template by re-marking it as `fn-call`', () => {
    const tokens: Token[] = [
      {
        type: 'type',
        value: 'String',
      },
      {
        type: 'template',
        value: '`Hello`',
      },
    ];
    markTaggedTemplates(tokens);
    expect(tokens[0]?.type).toBe('fn-call');
  });

  it('preserves an identifier separated from the template by whitespace', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: 'css',
      },
      {
        type: 'plain',
        value: ' ',
      },
      {
        type: 'template',
        value: '`Hello`',
      },
    ];
    markTaggedTemplates(tokens);
    expect(tokens[0]?.type).toBe('plain');
  });
});
