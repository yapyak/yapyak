import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LocaleProvider } from './locale-provider';

describe('LocaleProvider', () => {
  it('returns its children verbatim', () => {
    const html = renderToString(
      <LocaleProvider>
        <span>child</span>
      </LocaleProvider>,
    );
    expect(html).toBe('<span>child</span>');
  });
});
