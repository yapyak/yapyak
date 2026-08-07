---
'@yapyak/svelte': patch
---

A `t()` call in an `{#each}` context pattern is extracted and rewritten. `{#each items as { label = t('Save') }}` left the call in the built component and removed the `yapyak` import it still needed.
