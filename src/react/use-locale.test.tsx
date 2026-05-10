import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { configureLocale, resetLocaleStore } from '../locale/store.js';
import { IntlProvider } from './intl-provider.js';
import { useLocale } from './use-locale.js';

afterEach(() => {
  resetLocaleStore();
});

function LocaleLabel(): string {
  const [locale] = useLocale();
  return locale;
}

describe('useLocale', () => {
  it('reads current locale during server render', () => {
    configureLocale({
      defaultLocale: 'en',
      initialLocale: 'sv',
      locales: ['en', 'sv'],
    });
    const html = renderToString(<LocaleLabel />);
    expect(html).toBe('sv');
  });

  it('reflects defaultLocale when nothing else configured', () => {
    configureLocale({
      defaultLocale: 'fr',
      locales: ['en', 'sv', 'fr'],
    });
    const html = renderToString(<LocaleLabel />);
    expect(html).toBe('fr');
  });

  it('returns a setter that updates the store', () => {
    const store = configureLocale({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    let setter: ((locale: string) => void) | undefined;
    function Capture(): null {
      const [, set] = useLocale();
      setter = set;
      return null;
    }
    renderToString(<Capture />);
    setter?.('sv');
    expect(store.get()).toBe('sv');
  });
});

describe('IntlProvider', () => {
  it('renders children', () => {
    configureLocale({
      defaultLocale: 'en',
      locales: ['en'],
    });
    const html = renderToString(
      <IntlProvider>
        <span>hello</span>
      </IntlProvider>,
    );
    expect(html).toBe('<span>hello</span>');
  });

  it('subscribes to store via useSyncExternalStore on render', () => {
    configureLocale({
      defaultLocale: 'en',
      initialLocale: 'sv',
      locales: ['en', 'sv'],
    });
    const html = renderToString(
      <IntlProvider>
        <LocaleLabel />
      </IntlProvider>,
    );
    expect(html).toBe('sv');
  });
});
