---
title: Installation
description: Get yapyak running in your Vite app in under a minute.
order: 1
---

# Installation

Install the package:

```bash
pnpm add yapyak
```

Add the Vite plugin to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [yapyak()],
});
```

Write your first translation:

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

Save the file. yapyak extracts the string and writes a stub to `locales/sv.json`. Open it, translate it, and the new value appears in your dev server via HMR.
