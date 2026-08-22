---
'@yapyak/vue': patch
---

Add a `textDirection` ref holding the text direction of the current locale as a reactive read-only value, next to `locale`. Binding `dir` in a template previously meant deriving the direction manually; the ref recomputes on every read, so it stays correct per request during SSR and tracks locale switches on the client.
