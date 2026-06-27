---
title: Loop
order: 2
---

The save loop is yapyak's dev-time translation path. A `t()` call appears, the file is saved, the translator fills the new stubs, and the running browser updates.

```tsx [src/components/empty-cart.tsx]
import { t } from 'yapyak';

export function EmptyCart() {
  return <p>{t('Your cart is empty')}</p>;
}
```

Save the file. The Swedish translation appears in the browser a second or two later.

## What runs on save

1. Vite picks up the file change and notifies the yapyak plugin.
2. The plugin extracts every `t()` call and reconciles them against your locale files.
3. New entries are written as empty stubs. Removed entries are noted. [Renames](/guide/translating/renames) are followed.
4. If a [translator](/guide/translating/providers) is configured, the new stubs are batched and sent.
5. Returned translations are written back to your locale files.
6. Vite's HMR updates the running browser. Component state survives.

Source-only steps take milliseconds. The translator step takes a second or two for typical batches.

## The render is not blocked

The source string renders in the browser immediately. The translation arrives shortly after as the translator response writes back through HMR. You're not blocked on the model.

## The threshold guardrail

A single save that adds more than `autoTranslateThreshold` new strings holds off auto-translation. yapyak writes the stubs and logs that the translator was skipped. Run [`yapyak translate`](/guide/translating/coverage) when you're ready.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  autoTranslateThreshold: 20
});
```

Default is `20`. Set it to `0` to skip auto-translation entirely; set it to a large number to never skip.

The guardrail catches large refactors and agent-generated additions that would otherwise burn through your API budget on one save.

## Adding a locale

Calling `yapyak add sv` triggers the loop for every existing source string in the new locale. The new file is filled in one run rather than one save at a time. See [Coverage](/guide/translating/coverage).

## The locale-file save loop

A direct edit to `locales/sv.json` follows a separate path. yapyak diffs the file against its cached version, sends only the changed entries to the browser, and the runtime updates them in memory. Source modules are not recompiled. Component state survives. The whole loop is sub-second.

You can lean on this. Open `locales/sv.json` next to the running app, edit a translation, watch it land before you've lifted your finger off `Cmd-S`.
