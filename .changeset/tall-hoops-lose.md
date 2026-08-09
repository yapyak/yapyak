---
'@yapyak/vite': patch
---

Fix server-rendered pages keeping the source string after a translation arrives.

The dev server refreshed its own catalog and patched the browser, but left the server environments holding the module they had evaluated before the translation landed. Server-rendered apps kept the untranslated string until the dev server restarted.
