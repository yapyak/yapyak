import { RichText, useLocale } from '@yapyak/react';
import { format, locales, t } from 'yapyak';

const date = new Date('2024-01-01T08:30:00Z');

export function App() {
  const [locale, setLocale] = useLocale();

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 720, padding: 32 }}>
      <h1>{t('Hello there')}</h1>
      <p>{t('This is the {name} example.', { name: 'yapyak' })}</p>

      <h2>{t('Switch language')}</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        {locales.map((value) => (
          <button
            disabled={value === locale}
            key={value}
            onClick={() => setLocale(value)}
            type="button"
          >
            {value === 'sv' ? t('Swedish') : t('English')}
          </button>
        ))}
      </div>

      <h2>{t('Homonyms')}</h2>
      <div>
        <button type="button">{t.as('button', 'Open')}</button>
      </div>
      <div>
        <span>{t.as('badge', 'Open')}</span>
      </div>

      <h2>{t('Language preview')}</h2>
      <p>{t.in('en', 'Hello there')}</p>
      <p>{t.in('sv', 'Hello there')}</p>

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
      <p>{t('Updated: {when, date, long}', { when: date })}</p>
      <p>{t('Updated: {when, date, short}', { when: date })}</p>
      <p>{t('At: {when, time, short}', { when: date })}</p>

      <h2>{t('Select')}</h2>
      <p>
        {t(
          '{role, select, admin {Administrator} editor {Editor} other {Viewer}}',
          { role: 'editor' },
        )}
      </p>

      <h2>{t('Lists')}</h2>
      <p>{format.list([t('apple'), t('pear'), t('banana')])}</p>

      <h2>{t('Relative time')}</h2>
      <p>{format.relativeTime(-2, 'day')}</p>
      <p>{format.relativeTime(3, 'hour')}</p>

      <h2>{t('Rich text')}</h2>
      <p>
        <RichText
          b={(children) => <strong>{children}</strong>}
          link={(children) => <a href="https://yapyak.dev">{children}</a>}
          value={t('Translate <b>everything</b> with <link>yapyak</link>')}
        />
      </p>
    </main>
  );
}
