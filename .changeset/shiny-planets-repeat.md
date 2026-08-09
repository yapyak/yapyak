---
"yapyak": patch
"@yapyak/vite": patch
---

Read locale files from disk at render time in dev-time SSR via the new `yapyak/dev` subpath. Server-rendered pages now pick up locale file edits on the next request instead of serving stale translations until the dev server restarts.
