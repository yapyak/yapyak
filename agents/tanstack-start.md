## TanStack Start + Router

### Route files

- Route files (`src/routes/`) contain the Route definition (loader + `Component` function).
- `Component` is the page — it composes domain components from `src/components/`.
- No "Page" wrapper components — the route `Component` owns the page layout.
- Route config callbacks use shorthand method syntax: `async loader({ context }) {`, not `loader: async ({ context }) => {`.

### Route-scoped hooks

In route files, **always use route-scoped hooks** — never their top-level equivalents from `@tanstack/react-router`. The route-scoped variants are typed to the specific route.

```ts
Route.useParams()
Route.useSearch()
Route.useLoaderData()
Route.useNavigate()
Route.useRouteContext()
```

### Route component naming

Route component functions match TanStack config keys: `component: Component`, `errorComponent: ErrorComponent`, `pendingComponent: PendingComponent`, `notFoundComponent: NotFoundComponent`.

**Route config component values must be named function references defined in the same file.** Never inline arrows, never import a component from elsewhere into the config.

```ts
// ✓ Right — named function in same file
export const Route = createFileRoute('/foo')({
  component: Component,
});

function Component() {
  return <div />;
}

// ✗ Wrong — inline arrow
component: () => <div />,

// ✗ Wrong — imported from another file
import { FooPage } from '#components/foo-page';
component: FooPage,
```

### Route config option order

```
1. validateSearch, search
2. loaderDeps, beforeLoad, loader
3. shouldRevalidateLoader, gcTime
4. onEnter, onStay, onLeave, onCatch
5. head, meta, scripts, headers
6. pendingMs, pendingMinMs, wrapInSuspense
7. component, pendingComponent, errorComponent, notFoundComponent
```

### Loaders

| Rule | Detail |
|---|---|
| Loaders return an object | Always use explicit `return`, never implicit arrow shorthand. |
| Pass loaded data straight through | Never transform or reshape in the loader. Derivation happens in `Component`. |
| `useLoaderData()` only in `Component` | Never call it in domain components. |
| Loader data is always defined | No `\| undefined` guards needed. |

### Search params

- `stripSearchParams(DEFAULTS)` on each route so default values stay out of the URL.
- The `search` prop on links controls what survives navigation — set it explicitly.

### Router invalidation

`router.invalidate()` is always called with `{ sync: true }`: `await router.invalidate({ sync: true })`.

### Server functions — `@tanstack/react-start`

- Data fetching uses `createServerFn()` (GET is the default; never specify `{ method: 'GET' }`).
- Server functions return **plain data** (discriminated unions, primitives, arrays) — never class instances. Serialization (seroval) only handles JSON-compatible shapes.

### Server-only helpers — `.server.ts` suffix

`.server.ts` marks a file as server-only — it never bundles to the client. A client component that imports from a `.server.ts` fails the build loudly.

- **Route-specific server helpers** live next to the route: `routes/post.$.server.ts` is the companion to `routes/post.$.tsx`.
- **Cross-route shared server helpers** live in `lib/*.server.ts`.
- **Function names inside `.server.ts`** are plain action verbs — `loadArticle`, `loadManifest`, `parseSource`. No prefix/suffix to mark them server-only; the file extension already does.
- **Types shared between client and server live in a non-`.server.ts` file.** Functions in `lib/x.server.ts`, types in `lib/x.ts`. Client components import types via `import type` from the type file. Domain/content types live in the shared `.ts` type file and are imported. A UI `?:`-optional Props type is declared in the component file (per [[react]]) and derived from the domain type; never re-declared in the shared file.
- **A type stays in a `.server.ts`** only when it references a server-only runtime value via `typeof` (e.g. `ReturnType<typeof loadArticle>`); the client then imports it via `import type` only — erased at build, no runtime leak. Otherwise it moves to the `.ts` type file.
