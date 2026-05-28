import type { Route } from './+types/home';

import { useLocale } from '@yapyak/react';
import { Form } from 'react-router';
import { locales, setLocale, t } from 'yapyak';

const date = new Date('2024-01-01T08:30:00Z');

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  setLocale(String(formData.get('locale')));
  return null;
}

export default function Home() {
  const [locale, setLocale] = useLocale();
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

      <h2>{t('Switch language')}</h2>

      <p>{t('From the client')}</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
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

      <p>{t('From the server')}</p>
      <Form
        method="post"
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        {locales.map((value) => (
          <button
            disabled={value === locale}
            key={value}
            name="locale"
            type="submit"
            value={value}
          >
            {value === 'sv' ? t('Swedish') : t('English')}
          </button>
        ))}
      </Form>
    </main>
  );
}
