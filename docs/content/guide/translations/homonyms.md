---
title: Homonyms
order: 5
---

Using the source message as the key works because the words usually carry enough meaning on their own. Sometimes, however, the same words mean different things in different places.

Consider a ticket view with an action for opening a ticket and a badge showing that the ticket is currently open:

{% switch group="framework" %}

{% when value="react" %}
```tsx [Ticket.tsx]
import { t } from 'yapyak';
import { Status } from './status';

export function Ticket() {
  return (
    <>
      <button>{t('Open')}</button>
      <Status>{t('Open')}</Status>
    </>
  );
}
```
{% /when %}

{% when value="vue" %}
```vue [Ticket.vue]
<script setup lang="ts">
import Status from './Status.vue';
import { t } from 'yapyak';
</script>

<template>
  <button>{{ t('Open') }}</button>
  <Status>{{ t('Open') }}</Status>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte [Ticket.svelte]
<script lang="ts">
  import Status from './Status.svelte';
  import { t } from 'yapyak';
</script>

<button>{t('Open')}</button>
<Status>{t('Open')}</Status>
```
{% /when %}

{% when value="astro" %}
```astro [Ticket.astro]
---
import Status from './Status.astro';
import { t } from 'yapyak';
---

<button>{t('Open')}</button>
<Status>{t('Open')}</Status>
```
{% /when %}

{% /switch %}

In English, both messages are *Open*. They look identical in the source code, but they do not mean the same thing.

In Swedish, the button is an action:

```translation
Öppna
```

The status is a state:

```translation
Öppen
```

A single translation for *Open* cannot be correct in both places.

When a source message needs a more specific meaning, use `t.as()`:

{% switch group="framework" %}

{% when value="react" %}
```tsx [Ticket.tsx]
import { t } from 'yapyak';
import { Status } from './status';

export function Ticket() {
  return (
    <>
      <button>{t.as('action', 'Open')}</button>
      <Status>{t.as('status', 'Open')}</Status>
    </>
  );
}
```
{% /when %}

{% when value="vue" %}
```vue [Ticket.vue]
<script setup lang="ts">
import Status from './Status.vue';
import { t } from 'yapyak';
</script>

<template>
  <button>{{ t.as('action', 'Open') }}</button>
  <Status>{{ t.as('status', 'Open') }}</Status>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte [Ticket.svelte]
<script lang="ts">
  import Status from './Status.svelte';
  import { t } from 'yapyak';
</script>

<button>{t.as('action', 'Open')}</button>
<Status>{t.as('status', 'Open')}</Status>
```
{% /when %}

{% when value="astro" %}
```astro [Ticket.astro]
---
import Status from './Status.astro';
import { t } from 'yapyak';
---

<button>{t.as('action', 'Open')}</button>
<Status>{t.as('status', 'Open')}</Status>
```
{% /when %}

{% /switch %}

The first argument tells yapyak how the message is being used. It is not a translation key, and it does not replace the source string. It distinguishes two meanings that happen to be written the same way in the source language.

The translation file can now keep both messages separately:

{% switch group="framework" %}

{% when value="react" %}
```json
{
  "src/Ticket.tsx": {
    "Open@action": "Öppna",
    "Open@status": "Öppen"
  }
}
```
{% /when %}

{% when value="vue" %}
```json
{
  "src/Ticket.vue": {
    "Open@action": "Öppna",
    "Open@status": "Öppen"
  }
}
```
{% /when %}

{% when value="svelte" %}
```json
{
  "src/Ticket.svelte": {
    "Open@action": "Öppna",
    "Open@status": "Öppen"
  }
}
```
{% /when %}

{% when value="astro" %}
```json
{
  "src/Ticket.astro": {
    "Open@action": "Öppna",
    "Open@status": "Öppen"
  }
}
```
{% /when %}

{% /switch %}

## Diagnostics

yapyak emits two diagnostics around `t.as()`:

- **YPK403** — a source is used with both `t()` and `t.as()` in the same file. Choose one form for every occurrence.
- **YPK404** — a single `t.as()` with no other context to disambiguate from. Drop the `.as()` since it has no effect.

Both keep the per-file translation scope intact. Two `t('Save')` calls in the same file are not flagged, because they may reasonably share one translation.
