---
'@yapyak/svelte': patch
---

A `t()` call in an `{#snippet}` parameter default is extracted and rewritten. `{#snippet greet(label = t('Save'))}` left the call in the built component and removed the `yapyak` import it still needed.
