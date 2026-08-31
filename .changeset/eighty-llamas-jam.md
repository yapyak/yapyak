---
'@yapyak/astro': patch
'@yapyak/svelte': patch
'@yapyak/vue': patch
---

Declare each script block's scope, so the new module-scope diagnostic fires for code that runs once per module load and stays silent for code that runs per instance, render, or request.
