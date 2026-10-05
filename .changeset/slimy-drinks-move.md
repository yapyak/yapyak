---
'@yapyak/vite': patch
---

Run yapyak's transform ahead of other plugins' transforms. A tool that rewrites components in the same phase, such as React Compiler, ran before yapyak whenever its plugin came earlier in `plugins`, which is the order the installation guide shows, and compiled the source before yapyak had rewritten the `t()` calls and injected its hook. The transform now declares `order: 'pre'`, so React Compiler compiles yapyak's output in either plugin order.
