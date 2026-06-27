---
title: Introduction
order: 1
---

yapyak is an i18n compiler with a small runtime, built for the way code gets written today: rapidly, often with help from a coding agent, and rarely pausing for a separate translation step.

It's a Vite plugin. Works with React, Vue, Svelte, and Astro. SSR is supported on Astro, React Router, SvelteKit, and TanStack Start.

## Translations follow code

You write the source string directly in the code that uses it:

```tsx [src/components/empty-cart.tsx]
import { t } from 'yapyak';

export function EmptyCart() {
  return <p>{t('Your cart is empty')}</p>;
}
```

When you save, yapyak adds the message to your locale files as an empty stub. The source string is the key:

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

A translator connects directly to a model using your provider key:

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

Vite HMR updates the running application with the translated text.

## Code is the context

Because yapyak is a compiler, it can read the code around each message and send that context along to the model. Especially useful for short messages, where a single word can mean different things in different places. Consider this:

```tsx [src/components/file-menu.tsx]
<button onClick={openFile}>{t('Open')}</button>
```

The request to the translator carries this context:

```ts
{
  enclosingComponent: 'FileMenu',
  enclosingElement: 'button',
  snippet: "<button onClick={openFile}>{t('Open')}</button>",
}
```

All of this happens automatically. You decide how much context the model sees, including none at all.

## Bundled with code

yapyak keeps translation lookup synchronous. The compiler bundles translations into the modules that use them, so the runtime only picks the right value for the active locale.

Locale switching is immediate, with no locale file to fetch and no suspense or loading state to handle.

This matches Vite's build model. Routes load the modules they need, and those modules already contain the translations they render. Translation data follows the same code-splitting, caching, and deployment path as the code itself.

For static deploys, a build can target a single locale at compile time. The compiler rewrites every `t()` call to its target literal and tree-shakes the picker away. The resulting bundle contains no i18n runtime at all.

## ICU validated end-to-end

A real interface has counts, prices, dates, and lists. yapyak handles these inside translatable messages using ICU MessageFormat:

```tsx
t('You have {count, plural, one {# message} other {# messages}}', { count });
```

TypeScript reads the source string and types every parameter instantly. Write `'You have {count} messages'` and `{ count: number }` is required at the call site:

{% diagnostics %}
t('You have {count} messages', { count: 3 }); // ok
t('You have {count} messages', {});           // error: missing 'count'
t('You have {count} messages', { n: 3 });     // error: 'n' is not assignable
{% /diagnostics %}

The compiler then validates the ICU itself across every locale at save time. Malformed syntax, missing `other` branches in plurals and selects, parameters that drift between source and translation, dynamic message strings, and unbalanced rich-text tags inside a message all surface as YAP diagnostics. 44 codes in total, spanning source parsing, ICU validation, rich-text structure, locale persistence, and runtime safety.

ICU is a format models write fluently. yapyak makes sure they get the details right.

For values outside a translatable message, like a price in a card or a timestamp in a footer, yapyak provides a `format` namespace covering numbers, dates, lists, and relative time. Everything is built on the platform's `Intl` and respects the active locale.

## Live in the build loop

With a translator configured, translation happens during the save loop.

New messages are extracted, sent to the model, and written to your locale files. The translated text shows up in the browser while you are still working on the component.

This changes when you notice translation problems. German words tend to be longer than English ones. Swedish dates are written differently. A message that fits comfortably in English might overflow a button in another language.

Take this component:

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

In English, the buttons fit comfortably in a dialog or on a mobile screen. In German:

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

The first button is much longer. That can break a dialog footer or a mobile layout.

With live translations, you see this while the layout is still in front of you.

## Built for agents

The cumulative effect of these choices: an agent writing your application doesn't have to think about i18n. And barely you either.

It writes `<button>{t('Save changes')}</button>` because that's the natural way to express what the button says. The compiler extracts it, validates it, sends it to the translator, writes the result back, restores it on refactor, and compiles it into the bundle.

The agent doesn't learn a key naming system. Doesn't edit JSON. Doesn't integrate with a translation vendor. The English string at the call site is the only artifact anyone has to produce. Everything else is mechanical.

yapyak does the heavy lifting, then leaves the result where an agent already knows to look: in your repo, in a file, committed to git.

yapyak is i18n that keeps up. With your code, with your agents, with the pace they set.
