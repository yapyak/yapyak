import type { ReactElement } from 'react';

import { getLocales, t } from 'yapyak';
import { useLocale } from 'yapyak/react';

const now = new Date();

export function App(): ReactElement {
  return (
    <main
      style={{ fontFamily: 'system-ui', maxWidth: '720px', padding: '2rem' }}
    >
      <h1>{t('Hello there')}</h1>
      <p>{t('This is the {name} example.', { name: 'yapyak' })}</p>

      <h2>{t('Plurals')}</h2>
      <p>
        {t('You have {count, plural, one {# message} other {# messages}}', {
          count: 3,
        })}
      </p>
      <p>
        {t('You have {count, plural, one {# message} other {# messages}}', {
          count: 1,
        })}
      </p>

      <h2>{t('Numbers')}</h2>
      <p>{t('Total: {amount, number, percent}', { amount: 0.42 })}</p>
      <p>{t('Price: {amount, number, currency EUR}', { amount: 99.5 })}</p>
      <p>{t('Count: {amount, number, integer}', { amount: 42.7 })}</p>

      <h2>{t('Dates and times')}</h2>
      <p>{t('Updated: {when, date, long}', { when: now })}</p>
      <p>{t('Updated: {when, date, short}', { when: now })}</p>
      <p>{t('At: {when, time, short}', { when: now })}</p>

      <h2>{t('Select')}</h2>
      <p>
        {t('{theme, select, dark {Dark mode is on} other {Light mode is on}}', {
          theme: 'dark',
        })}
      </p>

      <LocaleToggle />
    </main>
  );
}

function LocaleToggle(): ReactElement {
  const [locale, setLocale] = useLocale();
  const locales = getLocales();
  return (
    <label>
      {t('Switch language')}
      <select
        onChange={(event) => setLocale(event.target.value)}
        value={locale}
      >
        {locales.map((code) => (
          <option
            key={code}
            value={code}
          >
            {code === 'sv' ? t('Swedish') : t('English')}
          </option>
        ))}
      </select>
    </label>
  );
}
