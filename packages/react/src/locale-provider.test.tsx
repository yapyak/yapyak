import type { ReactElement } from 'react';

import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, setLocale } from 'yapyak';

import { LocaleProvider } from './locale-provider';

afterEach(() => {
  setLocale('en');
});

describe('LocaleProvider', () => {
  it('returns its children verbatim', () => {
    const html = renderToString(
      <LocaleProvider>
        <span>child</span>
      </LocaleProvider>,
    );
    expect(html).toBe('<span>child</span>');
  });

  it('notifies a non-subscribing descendant when the locale changes', () => {
    function Probe(): ReactElement {
      return <span data-testid="probe">{getLocale()}</span>;
    }
    const { getByTestId } = render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(getByTestId('probe').textContent).toBe('en');
    act(() => {
      setLocale('sv');
    });
    expect(getByTestId('probe').textContent).toBe('sv');
  });
});
