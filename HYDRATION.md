# Locale hydration mismatch — known issue, to fix

Status: parked, reproducible, not user-breaking. Found 2026-07-10 by the e2e console-error guard.

## Symptom

React throws `Hydration failed because the server rendered text didn't match the client` when the locale cookie changes between the server render of a document and React's hydration of that same document. React recovers by discarding the server tree and re-rendering on the client. The final UI is correct; the cost is a console error and a client re-render flash.

React's hydration diff (captured from a live reproduction):

```
<html  + lang="sv"      ← client derives Swedish
       - lang="en"      ← server rendered English
<h1>   + Hej där
       - Hello there
```

## Deterministic reproduction

App: `examples/react-react-router-cookie` (dev server on any port).

1. `GET /` with no cookie → server renders English HTML.
2. Before React hydrates, click the **server switch** button (the `<Form method="post">` group). The click works pre-hydration because it is a native form submit — progressive enhancement, no JS required.
3. The POST response carries `Set-Cookie: locale=sv`, so `document.cookie` now says `sv`.
4. React hydrates the still-loaded English document. The client reads the *live* cookie (`sv`), renders Swedish, and mismatches the English server HTML.

Reproduced 5/5 with this probe (run from `e2e/` so `@playwright/test` resolves):

```js
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (error) => console.log(error.message));
await page.goto('http://localhost:5302/', { waitUntil: 'commit' });
await page.getByRole('button', { name: 'Swedish' }).last().click({ timeout: 2000 });
await page.waitForTimeout(2500);
await browser.close();
```

Clicking the **client** switch button pre-hydration does NOT reproduce: it is `type="button"` with no native behavior, so the click is silently lost (the standard dead-button window) — no error, no cookie change.

## Root cause

The server and the client derive the locale from two different sources that can diverge for the same document:

- Server: `getFromRequest(request)` reads the **request** `Cookie` header — the value at render time ([packages/yapyak/src/persistence/cookie.ts](packages/yapyak/src/persistence/cookie.ts), `getFromRequest`).
- Client: `get()` reads **live** `document.cookie` at hydration time (same file, `get`).

Anything that mutates the cookie between those two reads (a parallel native POST, another tab, devtools) makes hydration render a different locale than the HTML was rendered with. The mismatch is inherent to deriving the client's initial locale from a mutable source instead of from a snapshot of what the server actually rendered.

## Scope

Only `react-react-router-cookie` among the examples can hit it today, because triggering requires ALL of:

| Requirement | Why the other examples escape |
| --- | --- |
| SPA hydration of server HTML | `astro-cookie` ships no interactive island here — nothing hydrates |
| A locale mutation that works pre-hydration (native form POST) | `svelte-sveltekit-cookie` / `react-tanstack-start-cookie` switch via JS-driven remote/server functions — dead until hydrated |
| Cookie persistence | `url` examples carry locale in the path; `local-storage` examples have no server rendering |

The window is milliseconds-to-seconds (dev is slower than prod). A fast human on a slow connection can hit it; a test runner hits it reliably.

## Fix direction — snapshot hydration

Textbook SSR: the client hydrates with the locale **the HTML was rendered with** (a snapshot delivered in the payload), and only after hydration syncs against the live persistence source. Then this mismatch class cannot exist.

Sketch:

1. During SSR (inside the `withResponse` scope), record the locale the render actually used.
2. Deliver it to the client with the document — candidates: an inline `<script>` set by the adapter, loader data (framework-specific), or a data attribute on `<html>`.
3. On the client, initial locale = snapshot when present; `persistence.get()` is consulted only after hydration (and via `subscribe` for cross-tab changes).

Constraints to respect:

- Do not break progressive enhancement — the native-POST flow must keep working without JS.
- Do not regress the diagnostics: `YAP0022` (module-global fallback) and `YAP0023` (cookie writer missing) semantics stay.
- The snapshot mechanism must work across all SSR adapters (`react-router`, `tanstack-start`, `sveltekit`, `astro`) or be layered so non-snapshot adapters keep today's behavior.
- Cross-module rules: whatever carries the snapshot lives behind the existing barrels; the adapters already share `withResponse` in `yapyak/adapter`.

## Verification when fixed

- The probe above stops printing hydration errors while the page still ends up Swedish.
- The e2e suite's console-error guard ([e2e/src/test.ts](e2e/src/test.ts)) fails any test on `pageerror`/`console.error`, so a regression in any example is caught by `pnpm e2e:dev` / `pnpm e2e:prod`. Consider adding a dedicated pre-hydration-click test once fixed (click at `waitUntil: 'commit'` instead of after `networkidle`).

## Open questions

- Delivery mechanism per adapter: loader data feels idiomatic in react-router but is framework-specific; an adapter-injected inline script is uniform but adds a script tag; `<html data-*>` is inert but stringly.
- Should the post-hydration sync adopt a cookie that changed mid-load (re-render to Swedish after hydration), or keep the snapshot until the next navigation? Adopting matches today's end state; keeping is calmer.
- Does the same divergence exist for `local-storage` persistence (mutable via another tab during load)? Same class, lower stakes — no server HTML to mismatch. Decide whether the snapshot model should cover it for consistency.
