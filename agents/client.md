## TypeScript — client

Browser-only code — not Node, CLIs, or isomorphic code.

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
