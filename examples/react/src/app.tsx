import type { ReactElement } from 'react';
import { t } from 'yapyak';
import { useLocale } from 'yapyak/react';

export function App(): ReactElement {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>{t('Hello, world')}</h1>
      <p>{t('This is the yapyak React example.')}</p>
      <p>
        {t('You have {count, plural, one {# message} other {# messages}}', {
          count: 3,
        })}
      </p>
      <LocaleToggle />
    </main>
  );
}

function LocaleToggle(): ReactElement {
  const [locale, setLocale] = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}
      type="button"
    >
      {locale.toUpperCase()}
    </button>
  );
}
