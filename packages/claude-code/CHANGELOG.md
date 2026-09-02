# @yapyak/claude-code

## 0.0.14

### Patch Changes

- [#21](https://github.com/yapyak/yapyak/pull/21) [`1cae504`](https://github.com/yapyak/yapyak/commit/1cae5041d17fdbc7382bd8d1e2c6385edc3555ee) Thanks [@qwuide](https://github.com/qwuide)! - Add the Claude Code translator. `claudeCode()` spawns the local `claude` CLI in print mode, so auto-translation runs on the developer's Claude subscription with no API key. The compiler's call-site context, voice, glossary, and style examples flow through the same shared prompt as the API translators, and the CLI runs outside the project directory, so the prompt stays the compiler's alone.

- Updated dependencies [[`e5cecf8`](https://github.com/yapyak/yapyak/commit/e5cecf85d07c478efe09fcfd0f433c78b63b344a), [`e5cecf8`](https://github.com/yapyak/yapyak/commit/e5cecf85d07c478efe09fcfd0f433c78b63b344a)]:
  - yapyak@0.0.14
