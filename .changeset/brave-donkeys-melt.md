---
"yapyak": patch
---

Report a misspelled placeholder in a translation as one diagnostic instead of two. A placeholder that matches nothing in the source but closely resembles one now reports YAP0051 with the rename, where it previously reported YAP0011 for the source placeholder with no counterpart and YAP0012 for the translation placeholder with no counterpart. Both of those still report on their own when the names resemble nothing.
