---
"@yapyak/vite": patch
---

Keep the messages of a source file that stops parsing. Saving a file with a syntax error read as a file holding no messages, so its translations were moved out of the locale files into the orphan cache and back again on the next working save. The dev server now leaves such a file alone until it parses, and the locale files stay untouched while you fix the syntax.
