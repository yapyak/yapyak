# @yapyak/nuxt

## 0.0.14

### Patch Changes

- Updated dependencies [[`e5cecf8`](https://github.com/yapyak/yapyak/commit/e5cecf85d07c478efe09fcfd0f433c78b63b344a), [`e5cecf8`](https://github.com/yapyak/yapyak/commit/e5cecf85d07c478efe09fcfd0f433c78b63b344a), [`5a0dede`](https://github.com/yapyak/yapyak/commit/5a0dede515c2f568b9e5ef84707922bbeb981b1e), [`e5cecf8`](https://github.com/yapyak/yapyak/commit/e5cecf85d07c478efe09fcfd0f433c78b63b344a)]:
  - yapyak@0.0.14
  - @yapyak/vue@0.0.14
  - @yapyak/vite@0.0.14

## 0.0.13

### Patch Changes

- [#18](https://github.com/yapyak/yapyak/pull/18) [`57d75df`](https://github.com/yapyak/yapyak/commit/57d75dfc5c49268a86d9ee279189aa1ad147d34b) Thanks [@qwuide](https://github.com/qwuide)! - Add `@yapyak/nuxt`, installed as the single yapyak package: `yapyak` ships inside it, and a forwarded `yapyak` bin keeps the CLI available. `nuxi module add @yapyak/nuxt` registers the module and writes a starter `yapyak.config.ts` at the project root. The module wires the compiler into Vite, registers `RichText`, auto-imports `t`, scopes locale state per request on the server, and syncs `<html lang>` and `dir`. An unbound `t()` binds to yapyak through the new `nuxt()` processor, so components need no import, and the CLI and the editor extension read the same binding from the config.

- Updated dependencies []:
  - yapyak@0.0.13
  - @yapyak/vite@0.0.13
  - @yapyak/vue@0.0.13
