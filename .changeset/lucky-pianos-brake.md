---
'@yapyak/vue': patch
---

A directive expression holding an HTML entity no longer corrupts the emitted component. `@vue/compiler-sfc` reports the expression decoded but its position raw, so `:title="t('Tom &amp; Jerry')"` rewrote the wrong span and produced a broken template. The processor now maps the decoded expression back to the raw source one run at a time.
