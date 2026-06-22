---
title: Lists
order: 4
---

`format.list()` joins an array of strings into a single phrase using the active locale's conventions. The boundaries between items, the conjunction word ("and", "or"), and the way the last item connects are all different across languages — `format.list()` handles all of it.

```ts
import { format } from 'yapyak';

format.list(['apple', 'pear', 'orange']);
```

{% output %}
en-US: 'apple, pear, and orange'
sv-SE: 'apple, pear och orange'
fr-FR: 'apple, pear et orange'
{% /output %}

It's a thin wrapper over [`Intl.ListFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat), reading the active locale on every call. Any option from `Intl.ListFormat` works.

## Common pattern: list of localized labels

```ts
import { format, t } from 'yapyak';

const features = [
  t('Pull requests'),
  t('Issues'),
  t('Discussions')
];

format.list(features);
```

{% output %}
en-US: 'Pull requests, Issues, and Discussions'
sv-SE: 'Pull requests, Issues och Discussions'
{% /output %}

Each item passes through `t()` first to become locale-aware text. Then `format.list()` joins them in the right way for the active locale. The two layers compose without anyone having to think about it.

## What about lists inside a sentence?

If the list is part of a larger translated message ("Choose one of {options}"), the answer is to render the list separately and pass the result in as a placeholder:

```ts
const options = format.list(['email', 'SMS', 'push']);

t('Choose one of {options}.', { options });
```

{% output %}
en-US: 'Choose one of email, SMS, and push.'
{% /output %}

ICU MessageFormat has no list sub-format, so this is the path.
