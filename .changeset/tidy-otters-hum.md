---
'@yapyak/svelte': patch
---

Add a `textDirection` store holding the text direction of the current locale as a reactive read-only value, next to `locale`. Binding `dir` in a component previously meant deriving the direction manually; `textDirection.current` recomputes on every read, so it stays correct per request during SSR and tracks locale switches on the client.
