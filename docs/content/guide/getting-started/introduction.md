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

Requests go directly from your machine to the model. There is no yapyak service in between, and the model can run anywhere your machine can reach, including the machine itself.

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
    snippet: "<button onClick={save}>{t('Save changes')}</button>"
  }
}
```

The element alone tells the model this is a button, so it reaches for a concise imperative instead of a description.

You choose how much of it reaches the model, down to nothing at all.

## ICU at the call site

yapyak uses ICU MessageFormat for the moving parts of a message: counts, plurals, dates. You write it inline, as the source string:

```tsx
<p>{t('You have {count, plural, one {# message} other {# messages}}', { count })}</p>
```

The message is the string in the call, not a key pointing into a separate file. TypeScript derives the parameter types from that string itself, so a missing or wrong parameter is an error as you type, with no codegen and no declaration file to keep in step.

## Correctness all the way down

yapyak checks correctness at three stages: while you type, when you save, and while the app runs.

The call-site check that runs as you type is the first:

{% diagnostics %}
t('You have {count} messages', { count: 3 });          // ok
t('You have {count} messages', {});                    // error: missing 'count'
t('{count, plural, oen {#} other {#}}', { count: 3 }); // error: unknown plural keyword "oen"
{% /diagnostics %}

yapyak runs the second on save, validating every locale and failing the build on a broken one. The third runs at runtime: in development, it warns about problems that only surface in the browser.

Each has a number, like `YAP0042`, and a page that explains it. 46 in all, from the editor to the runtime. The same check runs in CI, through the `yapyak` CLI.

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

It builds on the platform's `Intl`, and adds the type safety `Intl` lacks. Ask for a currency and TypeScript requires a code, with the standard ones autocompleting. If `Intl` can't render a currency or time zone, `format` returns a readable fallback instead of throwing.

## Bundled with code

yapyak keeps translation lookup synchronous. The compiler bundles translations into the modules that use them, so the runtime only picks the right value for the active locale.

Locale switching is immediate, with no locale file to fetch and no suspense or loading state to handle.

This matches Vite's build model. Routes load the modules they need, and those modules already contain the translations they render. Translation data follows the same code-splitting, caching, and deployment path as the code itself.

For static deploys, a build can target a single locale at compile time. The compiler rewrites every `t()` call to its target literal and tree-shakes the picker away. The resulting bundle contains no i18n runtime at all.

## What changes

Put together, these become a different way to handle i18n. Three things follow.

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

Models are already good at interface copy. What separates good from reliable is the context a translator would ask for: where the message appears, the code around it, your glossary and voice, and the translations already in the project. yapyak gives the model that, and it does what a good translator would: pick the right words, and reuse the ones you already chose. Take a button:

```tsx [src/components/delete-account.tsx]
<button onClick={deleteAccount}>{t('Delete account')}</button>
```

`Delete` has two good Swedish forms, `Ta bort` and `Radera`. Because the project already settled on `Ta bort`, this comes back as `Ta bort konto`, not `Radera konto`. Terminology holds as the locale file fills in.

### An agent can own it

An agent writes `<button>{t('Save changes')}</button>` because that is the natural way to say what the button says, and it writes ICU when it needs to, because that is how models already write. The source string is the only artifact anyone produces. Everything else is yapyak's: extract, validate, translate, restore on refactor, compile into the bundle. The result lands where an agent already knows to look: in your repo, in a file, committed to git.

---

With yapyak, i18n stops being a project beside your code and becomes part of writing it, by whoever or whatever writes it.
