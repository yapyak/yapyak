---
order: 1
---

# Introduction

Yapyak is an i18n library for Vite apps. Three properties define it:

1. **The translation is the key.** You write `t('Save changes')`. The English text *is* the lookup. No abstract IDs.
2. **AI is built in.** Save a file with new strings, the AI translates them, your UI updates.
3. **Translations follow your code.** Rename a string and the existing translation moves with it.

The rest follows from these three.

## How it feels

```tsx
import { t, useLocale } from 'yapyak';

export function App() {
  const [locale, setLocale] = useLocale();
  return (
    <>
      <h1>{t('Hello')}</h1>
      <button onClick={() => setLocale('sv')}>SV</button>
    </>
  );
}
```

That's the entire surface area for 95% of apps. No providers per component, no namespaces, no key registration.

## Why source-string-as-key

Translation keys are a special kind of hell. `home.hero.cta.signup.button` — does it sign up or log in? Who knows. You named it, then someone changed the copy, and now the key lies. Or you skip naming and call it `key1`. Or you commit to a naming convention that nobody else on your team agrees with.

Yapyak takes a different swing: the translation is the key. There's nothing to name, because the source language already names it. Think of what Tailwind did to CSS class names — same energy, less friction.

If two files happen to use the same source text but want different translations, that's fine — translations are scoped per file. `t('Save')` in your settings page can be `'Spara'`, while `t('Save')` in your editor can be `'Spara ändringar'`. Same key, different files, no collisions, no bikeshedding.

## Vite-only

Yapyak only exists because Vite exists. The "save a file, the right thing happens, immediately" experience that makes auto-translate-on-save feel like magic — that's Vite's contribution to the field, and Evan You and the team did the hard work. We're just standing on it.

If you're on Webpack or Rollup-without-Vite, yapyak is not your tool. We'd rather be excellent in one place than mediocre everywhere.

## Next steps

- [Installation](./installation) — add yapyak to your Vite app
- More guides coming as we polish them. The [README](https://github.com/yapyak/yapyak) is the most complete reference for now.
