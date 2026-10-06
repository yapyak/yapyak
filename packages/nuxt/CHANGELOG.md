# @yapyak/nuxt

## 0.0.15

### Patch Changes

- [`83282fa`](https://github.com/yapyak/yapyak/commit/83282faceeb54699b47897bf3745e1e30c102351) Thanks [@qwuide](https://github.com/qwuide)! - Separate the source locale from the default locale. `defaultLocale` named both the language of the `t()` source strings and the locale a visitor gets when nothing else decides, so a project written in English for Swedish users had no way to start in Swedish without also treating Swedish as the source. The new `sourceLocale` option holds the source language and defaults to `defaultLocale`, so existing configs behave as before. `defaultLocale` is now only the locale that applies when no persisted or detected locale matches, and `yapyak status` marks the source locale as `(source)`.
- Updated dependencies [[`4ce29e8`](https://github.com/yapyak/yapyak/commit/4ce29e87a770fad18e42b12aea7ec09a60b0d23b), [`83282fa`](https://github.com/yapyak/yapyak/commit/83282faceeb54699b47897bf3745e1e30c102351), [`8dbe2cf`](https://github.com/yapyak/yapyak/commit/8dbe2cf8bcb864acc2b22a9415e12d5ba3b424a2), [`216aa29`](https://github.com/yapyak/yapyak/commit/216aa29eccef60f3e4f5afd9af3f4fc92d378b01), [`3481723`](https://github.com/yapyak/yapyak/commit/34817232251735ba0f6e4927a1aca8c74484160c)]:
  - yapyak@0.0.15
  - @yapyak/vite@0.0.15
  - @yapyak/vue@0.0.15

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
