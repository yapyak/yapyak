---
title: React Compiler
order: 5
---

yapyak works with [React Compiler](https://react.dev/learn/react-compiler). On a locale change, every compiled component recomputes, so `t()` calls and `format` reads follow the active locale, in the component and in the helpers it calls.

```ts [vite.config.ts]
import react from '@vitejs/plugin-react';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react({ compiler: true }), yapyak()]
});
```

The yapyak plugin runs before React Compiler in either plugin order. Running the compiler through `@rolldown/plugin-babel` with plugin-react's `reactCompilerPreset` works the same way.

## Memo cache

React Compiler caches a value until one of its reactive inputs changes: props, state, context, or a hook result. The active locale is none of those. Without yapyak, React Compiler emits this for `SaveButton`:

```tsx [save-button.tsx]
import { c as _c } from 'react/compiler-runtime';
import { t } from 'yapyak';

export function SaveButton() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for('react.memo_cache_sentinel')) {
    t0 = <button type="button">{t('Save changes')}</button>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
```

The element is computed once and kept after a locale change. The yapyak plugin resolves that import to its own compiler runtime, whose `c` subscribes the component to the active locale and returns the memo cache. When the locale has changed since the last render, it clears every slot first, so the component recomputes once and caches again for the new locale. Between changes, the memo cache works as before.

The memo cache holds every value the component computes, so the reset reaches `t()` calls, `format` reads, helpers at any depth, parameter defaults, and values from hooks and context. `useMemo` and `useCallback` compile into the same cache and recompute once per locale change too. A dev-time translation edit clears the cache the same way, so the [save loop](/guide/getting-started/how-it-works#save-loop) updates compiled components.

On the server, the `react-server` condition resolves yapyak's compiler runtime to React's own. The locale is set once per request there, and nothing subscribes.

## Runtime module

The yapyak plugin replaces the compiler runtime for the files it compiles. Compiled code in `node_modules` keeps React's. Put `yapyak()` before any other plugin that replaces the compiler runtime.
