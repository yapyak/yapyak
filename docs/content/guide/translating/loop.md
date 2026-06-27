---
title: Loop
order: 2
---

The save loop runs at dev-time. New `t()` calls appear; their translations appear in the running browser a second or two later.

```tsx [src/components/empty-cart.tsx]
import { t } from 'yapyak';

export function EmptyCart() {
  return <p>{t('Your cart is empty')}</p>;
}
```

## What runs on save

On save, yapyak's plugin runs four steps:

1. Extracts the new `t()` calls
2. Reconciles them against your locale files
3. Sends any new stubs to the configured [translator](/guide/translating/providers)
4. Writes the results back

The source-only steps take milliseconds. The translator step takes a second or two for typical batches. See [HMR](/guide/advanced/hmr) for the full mechanics.

## The render is not blocked

The source string renders in the browser immediately. The translation arrives shortly after as the translator response writes back through HMR. You're not blocked on the model.

## Threshold

A single save that adds more than `autoTranslateThreshold` new strings holds off auto-translation. yapyak writes the stubs and logs that the translator was skipped. Run [`yapyak translate`](/guide/translating/coverage) when you're ready.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  autoTranslateThreshold: 20
});
```

Default is `20`. Set it to `0` to disable auto-translation entirely (you run [`yapyak translate`](/reference/cli/translate) when you're ready); set it to a large number to never skip.

The guardrail catches large refactors and agent-generated additions that would otherwise burn through your API budget on one save.

## Adding a locale

Adding a locale with `yapyak add sv` runs the translator over every existing source string in one batch rather than waiting for them to come in on save. See [Coverage](/guide/translating/coverage).

## Locale-file edits

A direct edit to `locales/sv.json` follows a separate sub-second path that diffs the file and updates the runtime in place. See [HMR](/guide/advanced/hmr#locale-file-save-loop).
