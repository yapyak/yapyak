---
title: Override
order: 4
---

`t()` picks the active locale. Sometimes, however, the right locale isn't the active one.

Consider sending a notification to another user:

```ts [notify.ts]
import { t } from 'yapyak';
import { sendEmail } from './email';

async function notify(user: User) {
  const subject = t('You have a new message');
  await sendEmail(user.email, subject);
}
```

If the active locale doesn't match the user's, the subject comes out in the wrong language.

To translate into a specific locale regardless of the active one, use `t.in()`:

```ts [notify.ts]
import { t } from 'yapyak';
import { sendEmail } from './email';

async function notify(user: User) {
  const subject = t.in(user.locale, 'You have a new message');
  await sendEmail(user.email, subject);
}
```

The first argument is the locale, the second is the source. Every modifier in yapyak follows the same shape — the modifier first, the source last.

## Combining with disambiguation

The same call can carry both a forced locale and a [homonym context](./homonyms.md):

```ts
t.in('sv').as('action', 'Open');
```

Read it left to right: *in Swedish, at the action context, the source is `Open`.* The reverse order works the same way:

```ts
t.as('button').in('sv', 'Open');
```

Both expressions produce the same result.

## Modifiers are inline

`t.in()` and `t.as()` are not factories. They cannot be captured and reused:

```ts
const sv = t.in('sv');
// YPK405: modifier captured. Modifiers must be used inline.
```

The same restriction applies to any non-inline use — return values, object properties, function arguments. When a modifier needs the same locale or context twice, write it twice:

```ts
const subject = t.in(user.locale, 'You have a new message');
const body = t.in(user.locale, 'Click below to read it.');
```

The locale stays visible at every call site, which is easier to read and survives refactors better than a captured alias would.
