---
title: Introduction
order: 1
---

yapyak is an i18n compiler with a small runtime, built for the way code gets written today: rapidly, often with help from a coding agent, and rarely pausing for a separate translation step.

It's a Vite plugin. Works with React, Vue, Svelte, and Astro. SSR is supported on Astro, React Router, SvelteKit, and TanStack Start.

The runtime has no dependencies, built on the platform's `Intl` API. About 6 KB gzipped for typical use, zero for fixed-locale builds.

## Translations follow code

You write the source string directly in the code that uses it:

```tsx [src/components/empty-cart.tsx]
import { t } from 'yapyak';

export function EmptyCart() {
  return <p>{t('Your cart is empty')}</p>;
}
```

When you save, yapyak adds the message to your locale files as an *empty stub*. The source string is the key:

```json [locales/sv.json]
{
  "src/components/empty-cart.tsx": {
    "Your cart is empty": ""
  }
}
```

If you rename or move the source file, yapyak finds the translations again under the new path. Deleting a component and bringing it back later restores the translations from before. Copying markup to a new file brings the translations along. The compiler refuses to write a locale file in a state that would silently clear a translation still in use.

## Translations write themselves

The stub can be filled by you, by your coding agent, or by a *translator*.

A translator connects directly to a model using your API key:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Concise and friendly',
    glossary: {
      cart: { sv: 'kundvagn' }
    }
  })
});
```

yapyak ships translators for Anthropic, OpenAI, Gemini, and Ollama. A custom translator is a short interface if you need one.

Requests go directly from your machine to the model. There is no yapyak service in between, and the model can live anywhere your machine can reach, including the machine itself.

When you save, yapyak collects new messages and batches them into as few requests as possible. One request carries multiple messages and every locale, so related text gets translated together. The returned translations are written to your locale files:

```json [locales/sv.json]
{
  "src/components/empty-cart.tsx": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```

Vite HMR updates the running app with the translated text.

## Code is the context

Because yapyak is a compiler, it reads the code around each message and sends it to the model with the request.

Take a button:

```tsx [src/components/save-button.tsx]
<button onClick={save}>{t('Save changes')}</button>
```

With the request, yapyak sends the enclosing component, the element, and the surrounding code:

```ts
{
  source: 'Save changes',
  context: {
    enclosingComponent: 'SaveButton',
    enclosingElement: 'button',
    snippet: "<button onClick={save}>{t('Save changes')}</button>",
  },
}
```

The element alone tells the model this is a button, so it reaches for a concise imperative instead of a description.

All of this makes for sharper translations, and how much of it travels with each request is yours to set: the surrounding code, the component and element alone, or nothing at all.

## ICU at the call site

yapyak uses ICU MessageFormat for the moving parts of a message: counts, plurals, dates. You write it inline, as the source string:

```tsx
<p>{t('You have {count, plural, one {# message} other {# messages}}', { count })}</p>
```

The ICU stays in the code that renders it, with no key and no catalog file. TypeScript reads it there and types the parameters from it, with no codegen and no declaration file.

## Correctness all the way down

yapyak checks correctness at three stages: while you type, when you save, and while the app runs.

The first is while you type. Every parameter is checked at the call site, before you save:

{% diagnostics %}
t('You have {count} messages', { count: 3 });          // ok
t('You have {count} messages', {});                    // error: missing 'count'
t('{count, plural, oen {#} other {#}}', { count: 3 }); // error: unknown plural keyword "oen"
{% /diagnostics %}

The second is when you save. yapyak validates every locale and stops the build before a broken translation ships.

The third is while the app runs. In development, yapyak warns about problems that only surface in the browser.

Each has a number, like `YAP0042`, and a page that explains it. 44 in all, from the editor to the runtime. The same check runs in CI, through the `yapyak` CLI.

## Formatting outside messages

yapyak also formats the values outside a message: numbers, dates, relative time, and lists. Each follows the active locale:

```ts
import { format } from 'yapyak';

format.number(1234.5, { style: 'currency', currency: 'EUR' });
// output:
// en: '€1,234.50'
// de: '1.234,50 €'
// fr: '1 234,50 €'
```

It builds on the platform's `Intl`, and adds the type safety `Intl` lacks. Ask for a currency and TypeScript requires the code, and the ISO 4217 codes autocomplete. If `Intl` can't render a currency or time zone, `format` returns a readable fallback instead of throwing.

## Bundled with code

yapyak keeps translation lookup synchronous. The compiler bundles translations into the modules that use them, so the runtime only picks the right value for the active locale.

Locale switching is immediate, with no locale file to fetch and no suspense or loading state to handle.

This matches Vite's build model. Routes load the modules they need, and those modules already contain the translations they render. Translation data follows the same code-splitting, caching, and deployment path as the code itself.

For static deploys, a build can target a single locale at compile time. The compiler rewrites every `t()` call to its target literal and tree-shakes the picker away. The resulting bundle contains no i18n runtime at all.

## What changes

Put together, these become a different way to handle i18n, one shaped for how software gets built now. Three things follow.

### You watch it happen

With a translator configured, translation happens during the *save loop*. A new message is extracted, sent to the model, and written to your locale files. The translated text shows up in the browser while you are still working on the component, so layout problems surface while you build, not after release. Take this component:

```tsx
<div>
  <h2>Save your recovery key</h2>
  <p>You will need this key if you forget your master password.</p>

  <div>
    <button>Download recovery key</button>
    <button>Finish setup</button>
  </div>
</div>
```

In English the buttons fit in a dialog or on a mobile screen. In German:

```tsx
<div>
  <h2>Speichern Sie Ihren Wiederherstellungsschlüssel</h2>
  <p>Sie benötigen diesen Schlüssel, wenn Sie Ihr Master-Passwort vergessen.</p>

  <div>
    <button>Wiederherstellungsschlüssel herunterladen</button>
    <button>Einrichtung abschließen</button>
  </div>
</div>
```

The first button is much longer, enough to break a dialog footer or a mobile layout. With live translation, you see it while the layout is still in front of you.

### AI translation becomes reliable

Models already handle interface copy well. What they often lack is the context around each message. yapyak supplies it: where the message appears, the code around it, your glossary and voice, and examples from translations already in the project. That gives the model enough to choose the right words, keep them consistent, and produce translations you can use directly in the save loop.

```tsx [src/components/delete-account.tsx]
<button onClick={deleteAccount}>{t('Delete account')}</button>
```

`Delete` has two good Swedish forms, `Ta bort` and `Radera`. Because the project already translated `Delete` as `Ta bort`, this comes back as `Ta bort konto`, not `Radera konto`. The terminology stays consistent as the locale file fills in.

### An agent can own it

An agent writes `<button>{t('Save changes')}</button>` because that is the natural way to say what the button says, and it writes ICU when it needs to, because that is how models already write. The source string is the only artifact anyone produces. Everything else is yapyak's: extract, validate, translate, restore on refactor, compile into the bundle. The result lands where an agent already knows to look: in your repo, in a file, committed to git.

---

i18n stops being a project beside your code and becomes part of writing it, by whoever or whatever writes it.

yapyak is i18n that keeps up. With your code, with your UI, with your agents, and with the pace they set.
