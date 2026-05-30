---
title: Introduction
order: 1
---

Most i18n tooling was designed around a handoff.

Originally, that meant extracting messages and sending them to translators or localization teams. Newer tools often send the same messages to an AI service somewhere in a pipeline. The tools got faster. The relationship stayed the same: write the interface, move its language elsewhere, and see the translated result later.

yapyak starts where the interface is written.

```tsx
import { t } from 'yapyak';

export function EmptyCart() {
  return <p>{t('Your cart is empty')}</p>;
}
```

The message remains in the component. Add a locale and save the file. yapyak extracts the changed message in the context of the code that uses it, and maintains locale files in your repository.

Connect an AI model and it can write the translation during that same save, with Vite reflecting the result in the running application through HMR. Leave it unconfigured and the locale entry is still ordinary project output: you can fill it in yourself, or let the coding agent already working in the repository complete it.

The translated interface can appear while the wording, layout, and interaction are still open decisions.

That changes the shape of an i18n system. The source text needs to remain legible in the code. Translation needs the context the component already contains. Messages need syntax and validation that hold up in production. Output should follow Vite's module graph rather than sit behind a global runtime catalog.

Translation is no longer waiting for the interface to be finished. It can take part in making it better.

## Translate while the interface can still change

A translated interface often finds problems that the source language hides.

A button may fit in English and wrap in German. An empty state may sound vague in Swedish. A label may appear clear only because English allows an ambiguity another language does not.

```tsx
export function DeleteDialog() {
  return (
    <Dialog>
      <h2>{t('Delete this project?')}</h2>
      <p>{t('This action cannot be undone.')}</p>
      <button>{t('Delete project')}</button>
    </Dialog>
  );
}
```

With a model connected to the save loop, an edit to this component can update its configured translations while the dialog remains open in the browser. You review language in the same place you review spacing, hierarchy, and interaction: in the interface itself.

That is useful because product language moves with product work. Screens are added. Flows become shorter. Terms become clearer. Copy changes as the feature becomes better understood. Translation should be close enough to that work to inform it, not merely describe it afterwards.

Some work should still be explicit. Adding a new locale to a mature application, translating a large existing surface, or reviewing terminology across a product deserves an inspectable change set. The save loop is for the everyday decisions where immediate feedback matters.

## Keep meaning at the call site

A key-based translation call points away from the interface:

```tsx
t('settings.profile.actions.save')
```

The key may be organized, but it does not tell you what the interface says. Humans have to look it up. Agents do too. Changing the copy means coordinating the component, a source catalog, translated catalogs, and the naming system that holds them together.

With yapyak, the component contains the message it renders:

```tsx
t('Save changes')
```

A developer reading the component can read the interface directly. A coding tool modifying it can see the language it is changing. Move the component and its text moves with it. Revise the wording and the reason for the change is visible in the same diff.

Locale files follow the same movement. Rename the message at the same call site and yapyak migrates its translation. Delete the call and the entry leaves with it. A write that would silently clear an in-use translation is refused at build, not after the loss.

Short strings make this more than a convenience:

```tsx
// src/files/OpenButton.tsx
<button>{t('Open')}</button>

// src/store/HoursBadge.tsx
<span>{t('Open')}</span>
```

Both occurrences say "Open" in English. One is an action. The other is a state. They may need different translations, and yapyak does not make them share one simply because their source text happens to match. Messages are scoped by file, preserving the local meaning that a global key or flat source catalog can lose.

## Use the context already present in the code

Interface text is difficult precisely because it is small.

"Continue" in a checkout flow is not necessarily "Continue" during onboarding. "Remove" on a filter chip does not carry the same meaning as "Remove" in a destructive confirmation dialog. A product term may need one preferred translation even when several alternatives would be reasonable in isolation.

Modern AI models translate well when they are given that kind of context. The application already has much of it: the message, the element that renders it, the component it belongs to, nearby copy, and the file that gives it scope. yapyak makes that information available instead of reducing translation to a list of detached phrases.

A model connected through yapyak can use that context while translating on save. A coding agent making a wider change can use the same context when completing or updating locale files. A person translating by hand can still follow the source back to the exact place where it appears.

What must hold across the application, like preferred terms or voice rules, belongs in the translator, not in the call site. The component carries the message; the translator carries the policy.

The path differs. The source of meaning does not.

## Write real messages, catch real mistakes

Simple messages should remain simple:

```tsx
t('You have {count} items', { count: 3 })
```

Because the placeholder appears in the source literal, TypeScript checks the parameters you pass against it:

```tsx
t('You have {count} items', { total: 3 })
//                             ^^^^^
// Missing required parameter: count
```

