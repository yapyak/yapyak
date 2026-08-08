---
'@yapyak/vue': patch
---

A directive expression holding an HTML entity without its trailing semicolon no longer corrupts the emitted component. Vue decodes legacy references like `&lt` and numeric references like `&#38` without the semicolon, so `:title="t('Tom &amp Jerry')"` rewrote the wrong span and produced a broken template.
