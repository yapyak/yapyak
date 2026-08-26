---
'yapyak': patch
---

Alias `yapyak/config` inside config files to the yapyak doing the loading, so `yapyak.config.ts` resolves in projects where yapyak is only a transitive dependency of an adapter package.
