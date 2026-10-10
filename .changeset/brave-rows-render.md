---
'@yapyak/react': patch
---

Add `YapyakProvider`, exported from `@yapyak/react/provider`. The compiler injects a `useYapyak()` hook into every component, and that hook took two slots in React's hook list. A component called as a plain function, `Row(props)` instead of `<Row />`, ran it inside its caller, so React threw "Rendered more hooks than during the previous render" as soon as the number of calls changed, also in files without a `t()` call. Below the provider, `useYapyak()` reads the locale from React context instead, which takes no slot, so those components render as they did before yapyak was added. The provider is optional: a component outside it subscribes to the locale store on its own, as before.
