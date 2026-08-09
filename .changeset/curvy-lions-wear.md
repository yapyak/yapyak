---
'@yapyak/svelte': patch
---

Fix the dev server failing to start with `js_parse_error: Unexpected token`.

The package shipped its runtime entries as TypeScript source, which Vite's dependency optimizer compiles with no TypeScript step. It now ships compiled JavaScript, built with `svelte-package`.
