---
title: t()
description: The translation function.
order: 1
---

# t()

```ts
import { t } from 'yapyak';

t('Hello, world');
t('Hello {name}', { name: 'Joakim' });
t('You have {count, plural, one {# message} other {# messages}}', { count: 3 });
```

The source string is the key. TypeScript checks the params against the source string at compile time.
