import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureLocale } from 'yapyak';
import { IntlProvider } from 'yapyak/react';
import { App } from './app.js';

configureLocale({
  defaultLocale: 'en',
  locales: ['en', 'sv'],
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <IntlProvider>
      <App />
    </IntlProvider>
  </StrictMode>,
);
