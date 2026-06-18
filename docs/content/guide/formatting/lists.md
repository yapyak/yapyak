---
title: Lists
order: 4
---

`format.list()` joins an array of strings into a single phrase using the active locale's conventions. The boundaries between items, the conjunction word ("and", "or"), and the way the last item connects are all different across languages — `format.list()` handles all of it.

```ts
import { format } from 'yapyak';

format.list(['apple', 'pear', 'orange']);
// 'apple, pear, and orange'   in en-US
// 'apple, pear och orange'     in sv-SE
// 'apple, pear et orange'      in fr-FR
```

It's a thin wrapper over [`Intl.ListFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat), reading the active locale on every call.

## `type` — what kind of join

```ts
format.list(['apple', 'pear'], { type: 'conjunction' });
// 'apple and pear'    in en-US   (default)

format.list(['apple', 'pear'], { type: 'disjunction' });
// 'apple or pear'     in en-US

format.list(['$', '€', '¥'], { type: 'unit' });
// '$, €, ¥'            in en-US
```

`'conjunction'` is the default — "and" in English, "och" in Swedish, "et" in French. `'disjunction'` switches to "or". `'unit'` joins without a connector word, used for things like measurement compositions (`'1 hour 30 minutes'`) or symbol sequences.

## `style` — how prominent the connector is

```ts
format.list(['apple', 'pear', 'orange'], { style: 'long' });
// 'apple, pear, and orange'    (default)

format.list(['apple', 'pear', 'orange'], { style: 'short' });
// 'apple, pear, & orange'      (en-US uses ampersand)

format.list(['apple', 'pear', 'orange'], { style: 'narrow' });
// 'apple, pear, orange'        (no connector at all)
```

`'long'` is the default. `'short'` uses a more compact form; `'narrow'` drops the connector entirely. The results vary heavily by locale — in Swedish, all three styles render almost identically; in Japanese, the differences are more pronounced.

## Common pattern: list of localized labels

```ts
import { format, t } from 'yapyak';

const features = [
  t('Pull requests'),
  t('Issues'),
  t('Discussions'),
];

format.list(features);
// 'Pull requests, Issues, and Discussions'    in en-US
// 'Pull requests, Issues och Discussions'     in sv-SE
```

Each item passes through `t()` first to become locale-aware text. Then `format.list()` joins them in the right way for the active locale. The two layers compose without anyone having to think about it.

## What about lists inside a sentence?

If the list is part of a larger translated message ("Choose one of {options}"), the answer is to render the list separately and pass the result in as a placeholder:

```ts
const options = format.list(['email', 'SMS', 'push']);
t('Choose one of {options}.', { options });
// 'Choose one of email, SMS, and push.'   in en-US
```

ICU MessageFormat has no list sub-format, so this is the path.
