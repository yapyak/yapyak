---
'@yapyak/nuxt': patch
---

Add `@yapyak/nuxt`, installed as the single yapyak package: `yapyak` ships inside it, and a forwarded `yapyak` bin keeps the CLI available. `nuxi module add @yapyak/nuxt` registers the module and writes a starter `yapyak.config.ts` at the project root. The module wires the compiler into Vite, registers `RichText`, auto-imports `t`, scopes locale state per request on the server, and syncs `<html lang>` and `dir`. An unbound `t()` binds to yapyak through the new `nuxt()` processor, so components need no import, and the CLI and the editor extension read the same binding from the config.