Wrong names or types are reported in the editor where the message is written. Missing parameters altogether are caught at build time by the compiler (`YPK002`), which runs on save through the Vite plugin.

For messages that need pluralization, selection, numbers, currencies, dates, times, or ordinals, yapyak supports ICU MessageFormat:

```tsx
t('{count, plural, one {# item} other {# items}}', { count })
```

ICU is established syntax for the language real products need to express. It works for locales whose grammar cannot be squeezed into an English-shaped singular/plural switch, and it avoids introducing a private message format where a standard already exists.

It is also a practical choice in a codebase increasingly worked on with AI. Models already understand ICU well; developers can review it; the compiler can validate it.

Messages can carry inline markup. `t('Read <link>our docs</link>')` extracts the tag names from the source literal at build time, and a framework helper renders them with one handler per tag — a missing handler is a type error. React's helper, `<RichText>`, ships today; the same source-string shape extends to Vue, Svelte, and Astro.

TypeScript checks what can be inferred from the literal as you write it. The compiler validates the complete message syntax during development and build, before malformed output can reach the application.

## Compile translations with the UI that uses them

yapyak keeps locale files in your repository, but it does not require one global translation dictionary at runtime.

A source message such as:

```tsx
t('Save changes')
```

can compile into synchronous locale selection in the module that renders it:

```ts
_pick({
  en: 'Save changes',
  sv: 'Spara ändringar',
  es: 'Guardar cambios',
});
```

The output follows Vite's module graph. If a route becomes its own chunk, the messages used by that route travel with it. A user does not need translation data for screens they never open, and changing locale does not wait for a catalog request. Adding a twentieth language changes how many variants travel alongside a chunk, not which screens it carries.

When a translation is missing for the active locale, the source text renders in its place. There is no flash of empty content and no catalog request to wait for.

When no additional locales are configured, there is nothing to select:

```tsx
export function SaveButton() {
  return <button>Save changes</button>;
}
```

The `t()` expression compiles to the source text. A project can begin writing messages through yapyak before it needs a second locale, without designing a key hierarchy or maintaining an English catalog in advance.

Tests bind to a single locale without touching global state. `t.in('sv')` returns a translator scoped to one language, so a component test can assert against the language it expects.

## Keep locale files in the repository

When locales are configured, yapyak maintains file-scoped translation output alongside the application:

```json
{
  "src/files/OpenButton.tsx": {
    "Open": "Öppna"
  },
  "src/store/HoursBadge.tsx": {
    "Open": "Öppet"
  }
}
```

This is why two identical source strings can remain distinct when their meaning differs. Keys are written in a stable order, so two branches editing different components produce no overlap; two branches editing the same component produce one small JSON object to merge.

The values may be written on save by a configured AI model. They may be completed by a coding agent already changing the feature. They may be written or corrected by a person. In every case, they are normal repository files: visible in a pull request, editable without a dashboard, and versioned with the code that caused them to exist. `yapyak status` reports coverage per locale; `yapyak check` exits non-zero when a locale is incomplete, so completeness can be a merge requirement instead of an afterthought.

You choose the model, when a model is involved. You use your own provider and your own key. yapyak does not need to own the translation service, the billing relationship, or a separate copy of your product language.

## Native to the framework where the message appears

Interface text is not written in one universal syntax. yapyak keeps the API consistent while understanding each supported source on its own terms.

```tsx
// React
<button>{t('Save changes')}</button>
```

```vue
<!-- Vue -->
<template>
  <button>{{ t('Save changes') }}</button>
</template>
```

```svelte
<!-- Svelte -->
<button>{t('Save changes')}</button>
```

```astro
---
// Astro
import { t } from 'yapyak';
---

<button>{t('Save changes')}</button>
```

Vue files are handled through Vue's compiler, Svelte files through Svelte's compiler, Astro files through Astro's compiler, and TypeScript and TSX through the TypeScript toolchain.

That matters once messages become more than labels. ICU belongs directly inside native framework syntax, including Vue templates:

```vue
<template>
  <p>{{ t('{count, plural, one {# item} other {# items}}', { count }) }}</p>
</template>
```

The message is extracted and validated with an understanding of the template around it. Framework support is not a set of wrappers around one preferred environment; it is the same source-string model applied where each framework actually expresses its interface.

SSR integrations extend that model to applications built with Astro, React Router, SvelteKit, and TanStack Start.

## The loop is the feature

Translation has usually arrived after the interface: first through a localization process, later through services and pipelines that shortened the delay without changing the relationship.

yapyak starts where the interface is still being made:

```tsx
t('Your cart is empty')
```

Write the message where it appears. Save the component. See another language in the running application while the wording, layout, and interaction are still yours to change.

Translation used to be a phase. Then it became a pipeline step.

With yapyak, it is part of writing the interface.
