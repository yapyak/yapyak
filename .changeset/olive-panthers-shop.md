---
'@yapyak/claude-code': patch
---

Add the Claude Code translator. `claudeCode()` spawns the local `claude` CLI in print mode, so auto-translation runs on the developer's Claude subscription with no API key. The compiler's call-site context, voice, glossary, and style examples flow through the same shared prompt as the API translators, and the CLI runs outside the project directory, so the prompt stays the compiler's alone.
