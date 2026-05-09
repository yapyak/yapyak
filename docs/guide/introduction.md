---
order: 1
---

# Introduction

Yapyak is an i18n library for Vite apps. Five properties define it:

1. **The translation is the key.** You write `t('Save changes')`. The English text *is* the lookup. No abstract IDs.
2. **Per-message tree-shaking.** Each `t()` call rewrites to a direct function reference. Routes only ship the messages they actually use — same bundle story as Paraglide, without the explicit-ID tax.
3. **Context-aware AI.** When the LLM translates, it gets the file path, component name, and surrounding code. Same English, different context, different translation.
4. **Translations follow your code.** Rename a string in a file, move a `t()` call to another file, rename the file itself — the translation migrates automatically.
5. **Component-discriminated, free.** `t('Save')` on a form vs `t('Save')` on a contract action get independent translations. You don't think about it.

The rest follows from these.

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

## Why per-message tree-shaking matters

Most i18n libraries ship every translation for every locale to every page. With 100 routes and 1000 messages, that's a lot of dead bytes in your bundle.

Yapyak transforms each `t('Foo')` call to a direct reference to a tree-shakable function. Vite drops everything else. Route `/checkout` lands on the user with the 20 messages it actually uses, not all 1000.

Paraglide pioneered this; we copied it — but we kept source-string-as-key on top. You don't trade ergonomics for bundle size.

## Why context-aware AI

Generic translation: "translate 'Cancel' to Swedish". Output: *Annullera* (formal/legal) or *Avbryt* (UI button)? Coin flip.

Yapyak's transform knows the call site at extraction time: the file, the component, the surrounding code. It bundles all of that into the LLM prompt. The model sees a `<Button>` in a `PaymentDialog` and returns *Avbryt*. Same string elsewhere returns *Annullera*. Quality leap, fully automatic.

## Vite-only

Yapyak only exists because Vite exists. The "save a file, the right thing happens, immediately" experience that makes auto-translate-on-save feel like magic — that's Vite's contribution to the field, and Evan You and the team did the hard work. We're just standing on it.

If you're on Webpack or Rollup-without-Vite, yapyak is not your tool. We'd rather be excellent in one place than mediocre everywhere.

## Next steps

- [Installation](./installation) — add yapyak to your Vite app
- More guides coming as we polish them. The [README](https://github.com/yapyak/yapyak) is the most complete reference for now.
