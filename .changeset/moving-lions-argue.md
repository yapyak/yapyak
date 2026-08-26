---
'yapyak': patch
---

Share the per-request adapter storage across module graphs through `globalThis`. A server that bundles yapyak into more than one graph — one for the request wrapper, one for the rendered app — now reads and writes the same request context in all of them.
