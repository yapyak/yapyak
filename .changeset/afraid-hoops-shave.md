---
'yapyak': patch
---

Add `YAP0055`, a warning for `t()` at module scope, where the result is read once at module load, never updates, and is shared across requests on the server. For custom processors, `Fragment` gains a required `scope` field declaring whether a fragment's top level runs once per module load or once per instance, and `ComponentHook` gains a required `evidencePattern` field naming the calls that count as component evidence.
