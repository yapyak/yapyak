## Client

Rules for code that runs in the browser (client-side). Excludes Node servers, CLIs, and isomorphic code that runs on both sides.

### Timers — `window.*` only

Always call `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `requestAnimationFrame`, `cancelAnimationFrame` on `window`:

```ts
// ✓
window.setTimeout(fn, 100);
window.requestAnimationFrame(fn);

// ✗
setTimeout(fn, 100);
requestAnimationFrame(fn);
```
