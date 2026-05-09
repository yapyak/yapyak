---
order: 10
---

# React

Yapyak was born in React, so this is where it's smoothest. Two flavors:

- **[Vanilla](./vanilla)** — React + Vite SPA. The simplest setup; no SSR concerns, no routing magic.
- **[TanStack Start](./tanstack)** — fully wired SSR. Cookie detection on the server, request-scoped via TanStack's headers, no flash of wrong language.

Both share the same runtime API. The difference is just where `IntlProvider` sits and whether the server reads the request cookie. Pick the one that matches your app and move on.

Either way, you import three things and you're done:

```tsx
import { t, useLocale, setLocale } from 'yapyak';
```

`t()` translates. `useLocale()` returns `[locale, setLocale]` — the locale is reactive, the setter writes the cookie and triggers a re-render. There is no fourth thing to learn.
