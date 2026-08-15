---
"yapyak": patch
---

Report a misspelled params key as one diagnostic instead of two. A key that matches no placeholder but closely resembles one now reports YAP0049 with the rename, where it previously reported YAP0004 for the placeholder without a value and YAP0005 for the key without a placeholder. The candidate is picked with the rule TypeScript uses for its own spelling suggestions, so both tools name the same key.
