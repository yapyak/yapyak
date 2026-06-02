---
title: Homonyms
order: 5
---

Using the source message as the key works because the words usually carry enough meaning on their own. Sometimes, however, the same words mean different things in different places.

Consider a ticket view with an action for opening a ticket and a badge showing that the ticket is currently open:

```tsx
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

When a source message needs a more specific meaning, use `t.at()`:

```tsx
import { t } from 'yapyak';
import { Status } from './status';

export function Ticket() {
  return (
    <>
      <button>{t.at('action', 'Open')}</button>
      <Status>{t.at('status', 'Open')}</Status>
    </>
  );
}
```

The first argument tells yapyak how the message is being used. It is not a translation key, and it does not replace the source string. It distinguishes two meanings that happen to be written the same way in the source language.

The translation file can now keep both messages separately:

```json
{
  "src/Ticket.tsx": {
    "Open@action": "Öppna",
    "Open@status": "Öppen"
  }
}
```

## Diagnostics

yapyak emits two diagnostics around `t.at()`:

- **YPK403** — a source is used with both `t()` and `t.at()` in the same file. Choose one form for every occurrence.
- **YPK404** — a single `t.at()` with no other context to disambiguate from. Drop the `.at()` since it has no effect.

Both keep the per-file translation scope intact. Two `t('Save')` calls in the same file are not flagged, because they may reasonably share one translation.
