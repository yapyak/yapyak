---
'@yapyak/svelte': patch
---

A `t()` call in an `{#await}` then or catch pattern is extracted and rewritten. `{#await p then { label = t('Save') }}` left the call in the built component and removed the `yapyak` import it still needed.
