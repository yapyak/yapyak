---
'yapyak': patch
---

Detect the visitor's locale from `navigator.languages` only in the browser. With `detectUserLocale` enabled, the locale store read `navigator.languages` wherever a global `navigator` existed, and server runtimes define one too. Bun's has no `languages`, so importing yapyak threw during server-side rendering before any request was handled. Node's reports the operating system's locale, so the shared fallback locale on the server started as the machine's language instead of `defaultLocale`. On the server the store now starts at `defaultLocale`, and each request still resolves its own locale from `Accept-Language`.
