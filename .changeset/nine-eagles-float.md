---
'@yapyak/vue': patch
---

Supply the enclosing attribute name from template bindings. A `t()` call bound with `:title` or `v-bind:title` now carries `title` as call-site context; the object form `v-bind="{ ... }"` and interpolation content carry nothing.
