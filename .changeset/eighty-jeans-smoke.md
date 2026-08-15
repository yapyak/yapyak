---
"@yapyak/vite": patch
---

Leave a source file that does not parse to the framework plugin. yapyak transforms raw files before the framework compiler runs, so a syntax error in a `.svelte` or `.astro` file failed the yapyak transform first and the file never reached the plugin that reports such errors well. The dev overlay named yapyak for a mistake in your own file, without the code frame the framework would have shown, and it did so on every keystroke that left the file briefly invalid. The parse failure is now skipped in the bundler and the file passes through untouched. `yapyak check` still reports it, since there no other tool reads the file.
