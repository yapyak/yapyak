---
'yapyak': patch
---

Scan the whole project by default. `include` now defaults to the project root, with dot directories, `node_modules`, and build output skipped, so `t()` calls outside `src` compile instead of throwing at runtime. Set `include` to narrow extraction, as before.
