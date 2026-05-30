---
title: Introduction
order: 1
---

Most i18n tooling was designed around a handoff.

Originally, that meant extracting messages and sending them to translators or localization teams. Newer tools often send the same messages to an AI service in a pipeline. The tools got faster. The relationship stayed the same: write the interface, move its language elsewhere, and see the translated result later.

yapyak starts where the interface is written.

```tsx
import { t } from 'yapyak';

export function EmptyCart() {
  return <p>{t('Your cart is empty')}</p>;
}
```

The message remains in the component. Add a locale and save the file: yapyak extracts the change with its surrounding code and writes a locale file in your repo. Connect an AI model and the translation lands during the same save, with Vite updating the running application through HMR. Without a model, the entry is a normal file. Fill it in yourself, or let the coding agent already in the project complete it.

The translated interface can appear while the wording, layout, and interaction are still open decisions.

Translation is no longer waiting for the interface to be finished. It can shape the interface, not just describe it.

## Translate while the interface can still change

A translated interface often finds problems that the source language hides.

Consider a step in a password manager setup flow:

```tsx
export function RecoveryKeyStep() {
  return (
    <div>
      <h2>Save your recovery key</h2>
      <p>You will need this key if you forget your master password.</p>

      <div>
        <button>Download recovery key</button>
        <button>Finish setup</button>
      </div>
    </div>
  );
}
```

In English, the actions are unremarkable. They fit naturally beside each other in a compact step, a dialog footer, or a mobile setup screen.

Now consider the same interface in German:

```tsx
export function RecoveryKeyStep() {
  return (
    <div>
      <h2>Wiederherstellungsschlüssel speichern</h2>
      <p>Sie benötigen diesen Schlüssel, wenn Sie Ihr Master-Passwort vergessen.</p>

      <div>
        <button>Wiederherstellungsschlüssel herunterladen</button>
        <button>Einrichtung abschließen</button>
      </div>
    </div>
  );
}
```

Nothing about the German is unusual. `Wiederherstellungsschlüssel herunterladen` is the ordinary label for downloading a recovery key. It is also almost twice as long as `Download recovery key`.

The English version quietly suggests two buttons on one row. The German version makes that assumption impossible to ignore. The actions may need to stack. The step may need a wider layout. On a small screen, the whole interaction may need to be reconsidered.

This is not a translation defect. It is information about the interface, and it is most valuable while the interface is still being built.

With a model connected to the save loop, the German version can appear while this component is still open in the browser. You see the constraint when changing the layout is part of the work, not a follow-up task created by it.

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

A developer reading the component can read the interface directly. A coding agent modifying it can see the language it is changing. Move the component and its text moves with it. Revise the wording and the reason for the change is visible in the same diff.

Locale files follow the same movement. Rename the message at the same call site and yapyak migrates its translation. Delete the call and the entry leaves with it. A write that would silently clear an in-use translation is refused at build, not after the loss.

Move the call to a different file and the message is re-translated under the new file's context. The new file gets a fresh entry; the old file's entry leaves with the source. yapyak does not transplant translations between files: the translation belongs to where the call now lives.

Short strings make this more than a convenience:

```tsx
// src/files/OpenButton.tsx
<button>{t('Open')}</button>

// src/store/HoursBadge.tsx
<span>{t('Open')}</span>
```

Both occurrences say "Open" in English. One is an action. The other is a state. They may need different translations, and yapyak does not make them share one simply because their source text matches. Messages are scoped by file, preserving the local meaning that a global key or flat source catalog can lose.

## Use the context already present in the code

Interface text is difficult precisely because it is small.

A model that only sees `Remove` cannot tell whether it is removing a filter from a list, dismissing a notification, or deleting a project. The Swedish translation differs in each case: `Ta bort filter`, `Stäng`, `Radera projekt`. None of them is `Remove` translated correctly in the abstract.

yapyak passes the call site with every translation: the file name, the enclosing element, the surrounding code. A model that sees:

```tsx
<FilterChip onRemove={...}>
  <button>{t('Remove')}</button>
</FilterChip>
```

translates it differently than one that sees:

```tsx
<DangerDialog>
  <button>{t('Remove')}</button>
</DangerDialog>
```

The component is its own translation brief.

A model connected through yapyak uses that context while translating on save. A coding agent making a wider change uses the same context when completing or updating locale files. A person translating by hand follows the source back to the exact place where it appears.

What holds across the application, like preferred terms or voice rules, belongs in the translator, not in the call site. The component carries the message; the translator carries the policy.

```ts
import { anthropic } from '@yapyak/anthropic';

export default {
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    glossary: {
      Cart: { sv: 'Kundvagn', de: 'Warenkorb' },
      Order: { sv: 'Beställning', de: 'Bestellung' },
    },
    voice: 'concise, never overly formal',
  }),
};
```

The glossary travels with every translation request. Whenever `Cart` appears in a source string, in any file, the model is told to use `Kundvagn` in Swedish. The component supplies the context; the glossary enforces what must hold across components.

## Write real messages, check the syntax

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

ICU is the standard for the language real products need. It works for locales whose grammar cannot be squeezed into an English-shaped singular/plural switch, and it avoids inventing a private format where a standard already exists.

It is also a practical choice where AI helps write the code. Models already understand ICU well; developers can review it; the compiler can validate it. yapyak's translator prompt also tells the model directly: `Preserve all {placeholder} tokens and ICU patterns exactly as written.` The constraint travels with every request.

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

The output follows Vite's module graph. If a route becomes its own chunk, the messages used by that route travel with it. A user does not need translation data for screens they never open, and changing locale does not wait for a catalog request. Adding a twentieth language changes how many variants travel alongside a chunk, not which screens it carries. The trade is real: bundles scale with locale count, not with app size. In return, locale switching is synchronous, with no flash and no request.

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

When locales are configured, yapyak writes one JSON file per locale, scoped by source file:

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

A `t()` call in a Vue template is not the same thing as a `t()` call in a TSX file. Vue runs through its own compiler. So does Svelte. So does Astro. Treating them as one searchable text format is what makes i18n libraries feel grafted onto anything except React.

The same `t()` API runs in each framework's native syntax:

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

Vue files through Vue's compiler, Svelte through Svelte's, Astro through Astro's, TypeScript and TSX through the TypeScript toolchain. The model is the same; the parser is each framework's own.

That matters once a message is more than a label. ICU belongs directly inside native framework syntax, including Vue templates:

```vue
<template>
  <p>{{ t('{count, plural, one {# item} other {# items}}', { count }) }}</p>
</template>
```

SSR integrations extend the model to Astro, React Router, SvelteKit, and TanStack Start.

## The loop is the feature

Translation has usually arrived after the interface: first through a localization process, later through services and pipelines that shortened the delay without changing the relationship.

yapyak starts where the interface is still being made:

```tsx
t('Your cart is empty')
```

Write the message where it appears. Save the component. See another language in the running application while the wording, layout, and interaction are still yours to change.

Translation used to be a phase. Then it became a pipeline step.

With yapyak, it is part of writing the interface.
