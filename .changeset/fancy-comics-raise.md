---
'yapyak': patch
'@yapyak/react': patch
'@yapyak/vite': patch
---

Follow the active locale under React Compiler. React Compiler caches a value until one of its reactive inputs changes, and the active locale is none of them, so a compiled component kept its first `t()` results, `format` output, and helper results after a locale change. `@yapyak/react` now ships a compiler runtime at `@yapyak/react/compiler-runtime/internal`, whose memo cache subscribes the component to the active locale and clears its slots when the locale or a dev-time translation changes, and the Vite plugin resolves `react/compiler-runtime` to it for the files it compiles. Processors declare the replacement through the new `runtime.compilerRuntime` field. On the server the module resolves to React's compiler runtime through the `react-server` condition.
