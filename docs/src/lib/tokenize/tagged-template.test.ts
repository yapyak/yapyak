import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { markTaggedTemplates } from './tagged-template';

describe('markTaggedTemplates', () => {
  it('marks an identifier preceding a template as `fn-call`', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: 'css',
      },
      {
        kind: 'template',
        value: '`Hello`',
      },
    ];
    markTaggedTemplates(tokens);
    expect(tokens[0]?.kind).toBe('fn-call');
  });

  it('preserves a `type` token preceding a template by re-marking it as `fn-call`', () => {
    const tokens: Token[] = [
      {
        kind: 'type',
        value: 'String',
      },
      {
        kind: 'template',
        value: '`Hello`',
      },
    ];
    markTaggedTemplates(tokens);
    expect(tokens[0]?.kind).toBe('fn-call');
  });

  it('preserves an identifier separated from the template by whitespace', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: 'css',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'template',
        value: '`Hello`',
      },
    ];
    markTaggedTemplates(tokens);
    expect(tokens[0]?.kind).toBe('plain');
  });
});
