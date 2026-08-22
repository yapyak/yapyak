---
'@yapyak/react': patch
---

Add a `useTextDirection()` hook returning the text direction of the current locale as a reactive read-only value. Rendering `<html dir>` in a server-rendered root previously meant deriving the direction manually from `useLocale()`; the hook subscribes to locale changes and re-renders only when the direction itself changes.
