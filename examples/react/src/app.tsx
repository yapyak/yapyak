import type { ReactElement } from 'react';
import { defineTranslations, useLocale } from 'yapyak/react';

const t = defineTranslations({
  title: 'Hello, world',
  intro: 'This is the yapyak React example.',
  count: 'You have {count, plural, one {# message} other {# messages}}',
});

export function App(): ReactElement {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>{t.title}</h1>
      <p>{t.intro}</p>
      <p>{t.count({ count: 3 })}</p>
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
