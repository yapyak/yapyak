import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
  ACCEPT_LANGUAGE: false,
  DEFAULT_LOCALE: 'en',
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: null,
  SYNC_HTML_LANG: false,
}));

const { getLocale, resetLocaleStore } = await import('../locale/store');
const { IntlProvider } = await import('./intl-provider');
const { useLocale } = await import('./use-locale');

afterEach(() => {
  resetLocaleStore();
});

function LocaleLabel(): string {
  const [locale] = useLocale();
  return locale;
}

describe('useLocale', () => {
  it('reads current locale during server render', () => {
    const html = renderToString(<LocaleLabel />);
    expect(html).toBe('en');
  });

  it('returns a setter that updates the store', () => {
    let setter: ((locale: string) => void) | undefined;
    function Capture(): null {
      const [, set] = useLocale();
      setter = set;
      return null;
    }
    renderToString(<Capture />);
    setter?.('sv');
    expect(getLocale()).toBe('sv');
  });
});

describe('IntlProvider', () => {
  it('renders children', () => {
    const html = renderToString(
      <IntlProvider>
        <span>hello</span>
      </IntlProvider>,
    );
    expect(html).toBe('<span>hello</span>');
  });

  it('exposes current locale to descendants', () => {
    const html = renderToString(
      <IntlProvider>
        <LocaleLabel />
      </IntlProvider>,
    );
    expect(html).toBe('en');
  });
});
