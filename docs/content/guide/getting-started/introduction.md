---
title: Introduction
order: 1
---

yapyak is an i18n compiler for Vite applications. It rewrites `t()` calls at build time and keeps your locale files in sync with the source as you write. New messages are translated through the AI provider you configure, using your API key from your machine.

It works with React, Vue, Svelte, and Astro. SSR is supported on Astro, React Router, SvelteKit, and TanStack Start.

Four things make yapyak different from most i18n libraries.

The source string is the key. There are no abstract identifiers and no namespace files to invent. You write `t('Your cart is empty')` and that string is the key in every locale file.

Translations write themselves as you save. With an AI model wired up, new messages are translated and written to your locale files during the same save, then shown in the running browser through Vite HMR while the layout is still in front of you.

Your translations live in your repository. Locale files, translation memory, and glossary all sit alongside your code, read from disk and committed to git.

AI translation runs through your provider key directly. There is no yapyak service in the middle, no upgrade tier, and no usage someone else charges you for.

## Translations follow code

You write the source-language message directly in the code that uses it:

{% switch group="framework" %}

{% when value="react" %}
```tsx [src/components/empty-cart.tsx]
import { t } from 'yapyak';

export function EmptyCart() {
  return <p>{t('Your cart is empty')}</p>;
}
```
{% /when %}

{% when value="vue" %}
```vue [src/components/EmptyCart.vue]
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <p>{{ t('Your cart is empty') }}</p>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte [src/components/EmptyCart.svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<p>{t('Your cart is empty')}</p>
```
{% /when %}

{% when value="astro" %}
```astro [src/components/EmptyCart.astro]
---
import { t } from 'yapyak';
---

<p>{t('Your cart is empty')}</p>
```
{% /when %}

{% /switch %}

When you save, yapyak adds the message to your locale files as an empty stub. The English source is the key:

{% switch group="framework" %}

{% when value="react" %}
```json [locales/sv.json]
{
  "src/components/empty-cart.tsx": {
    "Your cart is empty": ""
  }
}
```
{% /when %}

{% when value="vue" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.vue": {
    "Your cart is empty": ""
  }
}
```
{% /when %}

{% when value="svelte" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.svelte": {
    "Your cart is empty": ""
  }
}
```
{% /when %}

{% when value="astro" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.astro": {
    "Your cart is empty": ""
  }
}
```
{% /when %}

{% /switch %}

If you rename or move the source file, yapyak finds the translations again under the new path. Deleting a component and bringing it back later restores the translations from before. Copying markup to a new file brings the translations along.

## Translations write themselves

The stub can be filled by you, by your coding agent, or by a *translator*.

A translator connects directly to an AI model using your provider key:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Concise and friendly',
    glossary: {
      cart: { sv: 'kundvagn' },
    },
  }),
});
```

yapyak ships bindings for Anthropic, OpenAI, Gemini, and Ollama out of the box. The provider can run on a hosted API or on your own machine. A custom translator is a short interface if you need one.

When you save, yapyak collects new messages, sends them to the provider with their source context, voice, glossary, and similar earlier translations, and writes the returned translations to your locale files:

{% switch group="framework" %}

{% when value="react" %}
```json [locales/sv.json]
{
  "src/components/empty-cart.tsx": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```
{% /when %}

{% when value="vue" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.vue": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```
{% /when %}

{% when value="svelte" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.svelte": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```
{% /when %}

{% when value="astro" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.astro": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```
{% /when %}

{% /switch %}

Vite HMR updates the running application with the translated text.

## Straight to the model

Translation requests go from your machine to your provider, using your API key. There is no yapyak service between your project and the model. The model can live anywhere your machine can reach, including the machine itself.

yapyak batches new messages into as few requests as possible and runs them in parallel. One request carries multiple messages and every configured locale, so related text gets translated together.

You pay your provider directly. yapyak does not take a cut and does not have a billing tier.

## Code is the context

Short interface text often needs context. `Open` may be a button, a menu item, or a heading.

Because yapyak is a compiler, it reads the code around each message. The model sees the source string together with the component name, the surrounding element, and nearby lines.

yapyak also sends similar earlier translations from your project as examples. If `Save` already translates to `Spara`, that travels along as a hint when translating `Save changes`. The example travels with the same request, so wording stays consistent without a separate service or model call.

Glossary terms can pin specific translations. Voice can set tone. yapyak forwards both with every request.

## Bundled with code

yapyak keeps translation lookup synchronous.

The compiler bundles translations into the modules that use them, so the runtime only picks the right value for the active locale.

```ts
t('Your cart is empty')
```

compiles to:

```ts
_pick({ en: 'Your cart is empty', sv: 'Din kundvagn är tom' })
```

Locale switching is immediate, with no translation file to fetch and no suspense or loading state to handle.

This matches Vite's build model. Routes load the modules they need, and those modules already contain the translations they render. Translation data follows the same code-splitting, caching, and deployment path as the code itself.

For static deploys, a build can target a single locale at compile time. The compiler rewrites every `t()` call to its target literal and tree-shakes the picker away. The resulting bundle contains no i18n runtime at all.

For SSR, translation data can stay on the server while the rendered result is sent to the client.

## Validated at compile time

A real interface has counts, prices, dates, and lists. yapyak handles these inside translatable messages using ICU MessageFormat:

```ts
t('You have {count, plural, one {# message} other {# messages}}', {
  count,
});
```

ICU is a standard format. AI models understand its structure, and translators preserve it across locales. yapyak validates it at compile time.

TypeScript reads the source literal and infers the parameters. Missing or misspelled params are compile-time errors. Invalid plural categories, broken select branches, and dynamic message strings all surface as YPK diagnostics in your editor and in CI.

For values outside a translatable message, like a price in a card or a timestamp in a footer, yapyak provides a `format` namespace covering numbers, dates, lists, and relative time. Everything is built on the platform's `Intl` and respects the active locale.

## Live in the build loop

With a translator configured, translation happens during the save loop.

New messages are extracted, sent to the model, and written to your locale files. The translated text shows up in the browser while you are still working on the component.

This changes when you notice translation problems. German words tend to be longer than English ones. Swedish dates are written differently. A message that fits comfortably in English might overflow a button in another language.

Take this component:

```html
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

```html
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

With live translations, you see this while the layout is still in front of you, not weeks later during QA.

## What changes

Translation becomes part of building the interface, not a separate step that happens later.

Messages follow the code that uses them, and AI fills the stubs on save. Locale files stay in your project, and translations compile alongside the modules that need them. The running app updates as you work.

yapyak is i18n that keeps up with the rest of your codebase.
