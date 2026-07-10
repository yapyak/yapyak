# Save-loop HMR findings — to investigate

Status: parked, both reproducible via the save-loop e2e suite. Found 2026-07-10 while building [e2e/src/save-loop.spec.ts](e2e/src/save-loop.spec.ts). Related: [HYDRATION.md](HYDRATION.md) (the SSR-side mismatch).

## Finding 1 — uncontrolled input value is lost on a source save

[hmr.md](docs/content/guide/advanced/hmr.md) promises: "Component state — open dialogs, form inputs, scroll position — stays put because Vite swaps the module without re-mounting."

Measured in the sandbox (react-vanilla shape, `@vitejs/plugin-react`):

- **Controlled input** (`value` from `useState`): survives the swap — hook state is preserved. The shipped test `preserves the input value when the source is saved` proves this on every run.
- **Uncontrolled input** (`<input />`, value held by the DOM): the value is cleared deterministically on every yapyak source save, even when the edit does not touch the input's sibling position. Reproduced 4/4 before the test was switched to a controlled input.

So React state stays put; DOM-held state does not. Either the docs sentence narrows to React state, or the swap path needs to stop recreating untouched DOM nodes.

To reproduce: change the sandbox template input back to `<input />` and re-run the input test — it fails with `value=""`.

## Finding 2 — Fast Refresh degrades to remount after file-move churn

With the move test (`preserves the translation when the source file moves` — creates `src/checkout/cart.tsx`, rewrites the import in `app.tsx`, deletes `src/cart.tsx`) running BEFORE the input test, the next source save **remounts** the tree — even the controlled input resets (`useState` back to `''`). With the input test ordered before the move test, the same save hot-refreshes and state survives. Reproduced consistently in both orders (3/3 runs each).

The degradation lives in the dev server's module-graph/Fast Refresh state, not in the test fixtures — each test starts from identical files, a fresh browser context, and a quiesced catalog. The spec currently orders the input test before the move test and this file documents the coupling.

Open questions:

- Does the plugin's transform of the rewritten import chain break the react-refresh boundary (extra invalidation of `app.tsx`), or is this upstream `@vitejs/plugin-react` behavior after an import target is deleted and recreated?
- Does a real user hit this? Sequence: move a component file, update the import, keep editing — the next save loses component state. Annoying, not breaking; the docs promise state survival without qualification.

## Verification when fixed

- Finding 1: switch the sandbox template input to uncontrolled — the input test must still pass.
- Finding 2: move the input test after the move test in [save-loop.spec.ts](e2e/src/save-loop.spec.ts) — it must still pass. Both orderings green = fixed.
