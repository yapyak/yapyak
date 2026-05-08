import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'yapyak';
import { App } from './app.js';

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
