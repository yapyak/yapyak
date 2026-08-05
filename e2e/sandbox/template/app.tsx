import { useLocale } from '@yapyak/react';
import { useState } from 'react';
import { locales, t } from 'yapyak';

import { Cart } from './cart';

export function App() {
  const [locale, setLocale] = useLocale();
  const [draft, setDraft] = useState('');

  return (
    <main>
      <h1>{t('Hello')}</h1>
      <p>{t('Save')}</p>
      <Cart />
      <input
        onChange={(event) => setDraft(event.target.value)}
        value={draft}
      />
      <div>
        {locales.map((value) => (
          <button
            disabled={value === locale}
            key={value}
            onClick={() => setLocale(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
    </main>
  );
}
