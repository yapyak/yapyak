# CLAUDE.md

This is the yapyak marketing + docs site. It's a TanStack Start app inside the yapyak monorepo, dogfooding the `yapyak` library itself.

## Yapyak-site overrides

The rules below this section are copied verbatim from the skiftle frontend codebase, since they capture the conventions we want for any React/TanStack site we ship. The following deviations apply specifically to `yapyak/site/`:

- **i18n uses `t()` from `yapyak` directly.** Ignore the `defineTranslation` / `useTranslation` / `src/lib/intl.ts` pattern described later in this file. In yapyak/site:
  - `import { t } from 'yapyak'`
  - All user-facing strings go through `t('...')`. No `useTranslation` hook.
  - Locale switching uses `useLocale()` from `yapyak/react`.
  - No translation key conventions (no `{subject}{Component}{Prop}` camelCase keys). The source string IS the key.
- **Styling is CSS Modules**, same conventions as described later in this file. Design tokens live in `src/style.css` as CSS custom properties (`--bg`, `--text`, `--mint`, `--space-*`, `--radius-*`, etc.). Components have `.module.css` siblings, PascalCase classes, nested children, `@layer components`.
- **No `@skiftle/api` types.** We don't have a backend. Types come from `yapyak`'s public exports and from each route's own data shape.
- **No `useMutation` from `#hooks/useMutation`.** Same reason — no backend. If a route needs an action (rare on a docs site), use a server function or plain `fetch` directly.
- **Mutation/confirm/toast conventions are still useful** as patterns — apply them if/when the site grows interactive features (search, locale switcher feedback, etc.).
- **Loaders return Markdown content** for `/guide/$slug` routes. The shape is `{ title, description, content }` parsed from frontmatter — pass through to the component unchanged.
- **Path aliases** `#components/*` and `#lib/*` are wired via package.json `imports` and tsconfig `paths`. Use them for cross-folder imports, not relative paths.

## Formatting

- Always run `pnpm check:write` after making changes to ensure consistent formatting and lint compliance
- **Never leave comments in code.** No inline `//`, no block `/* */`, no JSDoc on internal symbols. Code should be self-explanatory through naming. The only exception is when a comment is the sole way to communicate non-obvious intent (rare — fix the code first).

## File Naming

All files and folders use **kebab-case**. No exceptions — `.ts`, `.tsx`, `.module.css`, folders, everything.

Exports keep their idiomatic casing. Filename matches the primary export **by spelling**, not casing: `useTheme` → `use-theme.ts`, `ButtonGroup` → `button-group.tsx`, `createArrayNode` → `create-array-node.ts`.

### Components (`components/`)

One folder per component "concern". Related components are flat files in the same folder. Never nest sub-folders for sub-components:

```
button/
  button.tsx
  button.module.css
  button-group.tsx
  button-group.module.css
  index.ts
dialog/
  dialog.tsx
  dialog.module.css
  dialog-content.tsx
  dialog-content.module.css
  dialog-header.tsx
  dialog-header.module.css
  dialog-footer.tsx
  dialog-footer.module.css
  dialog-trigger.tsx
  use-dialog-trigger.ts
  index.ts
```

- `index.ts` determines what is public — files not exported from `index.ts` are private/internal
- Each `.tsx` component has its own `.module.css` directly next to it
- Hooks related to a component live in the same folder (`use-dialog-trigger.ts`)

### Primitives (`primitives/`) and Systems (`systems/`)

Grouped by concern. Flat files within each concern:

```
primitives/
  interaction/
    press/
      use-press.ts
      use-pressable.ts
      press-event.ts
      index.ts
    hover/
      use-hover.ts
      use-hoverable.ts
      index.ts
  foundation/
    box.tsx
    index.ts
systems/
  theme/
    theme-context.ts
    theme-provider.tsx
    constants.ts
    types.ts
    index.ts
```

## React Rules

### Components

- Named exports only, never default exports
- Props type is an exported interface in the same file: `export interface ComponentNameProps`
- Props are destructured on the first line of the function body, not in the signature: `const { disabled = false } = props`
- Defaults are set in the destructuring assignment
- `...restProps` is spread onto the root element when the component wraps a native or base element
- Each component gets its own folder: `components/Button/Button.tsx` with an `index.ts` that re-exports
- Each component has its own `ComponentName.module.css` file directly next to its `.tsx` file — never import CSS from a parent component
- Sub-components are flat files in the parent folder — never nested sub-folders: `ActionList/ActionListItem.tsx` not `ActionList/ActionListItem/ActionListItem.tsx`
- `index.ts` determines what is public — sub-components not exported from `index.ts` are private
- Compound components use dot-notation with `declare namespace` + property assignment, never `Object.assign` or `*Fn` suffix:

  ```tsx
  // ✓ Right
  export declare namespace ActionList {
    let Item: typeof ActionListItem;
    let Separator: typeof ActionListSeparator;
  }

  export function ActionList(props: ActionListProps): ReactElement {
    // body
  }

  ActionList.Item = ActionListItem;
  ActionList.Separator = ActionListSeparator;

  // ✗ Wrong — body inside Object.assign, ugly *Fn suffix
  export const ActionList = Object.assign(ActionListFn, { Item: ActionListItem });
  function ActionListFn(props) { ... }
  ```

  - File order: `declare namespace` → `function` declaration → property assignments
  - `declare namespace` provides the type for sub-components (works with `isolatedDeclarations`)
  - Use `let` (not `const`) inside the namespace — `const` makes properties readonly and blocks the assignment
  - Property assignments come at the end (right after the function body)

### Render-prop pattern on Base primitives

Base primitives (`*Base` components) expose their `useX` state to consumers in one of two ways depending on whether `children` is **content** or **structure**:

- **Atomic Base primitives** — children are content. The component **must** accept a render prop and call `invoke(children, x.state)`:

  ```tsx
  export type CheckboxBaseProps = Override<
    BoxProps<'label'>,
    UseCheckboxOptions & {
      children?: ReactNode | RenderProp<UseCheckboxReturn['state']>;
    }
  >;

  export function CheckboxBase(props: CheckboxBaseProps): ReactElement {
    const { children, ...restProps } = props;
    const checkbox = useCheckbox({ ... });

    return (
      <Box {...restProps}>
        {invoke(children, checkbox.state)}
      </Box>
    );
  }
  ```

  Atomic = `CheckboxBase`, `RadioBase`, `ButtonBase`, `LinkBase`, `GridBaseRow`, `GridBaseCell`, `ListboxBaseOption`, etc. — anything whose `children` is the visual content of that one element.

- **Container Base primitives** — children are **structure** (sub-components). The component **must not** use a render prop, since `children` is parsed for sub-elements (`Listbox.Option`, `Grid.Body`, `Menu.Item`, ...). State is exposed to descendants via Context instead:

  ```tsx
  export function ListboxBase(props: ListboxBaseProps): ReactElement {
    const items = useListboxItems(props.children);
    const listbox = useListbox(items, { ... });

    return (
      <Box {...listbox.props}>
        <ListboxContext value={listbox.contextValue}>
          {items.map(renderListboxItem)}
        </ListboxContext>
      </Box>
    );
  }
  ```

  Container = `ListboxBase`, `GridBase`, `MenuBase`, `TabsBase`, etc. Descendants reach state via `useListboxContext()` / `useGridContext()` / etc.

The test: ask "are children visual content of this element, or structural sub-components?" Content → render prop. Structure → context.

The render-prop function receives `state` typed as `UseXReturn['state']` (or a re-exported alias like `CheckboxBaseState`). Always type the alias and re-export it, so consumers can write strongly-typed render functions.

### Exports

- `index.ts` re-exports values and types separately: `export { Button }` + `export type { ButtonProps }`

### Props

- Never pass data as a separate prop when it is already accessible from another prop. If a component receives `param` and needs `param.name`, read it from `param.name` inside the component — do not add a `name` prop.
- Pass domain data (e.g. `enums`, `types`) as-is through the component tree. Derive computed values at the point of use, not at intermediate layers.
- `data-*` attributes use lowercase kebab-case: `data-animating`, `data-hide-indicator` — never camelCase (`data-isAnimating`)
- `data-*` attributes never use `is`/`has` prefix: `data-active`, `data-disabled` — never `data-is-active`
- Never pass `|| undefined` to `data-*` attributes — `Box` handles falsy values automatically
- CSS custom properties (`style={{ '--x': value }}`) are always set on the root element, even if consumed by descendants via CSS `var()`
- **Cross-component CSS variables** (custom properties read by one component and set by another) must be prefixed with the **owning component's kebab-case name**. The owning component is the one that *reads* the variable (it defines the contract). Example: `SelectionIndicator` reads `--selection-indicator-fill-color` and `--selection-indicator-icon-color`; consumers like `BodyRow` set those exact names to override defaults. Unprefixed names like `--fill-color` collide globally; component-prefixed names form a clear contract. Variables consumed only within the same component (internal CSS modules) don't need prefixes.
- **Avoid passing `className` to styled components** (`Button`, `Badge`, `Link`, etc.). Use variants (`size`, `appearance`, `intent`) to customize. If no variant fits — add one to the component, or use the Base primitive (`ButtonBase`, `LinkBase`) for full control. `className` on styled components is a code smell — it means the component API is incomplete
- **Never pass explicit generic type arguments in JSX** — no `<Box<'input'>>`, `<List<User>>`, etc. The generic is inferred from `as=` or other props. If inference fails, the component's type definition is wrong — fix it there, not at the call site.

### Hooks

- One hook per file: `useControllableState.ts`
- Options/return types exported as `Use[Name]Options` and `Use[Name]Return`

### Naming

- Always use **singular resource** in component names: `ClientTable`, `EmployeeCard` — never `ClientsTable`
- Domain components are named `[Resource][Element]`: `ClientTable`, `EmployeeCard`, `AccountNavigation`
- No "Page" components — the route `Component` function handles page layout directly
- **Dispatcher components:** When a "base" component renders a different sub-component based on a type/variant (discriminated union), name the variants `[Parent][Variant]` — not `[Parent][Element]`. Example: `ActivityItem` dispatches to `ActivityItemComment` and `ActivityItemEvent` based on `activitableType`

### Layout vs domain name

Pick the suffix based on what the component's top-level navigation chrome lets the user switch between:

| Chrome switches between                                          | Suffix                            |
| ---------------------------------------------------------------- | --------------------------------- |
| Different **instances** (master-detail list)                     | `*Layout`                         |
| Different **peer domains** (Clients vs Employees vs Billing)     | `*Layout`                         |
| Different **aspects of one instance** (Översikt vs Platser tabs) | domain name (`*Detail`, `*Card`, `*Summary`, ...) |

The pattern across nesting depth: **list-shell = Layout, instance-shell = Detail**, regardless of how deep the route tree goes.

```
ClientLayout              (list of clients, master-detail shell)
  └─ ClientDetail         (one client, tabs for facets)
       └─ ClientRateLayout    (that client's rates list — if we build it)
            └─ ClientRateDetail   (one specific rate)
```

#### The peer-vs-aspect test (for workspace shells)

When a component is bound to one `$id` but its children navigate between sub-sections (like `AccountLayout` with Clients / Employees / Billing), ask: **could these children logically exist as peer domains, or are they aspects/sub-collections of the parent?**

- **Peers** — each is a separate concern that could stand alone → `*Layout`
  (Clients and Employees are both top-level resources within an account.)
- **Aspects** — these only make sense as views *of* the parent → domain name
  (Sites and Rates only exist as collections *belonging to* a client.)

This test is not fully deterministic — domain judgment fills in the last 5%. For the 95% the answer is clear.

Never use REST verbs in component names (`*ShowLayout`, `*IndexLayout`) — they describe routes, not components.

### No Abbreviations

Never abbreviate variable, parameter, or block parameter names. Use the full domain name:

```tsx
// Bad
comments.map((c) => c.actorId);
events.map((e) => e.actorId);
const emp = employees.find((emp) => emp.userId === id);

// Good
comments.map((comment) => comment.actorId);
events.map((event) => event.actorId);
const employee = employees.find((employee) => employee.userId === id);
```

### Component Architecture

- **Domain components** (tables, forms, cards) live in `src/components/`, take props, and do one thing.
- Components **never** use `useLoaderData()` or `getRouteApi()`. All data comes through props.
- Types for props come from `@skiftle/api`.
- The route file's `Component` function is the page — it calls `useLoaderData()`, composes domain components, and adds page-level markup (headings, layout).

```tsx
// Good — route file IS the page, composes domain components
export const Route = createFileRoute('/_main/accounts/$accountId/clients')({
  component: Component,
  async loader({ context, params }) {
    const { clients } = await context.api.accounts.clients.index({
      accountId: params.accountId,
    });
    return { clients };
  },
});

function Component() {
  const { clients } = Route.useLoaderData();
  return (
    <div className="px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Kunder</h1>
      <ClientTable clients={clients} />
    </div>
  );
}
```

### Data & Loaders

- Loaders return an object — always use explicit `return`, never implicit arrow shorthand
- Always destructure API responses inline — never assign to intermediate variables:

```tsx
// Good
const { client } = await context.api.accounts.clients.show({ ... });
const [{ comments }, { events }] = await Promise.all([...]);

// Bad
const result = await context.api.accounts.clients.show({ ... });
const [commentsResult, eventsResult] = await Promise.all([...]);
```

- Loaders pass API data straight through — never transform, aggregate, or reshape data in the loader. All derivation and aggregation happens in `Component` or in domain components. This ensures API types from `@skiftle/api` flow unchanged through the component tree.

```tsx
// Good — pass API arrays directly
return { shiftAssignments, shifts, employees };

// Bad — transforming in loader breaks API types
const map: Record<string, string[]> = {};
for (const a of shiftAssignments) { ... }
return { shiftAssignments: map };
```

- Always work with arrays (`T[]`), never transform API arrays into `Record`/`Map` lookups. Use `filterBy`, `findBy`, `indexBy` from `@skiftle/core/array` for lookups at the point of use.
- `useLoaderData()` is called ONLY in the route file's `Component` function, never in domain components
- Find functions (e.g. `findAction`, `findType`) throw internally — loaders never catch
- Use discriminated union narrowing instead of type casts (`as any`, `as SomeType`)
- Loader data is always defined — no `| undefined` guards needed
- Route component functions match TanStack config keys: `component: Component`, `errorComponent: ErrorComponent`, `pendingComponent: PendingComponent`
- When a variable name conflicts with a reserved word, use `_` prefix: `_enum`. Only where the plain name is actually invalid (`type` is fine as a variable).
- Derived values belong in the component that uses them, not in the route or loader.

### Routes

- Route files (`src/routes/`) contain the Route definition (loader + `Component` function).
- `Component` is the page — it composes domain components from `src/components/`.
- No "Page" wrapper components — the route `Component` owns the page layout.
- Route config callbacks use shorthand method syntax: `async loader({ context }) {`, not `loader: async ({ context }) => {`
- In route files, always use route-scoped hooks (`Route.useNavigate()`, `Route.useParams()`, `Route.useSearch()`, `Route.useLoaderData()`, `Route.useRouteContext()`) — never their top-level equivalents from `@tanstack/react-router`
- Route config option order:
  1. `validateSearch`, `search`
  2. `loaderDeps`, `beforeLoad`, `loader`
  3. `shouldRevalidateLoader`, `gcTime`
  4. `onEnter`, `onStay`, `onLeave`, `onCatch`
  5. `head`, `meta`, `scripts`, `headers`
  6. `pendingMs`, `pendingMinMs`, `wrapInSuspense`
  7. `component`, `pendingComponent`, `errorComponent`, `notFoundComponent`

### Server Functions

- Loader data: always named `loadData` — uses `createServerFn()` (GET is default, never specify `{ method: 'GET' }`)
- Mutations: verb + resource — `createComment`, `destroyComment`, `batchCreateShiftAssignments` — uses `createServerFn({ method: 'POST' })`
- All server functions use `authenticated` middleware

### Search Params

Search params use **namespaced objects** that match the API contract 1:1 (`page`, `sort`, `filter`). Each route owns a namespace; parent routes retain child namespaces via middleware.

**Principles:**

1. **API-shaped params.** `page[number]=1&page[size]=25`, `sort[createdAt]=desc` — no mapping layer between URL and API.
2. **`retainSearchParams` for parent-owned params only.** Parent routes use `retainSearchParams` to keep their own params (e.g. `page`) through child navigations. Never use it to retain child namespaces — that creates context-leak bugs.
3. **`stripSearchParams` for defaults.** Every route strips its own defaults so the URL stays clean.
4. **Links control scope explicitly.** The `search` prop determines what survives navigation. Same-context links preserve with `(prev) => prev`. Context-change links pass only parent params.

**Route middleware pattern:**

```tsx
// Parent list route — retains filter params (page always resets to 1)
retainSearchParams(['status']);

// Child routes — only strip their own defaults
stripSearchParams(DEFAULTS);
```

**Navigation rules:**

| Navigation                               | `search` prop                             | Effect                                                   |
| ---------------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| Within same route (paginate, sort)       | `(prev) => ({ ...prev, rates: { ... } })` | Update own namespace                                     |
| Same context, sibling route (tab switch) | Strip `page` from all levels via helper   | Preserve non-default sibling state, reset all pagination |
| New context (different entity)           | `(prev) => ({ status: prev.status })`     | Keep parent filter, reset page and children              |

**Tab active state:** Use `pending: true` in `matchRoute` to prevent flash during loading:

```tsx
matchRoute({ to: '...', fuzzy: true }) ||
  matchRoute({ to: '...', fuzzy: true, pending: true });
```

### Mutations & Side Effects

- `router.invalidate()` must always be called with `{ sync: true }`: `await router.invalidate({ sync: true })`
- `toastQueue.add()` must always come **after** all async operations (API calls, invalidation) have completed — never before or in parallel with them

```tsx
// Good — toast after all async work
async function handleArchive() {
  await api.accounts.clients.archive({ accountId, id });
  await router.invalidate({ sync: true });
  toastQueue.add({ title: 'Arkiverad', variant: 'success' }, { timeout: 3000 });
}

// Bad — toast before invalidation completes
async function handleArchive() {
  await api.accounts.clients.archive({ accountId, id });
  toastQueue.add({ title: 'Arkiverad', variant: 'success' }, { timeout: 3000 });
  await router.invalidate();
}
```

### State

- Never use `useCallback` — define functions directly in the component body.
- Boolean state variables must use `is` or `has` prefix: `const [isOpen, setIsOpen] = useState(false)`, `const [hasError, setHasError] = useState(false)` — never `const [open, setOpen]` or `const [loading, setLoading]`.
- Refs must not be written to during render — use `useEffect` to update refs.
- Inside `useEffect`/`useLayoutEffect` callbacks, always use arrow functions — never `function` declarations: `const update = () => { ... }` not `function update() { ... }`
- Refs split in two by what they hold:
  - **DOM element refs** — root is always named `element`: `const element = useRef<HTMLDivElement>(null)`. Child element refs are named `[child]Element`: `const linkElement = useRef<HTMLAnchorElement>(null)`. Never suffix with `Ref` — use `activeElement` not `activeElementRef`.
  - **All other refs** (values, callbacks, timers, flags) — always suffix with `Ref`: `const delayRef = useRef(delay)`, `const onChangeRef = useRef(options.onChange)`, `const timerRef = useRef<number>(undefined)`, `const hasRevealedRef = useRef(false)`.
- The `$`-prefix is **reserved for ref extractions only** — values pulled from `.current` or `toValue(ref)`. It is the visual marker that says "this is the live value of a ref at this moment". Never use `$`-prefix for plain DOM lookups, return values, or any other variable. Examples: `const $element = element.current` ✓, `const $onChange = onChangeRef.current` ✓, `const $sampleElement = container.querySelector(...)` ✗ (no ref involved → no `$`).
- When consuming a ref's `.current` value more than once (or after a null-check), extract into a `$`-prefixed variable. If `.current` is used exactly once inline, leave it inline — the single-use rule wins.
- Extracted ref-variable names mirror the ref names exactly. **DOM element extractions always carry the `Element` suffix** (matching their refs): `const $element = element.current` for the root, `const $triggerElement = triggerElement.current` for a child element. Never strip the suffix at the extraction site (no `$trigger`, no `$attachment`, no `$first`).
- Plain DOM lookups (`document.getElementById`, `element.querySelector`, etc.) are **not** ref extractions, so they get **no `$`-prefix** — but they still carry the `Element` suffix when bound to a variable: `const sampleElement = $element.querySelector(...)`, `const targetElement = document.getElementById(id)`. The `Element` suffix is about what kind of value it is (a DOM node), not where it came from.
- Never extract a variable that is used exactly once. Inline the expression instead. The only exceptions: the name documents non-obvious intent, or the extraction is required by another rule (e.g. null-check before use).
- Values derived from the root element are named after what they return, not what they belong to — the root is implicit context: `const rect = getRect($element)`, not `const containerRect`. Child-derived values are prefixed with the child name: `const activeRect = getRect($activeElement)`, `const targetRect = getRect(targetElement)`.
- Always call `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `requestAnimationFrame`, `cancelAnimationFrame` on `window`: `window.setTimeout(...)`, `window.requestAnimationFrame(...)` — never bare.
- Timeout/interval refs are named `timeoutRef` / `intervalRef` and always typed `useRef<number>(undefined)` — never `useRef<ReturnType<typeof setTimeout>>`. `undefined` (not `null`) is the initial value because `window.clearTimeout` accepts `number | undefined` directly and avoids a null-guard at every call site. When multiple timeouts or intervals coexist in the same scope, prefix with what they control: `hideTimeoutRef`, `resetTimeoutRef`, `pollIntervalRef`.

## Component Naming Algorithm

The goal is **deterministic naming**: given the same UI description, two independent runs produce identical component names. No taste, no judgment beyond a small documented set of edge cases.

The algorithm has four mechanical steps. Each step uses closed vocabularies (Element suffix, Slot suffix) — if a UI piece doesn't fit, **extend the vocabulary in this file FIRST**, then code. Never invent names ad-hoc.

### Step 1: Component or inline?

A JSX block becomes a component **if and only if at least one trigger fires**. Size/length is **not** a trigger — never extract just because something is long.

```
☐ T1  Wraps <Outlet />
☐ T2  Rendered at 2+ call sites
☐ T3  Owns a defineTranslation
☐ T4  Owns hardcoded route links (to="...")
☐ T5  Owns its own hooks (useState, useEffect, useMutation, useDebouncedCallback, ...)
☐ T6  Branches on a domain enum (switch/if on a domain value)
☐ T7  Is a structural sub-region of a Layout or Detail (compound slot)
```

No triggers fire → **inline** in the route or parent component.

### Step 2: Classify

| Condition                                   | Classification     |
| ------------------------------------------- | ------------------ |
| T1 fires + master-detail / workspace shell  | LAYOUT             |
| T1 fires + instance shell                   | DETAIL             |
| T7 fires (structural slot, no domain logic) | COMPOUND SLOT      |
| Otherwise (any other trigger fired)         | DOMAIN COMPONENT   |

(For LAYOUT vs DETAIL details, see the *Layout vs domain name* section above.)

### Step 3: Pick suffix from a closed vocabulary

#### Element vocabulary (for DOMAIN COMPONENTS)

```
ROUTE SHELLS (wrap <Outlet />)
  Layout              — list-shell or workspace shell
  Detail              — instance shell

INSTANCE VIEWS (one specific resource, no collection)
  Summary             — <dl> of fields (read-only)
  Card                — bordered preview block
  Form                — input form (create/edit)

COLLECTION VIEWS (list/group of instances)
  Table               — <table>
  BrowseList          — <ul> of navigation links (one per instance)
  PickList            — <ul> of selectable rows (multi-select)
  List                — generic <ul>
  Row                 — single row (usually internal)

CHROME (action/navigation strips)
  Navigation          — set of route-links (tabs, side-nav)
  BulkActionsBar      — actions on multi-selection
  BrowseActionsBar    — actions in browse-mode (filter + edit toggle)
  ActionsBar          — generic actions strip

ATOMIC
  Badge               — status pill
  SearchInput         — wrapped search input
  Input               — wrapped generic input
  EmptyMessage        — empty state
  Avatar              — profile picture
```

#### Slot vocabulary (for COMPOUND SLOTS)

```
TOP-LEVEL Layout/Detail SLOTS
  Header              — top region (title, actions)
  Bar                 — generic horizontal slot below Header (tabs, filter, banner)
  Content             — main area (often holds the Outlet or domain content)
  Footer              — bottom region (pagination, sticky save)
  Sidebar             — side region (list, navigation)
  Main                — only at the outermost page layout where <main> is not yet used

SIDEBAR SUB-SLOTS (when Sidebar is itself compound)
  Header              — search/filter
  Content             — scroll area
  Footer              — pagination

HEADER SUB-SLOTS
  Title               — title cluster (h1 + optional badge)
```

### Step 4: Compose the name

- **Standalone domain component:** `[Resource][Element]`
  - Resource = singular domain noun matching the API resource (`Client`, `Employee`, `Account`, `Rate`).
  - Examples: `ClientSummary`, `ClientPickList`, `ClientBulkActionsBar`.
- **Compound slot:** `[Parent][Slot]`, accessed via dot notation.
  - Examples: `ClientDetail.Header`, `ClientLayout.Sidebar.Content`.
- **Layout/Detail:** `[Resource][Layout|Detail]`.
  - Examples: `ClientLayout`, `ClientDetail`, `AccountLayout`.

### Compound slot vs standalone — the test

A sub-component is `Parent.Slot` (compound) **if and only if it is a pure layout shell**:

- No `defineTranslation`
- No hardcoded `to=` route links
- No hooks
- No domain switch/if
- No domain data as prop (`client`, `employee`, ...)

If **any** of these are present → it's a standalone `ParentName` component (own folder).

### Vocabulary extension rule

If a UI piece doesn't match any Element or Slot in the vocabulary above, **stop**. Add the new entry to this file with a clear definition, then proceed. Never coin a suffix at the call site.

### Verification

Self-check: pick any extracted component in the codebase and run the algorithm on its description. The same name should fall out. If it doesn't, either the rules are wrong (escalate) or the component was named ad-hoc (rename).

### Where determinism still bends (~2% of cases)

- **Layout vs Detail boundary** — peer-vs-aspect for workspace shells. Documented above; needs domain judgment in rare cases.
- **Vocabulary gaps** — a genuinely new UI shape may need vocabulary extension. The rule keeps this controlled (extend first, code second).

Everything else is mechanical.

## Internationalization

All user-facing strings use `@skiftle/intl` via the app's `src/lib/intl.ts` config.

### App config

The app defines its locales once in `src/lib/intl.ts`. All components import from this file, never from `@skiftle/intl` directly:

```tsx
import { defineTranslation, useTranslation } from '../lib/intl';
```

### Translation placement

Translations live in the **same file** as the component, **below** the component function. The variable is always named `translation`:

```tsx
import { defineTranslation, useTranslation } from '../lib/intl';

export function ClientDetail(props: ClientDetailProps) {
  const { client } = props;
  const t = useTranslation(translation);

  return <dt>{t('type')}</dt>;
}

const translation = defineTranslation({
  en: { type: 'Type' },
  sv: { type: 'Typ' },
});
```

### Rules

- The `defineTranslation` variable is always named `translation`
- `translation` is placed **after** the component — component code comes first
- `useTranslation(translation)` is called at the top of the component body
- All locales defined in the app config are **required** — missing a locale is a TS error
- For server functions (outside React), use `createTranslator(translation, 'sv')` instead
- Shared translations (used by multiple components) live in a dedicated file and are imported

### Translation key conventions

Keys are **flat camelCase** strings following the pattern `{subject}{Component}{Prop}`:

- **subject** — what the element is about (domain name, action, etc.)
- **Component** — the UI component name (`Button`, `NumberField`, `DateField`, `Dialog`, etc.)
- **Prop** — the prop being translated (`Label`, `Content`, `Title`, `Message`, etc.)

Use `Content` for visible text (children). Use `Label` for `aria-label` (e.g. icon-only buttons).

```tsx
const translation = defineTranslation({
  en: {
    cancelButtonContent: 'Cancel',
    effectiveFromDateFieldLabel: 'From',
    hourlyRateCentsNumberFieldLabel: 'Hourly rate (cents)',
    removeEndDateButtonLabel: 'Remove end date',
    submitButtonContent: 'Save',
  },
  sv: {
    cancelButtonContent: 'Avbryt',
    effectiveFromDateFieldLabel: 'Från',
    hourlyRateCentsNumberFieldLabel: 'Timpris (öre)',
    removeEndDateButtonLabel: 'Ta bort slutdatum',
    submitButtonContent: 'Spara',
  },
});

t('hourlyRateCentsNumberFieldLabel');
t('submitButtonContent');
```

### Translation key conventions for mutations

Every mutation uses **nested objects** for confirm dialogs and toasts. The branch name under each top-level namespace **matches the mutation variable name without the `Mutation` suffix** — see Mutations below.

| Top-level namespace | Sub-keys                       | Used by                            |
| ------------------- | ------------------------------ | ---------------------------------- |
| `confirm`           | `title`, `message`             | `confirm({ title, message, ... })` |
| `toast`             | `success.title`, `error.title` | success/error toasts               |

For a mutation `deleteRateMutation`, the keys are:

```
confirm.deleteRate.title
confirm.deleteRate.message
toast.deleteRate.success.title
toast.deleteRate.error.title
```

For a bulk variant `bulkDeleteRateMutation`:

```
confirm.bulkDeleteRate.title
confirm.bulkDeleteRate.message
toast.bulkDeleteRate.success.title
toast.bulkDeleteRate.error.title
```

Only include the keys a mutation actually uses. A mutation without a confirm step has no `confirm.*` keys; a quick edit without a toast has no `toast.*` keys.

## Mutations

All API mutations (POST, PUT, PATCH, DELETE) use the `useMutation` hook from `#hooks/useMutation`. The hook handles `isPending`, surfaces success/error to callbacks, and globally redirects to `/logout` on 401.

### Placement

**Mutations always live in the route's `Component` function — never in domain components.** No exceptions.

Domain components stay "dumb": they take callbacks as props (`onArchive`, `onDelete`, `onSubmit`) and invoke them on user interaction. The route owns `useMutation`, `useConfirm`, and `useToast`, defines `handleX` functions, and passes them into the components that trigger them.

This keeps domain components reusable and free of side effects, and makes the route the single source of truth for everything that happens on user action — data fetching, mutations, navigation, toasts.

```tsx
// Good — route owns the mutation, component is dumb
function Component() {
  const deleteClientMutation = useMutation(...);

  function handleDelete(client: Client) {
    confirm({ ..., onOk: () => deleteClientMutation.mutate(client) });
  }

  return <ClientTable clients={clients} onDelete={handleDelete} />;
}

// Bad — mutation inside the domain component
export function ClientTable(props: ClientTableProps) {
  const deleteClientMutation = useMutation(...); // ✗ never
  // ...
}
```

### Hook signature

```ts
useMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  options?: {
    onSuccess?: (result: TResult, input: TInput) => Promise<void> | void;
    onError?: (error: unknown, input: TInput) => Promise<void> | void;
  },
): { mutate: (input: TInput) => Promise<void>; isPending: boolean }
```

`isPending` stays `true` until both `mutationFn` AND any `onSuccess`/`onError` callback have resolved. UI loading states are correct without extra coordination.

### Naming convention

- **Always suffix with `Mutation`**: `deleteRateMutation`, not `deleteRate`
- **Always include the resource**, even if the route context implies it: `deleteRateMutation`, not `deleteMutation`
- **Format:** `<verb><Resource>Mutation`
- **Bulk variants:** `bulk` prefix → `bulkDeleteRateMutation`
- **One mutation per use:** never reuse a mutation hook for two different actions

```ts
const deleteRateMutation = useMutation(...);
const createRateMutation = useMutation(...);
const bulkDeleteRateMutation = useMutation(...);
const archiveClientMutation = useMutation(...);
const publishShiftMutation = useMutation(...);
```

### Standard mutation pattern

`onSuccess` invalidates the router and shows a success toast. `onError` shows an error toast. The hook handles 401 internally — never check for it in `onError`.

```tsx
const deleteRateMutation = useMutation(
  (rate: Rate) =>
    api.accounts.rates.destroy({ accountId, id: rate.id }),
  {
    async onSuccess() {
      await router.invalidate({ sync: true });
      toast(
        { title: t('toast.deleteRate.success.title'), variant: 'success' },
        { timeout: 3000 },
      );
    },
    onError() {
      toast(
        { title: t('toast.deleteRate.error.title'), variant: 'error' },
        { timeout: 5000 },
      );
    },
  },
);
```

### Confirmation for destructive and critical actions

Destructive (delete, destroy) and critical (archive, deactivate, publish) mutations are wrapped in a `confirm({ ... })` call inside a thin `handleX` function. The mutation runs in the `onOk` callback. `useConfirm`'s `isBusy` automatically tracks the `onOk` promise and shows loading on the OK button.

- **Destructive (delete, destroy):** `confirm({ danger: true, ... })`
- **Critical but reversible (archive, deactivate, unpublish):** `confirm({ ... })` without `danger`
- **Routine edits (update, save form):** no confirm — call `mutation.mutate()` directly

```tsx
function handleRateTableDelete(rate: Rate) {
  confirm({
    danger: true,
    title: t('confirm.deleteRate.title'),
    message: t('confirm.deleteRate.message'),
    onOk: () => deleteRateMutation.mutate(rate),
  });
}
```

For bulk variants, the confirm message uses interpolation:

```tsx
function handleRateTableBulkDelete(rates: Rate[]) {
  confirm({
    danger: true,
    title: t('confirm.bulkDeleteRate.title'),
    message: t('confirm.bulkDeleteRate.message', { count: String(rates.length) }),
    onOk: () => bulkDeleteRateMutation.mutate(rates),
  });
}
```

### Validation errors (sorbus `catch`)

For mutations that may return validation errors (e.g. 422 on form submit), opt into sorbus's `catch` option in the `mutationFn`. The endpoint then resolves with a discriminated `Result` instead of throwing, and `onSuccess` branches on `result.ok`:

```tsx
const createRateMutation = useMutation(
  (input: CreateRateInput) =>
    api.accounts.rates.create(
      { accountId, rate: input },
      { catch: [422] },
    ),
  {
    async onSuccess(result) {
      if (!result.ok) {
        setFieldErrors(result.data.issues);
        return;
      }
      await router.invalidate({ sync: true });
      toast(
        { title: t('toast.createRate.success.title'), variant: 'success' },
        { timeout: 3000 },
      );
    },
    onError() {
      toast(
        { title: t('toast.createRate.error.title'), variant: 'error' },
        { timeout: 5000 },
      );
    },
  },
);
```

Use this pattern for forms; use plain throw-based mutations for destructive actions where 422 is not expected.

## Forms

All input forms (create/edit) use the same pattern. **There is no other way.** Look at `RateForm` + `RateFormDialog` (dialog-based) and `ClientForm` (page-based) as canonical references.

### State ownership — always in the route

The route's `Component` function owns three pieces of state:

```tsx
// 1. Draft — persistent in-progress edit
const draft = useDraft(
  `client-update:${clientId}`,                       // create: 'client-create'
  build(ClientUpdatePayloadSchema, client),          // create: build(SchemaCreate, defaults)
);

// 2. Mutation — opt into 422 catching for validation
const updateClientMutation = useMutation(
  (payload: ClientUpdatePayload) =>
    api.accounts.clients.update({ accountId, client: payload, id: clientId }),
  {
    async onSuccess() {
      draft.clear();
      await router.invalidate({ sync: true });
      await navigate({ ... });
      toast({ title: t('toast.updateClient.success.title'), variant: 'success' }, { timeout: 3000 });
    },
    onError() {
      toast({ title: t('toast.updateClient.error.title'), variant: 'error' }, { timeout: 5000 });
    },
  },
);

// 3. Form — wires draft → form, form → mutation, mutation errors → form
const form = useForm<ClientCreatePayload | ClientUpdatePayload>(draft.value, {
  defaultValues: draft.initialValue,
  onChange: draft.save,
  onReset: draft.clear,
  onSubmit: updateClientMutation.mutate,
  validationErrors: updateClientMutation.validationErrors,
});
```

The `useForm` payload type is **always the union of Create and Update** payloads (`ClientCreatePayload | ClientUpdatePayload`), so the same form component is reusable across both routes.

### Form component — bound via a single `form` prop

The domain form component (e.g. `ClientForm`, `RateForm`) is "dumb" UI:

```tsx
export interface ClientFormProps extends Omit<FormProps, 'form' | 'onSubmit'> {
  form: UseFormReturn<ClientPayload>;
  onCancel: () => void;
  title: string;
}

export function ClientForm(props: ClientFormProps): ReactElement {
  const { form, onCancel, title, ...restProps } = props;
  // ...
  return (
    <Form {...restProps} className={styles.ClientForm} form={form}>
      {/* Header (title + cancel/submit) */}
      <Field field={form.fields.name} label={t('nameTextFieldLabel')}>
        {(props) => <Input {...props} />}
      </Field>
      {/* ... more fields ... */}
    </Form>
  );
}
```

Rules:
- **Always extends `Omit<FormProps, 'form' | 'onSubmit'>`** — so it accepts arbitrary HTML form attributes (id, etc.) but the form binding goes through `form` prop.
- **Wraps content in `<Form form={form}>`** from `#lib/form` — never `@skiftle/form` or the raw `<form>` element.
- **Each field uses `<Field field={form.fields.X}>`** from `#lib/form` — never wires value/errors/onChange manually.
- **Imports `useForm`, `UseFormReturn`, `Field`, `Form` from `#lib/form`** — never from `@skiftle/form` directly.
- **Cancel/submit button labels live inside the form component** as constants (`cancelButtonContent`, `submitButtonContent`) — they're stable per resource.
- **Title is a prop** (varies per route: "New X" vs "Edit X") with interpolation in the route's translation.

### Page-form vs dialog-form

| Form is opened as... | Component shape                                                                                                          | Example                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| Full page route      | `*Form` is the **whole page** (header + actions + fields). If header buttons sit alongside `<Form>`, use `form={formId}` | `ClientForm`                  |
| Dialog               | `*Form` is **just the fields**; `*FormDialog` wraps it. Submit button in `Dialog.Footer` connects via `form={formId}`    | `RateForm` + `RateFormDialog` |

The choice is driven by where the form appears (page route vs dialog), not by taste.

### Submit button placement

The submit button can live **inside or outside** the `<Form>` element — choose based on layout structure:

- **Inside `<Form>`** (default) — when the submit button is a natural child of the form's layout. Standard `type="submit"` works.
- **Outside `<Form>`, connected via `form={formId}`** — only when the chrome forces a sibling structure: a `Dialog.Footer` that wraps the form, or a page header where the submit button sits alongside the form (not inside it). Pass `formId` from `useId()` to both `<Form id={formId}>` and the submit button's `form={formId}` attribute.

The driver is **layout**, not preference. If you can put the submit button inside `<Form>` without breaking the layout, do that — fewer props to wire, no `useId` needed.

### Translation keys

- **Field labels:** `[fieldName][Element]Label` — e.g. `nameTextFieldLabel`, `hourlyRateCentsNumberFieldLabel`, `effectiveFromDateFieldLabel`. Element is the input type.
- **Form-component buttons:** `cancelButtonContent`, `submitButtonContent`, `resetButtonContent`.
- **Route-side titles:** `newTitle`, `editTitle: 'Edit {name}'` — with interpolation.
- **Route-side toasts:** `toast.[verb][Resource].success.title`, `toast.[verb][Resource].error.title`.

### Validation errors

`validationErrors: mutation.validationErrors` flows from the mutation into `useForm`. The `<Form>` and `<Field>` components from `#lib/form` automatically display them. The mutation must opt into sorbus's `catch: [422]` (see *Mutations § Validation errors*).

## Extending component props

Always extend the underlying component's prop type (`BoxProps`, `PickListProps`, `LinkBaseProps`, etc.). **Never re-declare props that are already inherited** — most HTML attributes (`aria-*`, `role`, `id`, `className`, `style`, etc.) live on `BoxProps` already and propagate through every component that extends it.

```ts
// ✗ Don't — re-declaring aria-label which BoxProps already has
type MyComponentProps = Omit<PickListProps, 'aria-label' | 'children'> & {
  'aria-label'?: string;
  // ...
};

// ✓ Do — inherit from the underlying component
type MyComponentProps = Omit<PickListProps, 'children'> & {
  // ...
};
```

If you find yourself wanting to make an inherited prop required at your layer, **don't**. The contract belongs to the leaf component (typically Box/HTML element). Re-declaring is noise.

## Type modifiers

Never use the TypeScript `readonly` modifier. Not in interfaces, not in array types (`readonly T[]`), not on class properties. If a value comes from outside and shouldn't be mutated, that's enforced by code review and discipline — not by the type system.

```ts
// ✗ Don't
selection: readonly string[];
items: readonly Item[];

// ✓ Do
selection: string[];
items: Item[];
```

## Control Flow

- Never put `if`-then statements on a single line. Always use braces and a newline:

```tsx
// Bad
if (!item) throw new Error('not found');
if (!param) return null;
if (value === 'true') return true;

// Good
if (!item) {
  throw new Error('not found');
}
if (!param) {
  return null;
}
if (value === 'true') {
  return true;
}
```

## Object Formatting

Always expand object literals to one property per line. Never inline multiple properties or nest objects on a single line:

```tsx
// Good
const { client } = await api.accounts.clients.show({
  accountId,
  id: clientId,
});

toastQueue.add(
  {
    title: 'Arkiverad',
    variant: 'success',
  },
  { timeout: 3000 },
);

// Bad
const { client } = await api.accounts.clients.show({ accountId, id: clientId });
toastQueue.add({ title: 'Arkiverad', variant: 'success' }, { timeout: 3000 });
```

Exception: single-property objects used as options may stay inline when they are a well-known pattern: `{ sync: true }`, `{ timeout: 3000 }`, `{ replace: true }`.

## CSS Modules

All styling uses CSS Modules with CSS custom properties from the design token system (`@skiftle/ui/styles`).

### File placement

- **Components** (`packages/ui/`, `apps/*/src/components/`): `ComponentName.module.css` next to `ComponentName.tsx`
- **Routes** (`apps/*/src/routes/`): `route.module.css` next to `route.tsx`

### Import

```tsx
import styles from './route.module.css';
// or
import styles from './Button.module.css';
```

### Class naming

All element classes use **PascalCase**. Every child class is prefixed with its parent's full name. Nesting mirrors the HTML structure:

```css
@layer components {
  .Route {
    display: flex;
    height: 100%;

    .Sidebar {
      display: flex;
      flex-direction: column;
      width: 320px;

      .SidebarHeader {
        padding: var(--spacing-4);

        .SidebarHeaderToolbar {
          display: flex;
          justify-content: space-between;
        }
      }

      .SidebarList {
        flex: 1;
        overflow-y: auto;
      }
    }

    .Content {
      flex: 1;
    }
  }
}
```

- Routes use `.Route` as the root class
- Components use the component name as the root class: `.Button`, `.Dialog`, `.Checkbox`
- Modifiers (rare — prefer data attributes) use camelCase

### Deterministic class-naming algorithm

**The one rule:** every class name ends with an ElementType from the fixed vocabulary below. The only exception is the component root, which is the component name.

No creativity, no judgement, no "semantic" names. Same input always produces the same name.

```
CLASS NAME = [Role]ElementType
             └─optional┘└─required, from fixed vocab─┘
```

#### Fixed ElementType vocabulary

Every class name must end with one of these. Nothing else is valid.

**Group / layout** (element wraps ≥2 children):
- `Row` — flex-direction: row
- `Stack` — flex-direction: column
- `Grid` — display: grid
- `List` — `<ul>` / `<ol>` (semantic list)
- `DescriptionList` — `<dl>` (key/value pairs, e.g. resource summaries)
- `Term` — `<dt>` (label half of a `<dl>` pair)
- `Description` — `<dd>` (value half of a `<dl>` pair)

**HTML5 landmarks** (element IS a landmark region). These come in two **layout trios** — pick one per container, don't mix:

**Vertical trio** (stacked top-to-bottom):
- `Header` — `as="header"`
- `Content` — default `<div>`, or `as="section"` if the region needs a landmark
- `Footer` — `as="footer"`

**Horizontal trio** (side-by-side):
- `Sidebar` — `as="aside"` — used only when there is exactly ONE sidebar
- `Main` / `Content` — the partner of `Sidebar`. **Pick based on whether `<main>` is already used higher in the tree:**
  - **`Main`** — `as="main"` — only at the **outermost page layout** where no `<main>` exists yet. There is **exactly one `<main>` per page**, ever. If a parent route already renders `<main>`, you may NOT use `Main` again.
  - **`Content`** — default `<div>` — when `<main>` is already taken by a parent layout. This is the common case for nested layouts (master-detail inside a `_main` route, etc.).
- `StartBar` / `EndBar` — `as="aside"` — used when there are TWO sidebars (replaces `Sidebar`)

**Other landmarks** (standalone):
- `Nav` — `as="nav"`
- `Section` — `as="section"`
- `Article` — `as="article"`

Each landmark name appears max once per component. `StartBar` and `EndBar` count as separate names.

**Text content:**
- `Heading` — `<Heading>` component (any level)
- `Paragraph` — `<Paragraph>` component / `<p>`
- `Text` — `<Text>` component / `<span>` / plain text in `<Box>`
- `Code` — `<code>`
- `Label` — `<Label>` / `<label>`

**Interactive:**
- `Link` — `<Link>` / `<a>`
- `Button` — `<Button>` / `<button>`

**Form:**
- `Input` — `<Input>` / `<input>`
- `Textarea` — `<Textarea>` / `<textarea>`
- `Select` — `<Select>` / `<select>`
- `Form` — `<form>`
- `Fieldset` — `<fieldset>`

**Media:**
- `Icon` — `<Icon>` / icon-role `<svg>`
- `Image` — `<Image>` / `<img>`

**Indicators / primitives:**
- `Badge` — `<Badge>` (canonical for Chip/Tag/Pill)
- `Divider` — `<Divider>` / `<hr>`
- `Chevron` — chevron icon
- `Arrow` — arrow icon
- `Dot` — dot indicator
- `Spacer` — spacer element

**List items:**
- `Item` — `<li>`
- `Option` — `<Option>` (e.g. `OptionList.Option`, `<option>`)

**Table cells:**
- `Cell` — `<td>`
- `HeaderCell` — `<th>`

If the element you need doesn't fit any of these, the vocabulary needs expanding — discuss and extend the list. Never invent a suffix ad-hoc.

#### Picking the Role (prefix)

Role is picked by strict priority — stop at the first match:

1. **Data field** — if rendering a named data field, Role = PascalCase field name
   - `{action.description}` → Role `Description`
   - `{user.firstName}` → Role `FirstName`
2. **Domain concept** — if the element represents a named domain concept, Role = that concept
   - MethodBadge + Path together = `Endpoint` (REST term)
   - A form's submit area = `Submit`
3. **Qualifier** from fixed vocab — when multiple siblings share an ElementType:
   - Position: `Leading` / `Trailing` (horizontal), `Top` / `Bottom` (vertical)
   - Importance: `Primary` / `Secondary`
   - Function: `Search`, `Submit`, `Cancel`, `Confirm`, `Close`, `Empty`
4. **No role** — only when the element has no semantic role AND there is only one such element in its parent:
   - Disclosure chevron → `Chevron`
   - Lone header region → `Header`

#### Examples

```
.ActionBanner              // root (component name)
.EndpointRow               // role: Endpoint, type: Row (flex-row)
.PathCode                  // role: Path, type: Code (<code>)
.PrefixText                // role: Prefix, type: Text (<span>)
.SummaryParagraph          // role: Summary, type: Paragraph
.DescriptionParagraph      // role: Description, type: Paragraph
.DeprecatedBadge           // role: Deprecated, type: Badge
.Header                    // no role (only one), type: Header (landmark)
.SearchIcon                // role: Search, type: Icon
.SearchInput               // role: Search, type: Input
.EmptyParagraph            // role: Empty, type: Paragraph
.Chevron                   // no role (lone decoration), type: Chevron
```

#### Wrapper form (special)

A wrapper is an element with exactly one child, existing only for layout/positioning. Its class name is `[ChildClassName]Wrapper`:

- Wraps `.SearchIcon` → `.SearchIconWrapper`
- Wraps `.DeprecatedBadge` → `.DeprecatedBadgeWrapper`

(`Wrapper` IS an ElementType in this case — it's a concatenated form.)

Never create chained wrappers. If a layout property (`align-self`, `justify-self`) can go on the child directly, the wrapper must not exist.

#### Root form (only exception)

The component's root class is just the component name (no Role, no ElementType suffix):
- `.ActionBanner`, `.SearchModal`, `.Dialog`, `.Route`.

#### Forbidden

- Any class name that does NOT end with a vocabulary ElementType:
  - `.Description` ✗ (must be `.DescriptionParagraph`)
  - `.Endpoint` ✗ (must be `.EndpointRow` or similar)
  - `.Title` ✗ (must be `.NameHeading`, `.PageHeading`, etc.)
  - `.Name` ✗ (must be `.NameHeading` or `.NameText`)
  - `.Content` ✗ (must be `.ContentSection` or — more likely — the structure is wrong, extract a sub-component)
- Semantic group names without ElementType: `.Actions`, `.Meta`, `.Info`, `.Details`, `.Body`.
- Fantasy suffixes not in vocab: `.Container`, `.Inner`, `.Outer`, `.Group`, `.Block`, `.Panel`, `.Holder`.

If no rule matches unambiguously, the structure is wrong, not the name. Fix the structure (usually: make the parent flex/grid, or extract a sub-component).

### State selectors

- **Root states go on the component root class only** — never on a child. This covers `data-*`, `aria-*`, `:has()`, `:not()`, and any other state that describes the component's overall status. Child styling under a root state is done by nesting child selectors inside the state block on root.
- **Pseudo-class states on interactive leaf elements stay on the element.** `:hover`, `:focus`, `:focus-visible`, `:active`, `:disabled`, `:checked` on `Button`, `Link`, `Input`, `Textarea`, `Select`, `Option`, and other interactive primitives are states that belong to that element itself (it's what receives focus/hover). Don't hoist them to root.
- **Pseudo-element selectors (`::placeholder`, `::before`, `::after`, etc.) stay on the element** — they target the element's own pseudo-element.
- **State blocks come last** in a rule — after own properties and all child selectors.

### CSS rules

- All component/route CSS is wrapped in `@layer components`
- Use design tokens (`var(--spacing-2)`, `var(--border)`, `var(--intent-danger)`) — never hardcoded values
- **Never reset element defaults.** Kit has a global reset (`@layer reset`) that strips browser defaults — `<ul>` has no list-style/padding/margin, `<button>` has no default styling, etc. Don't write `padding: 0`, `margin: 0`, `list-style: none`, `border: 0`, `outline: 0`, `background: none`, etc. on individual components — those defaults are already gone. If you find yourself zeroing a property, that's a sign the global reset already handled it.
- **Never write vendor prefixes.** Build pipeline uses Lightning CSS, which auto-prefixes based on browserslist targets. Write the standard property only (`user-select: none`) — Lightning CSS adds `-webkit-*` / `-moz-*` / `-ms-*` variants if the targets need them. Manual prefixes are dead code and out of sync with build output.
- **Primitives (`*Base` components) have no `.module.css` files.** They are headless by design — consumers control all visual styling. Behavior-related rules (`user-select`, `cursor`, `pointer-events`) go inline via the `style` prop merged through `mergeProps`. Visual styling lives in the styled component one level up (`Button` for `ButtonBase`, `Checkbox` for `CheckboxBase`, etc.).
- **Never use `margin`.** Always use `flex` + `gap` or `grid` + `gap` for spacing between elements. No exceptions — if you reach for `margin-top`/`margin-bottom`/`margin-inline`, restructure the parent into a flex/grid container. Need different gaps between groups? Wrap the tighter group in a sub-container with its own gap.
- **Always use the `flex` shorthand** — never `flex-grow` or `flex-shrink` alone. Write `flex: 1`, `flex: 0 0 auto`, `flex: none`, etc.
- **Never leave unnecessary properties.** Every property must pay for itself in the specific context. Common dead properties to prune: `display: inline-block` on a flex/grid item (flex overrides it), `width: 100%` on a block element that already fills its container, redundant `color` that matches the inherited value, `margin: 0` on an element that has no default margin, `overflow: hidden` when nothing overflows, duplicate properties across sibling rules that could be merged.
- Use `background-color` — never the `background` shorthand (unless setting multiple background properties)
- Nesting is for structure and state — child elements are nested, pseudo-classes/data-attributes are nested

### CSS selector order

Within a selector block:

1. Own properties
2. Child element selectors
3. Pseudo-classes and state modifiers (`&:hover`, `&[data-*]`)

```css
.sidebar {
  display: flex;
  border-right: var(--border);

  .sidebar-header { ... }
  .sidebar-list { ... }

  &[data-collapsed] { ... }
}
```

### State and variant styling

Use data attributes on the **root element** of a component for state and variants. Child elements are styled via parent nesting — they never carry data attributes themselves:

```css
/* Good — data attribute on root, children styled via nesting */
.Button {
  background-color: var(--surface-bevel);

  .ButtonIcon {
    color: var(--text-secondary);
  }

  &[data-appearance='solid'] {
    background-color: var(--intent-primary);

    .ButtonIcon {
      color: var(--intent-primary-contrast);
    }
  }

  &[data-disabled] {
    opacity: 0.5;
  }
}

/* Bad — data attribute on child */
.Button {
  .ButtonIcon {
    &[data-appearance='solid'] { ... }
  }
}
```

This applies to components that have variant-like behavior (appearance, size, state). Route files rarely need data attributes — if a route element needs variants, it should be extracted into a component.

### Never flatten nested selectors

Always open a new nested block for each state/variant — never chain state and descendant in one selector. The state block wraps the child, the child is nested inside.

```css
/* Good — nested */
.Root {
  &[data-item-type='action'] {
    .TypeBadge {
      background-color: var(--color-blue-100);
    }
  }
}

/* Bad — flattened chain */
.Root {
  &[data-item-type='action'] .TypeBadge {
    background-color: var(--color-blue-100);
  }
}
```

Same rule for pseudo-classes combined with descendants:

```css
/* Good */
.Root {
  &:hover {
    .Icon { color: var(--intent-primary); }
  }
}

/* Bad */
.Root {
  &:hover .Icon { color: var(--intent-primary); }
}
```

## Library packages

Packages under `packages/*` that consumers import (kit packages — ui, core, form, intl, cookie, symbol, etc.) extend `@skiftle/typescript-config/library`. That config sets `isolatedDeclarations: true`, which **requires explicit return types** on every exported function or component.

```ts
// ✓ Required in library packages
export function useThing(options: Options): UseThingReturn {
  // ...
}

// ✗ Inference-only — TS error in library packages
export function useThing(options: Options) {
  // ...
}
```

The rule exists to keep public API surfaces stable: explicit return types are the contract; implementation changes can't accidentally widen or narrow the type. `apps/` and internal-only packages don't extend `library` — inference is fine there.

When in doubt: if the package's `tsconfig.json` extends `@skiftle/typescript-config/library`, every exported function and component needs an explicit return type.

## package.json conventions

Biome's `useSortedKeys` is disabled for `package.json` files (via `@skiftle/biome-config`). Alphabetical sorting breaks Node's exports resolution — conditions are checked in key order, first match wins. Sorting alphabetically can silently resolve to the wrong file.

### Top-level field order

Follow `sort-package-json`'s canonical order. Pragmatic subset:

```
name, version, private, description, keywords, homepage, bugs,
repository, license, author, type, imports, exports, main, types,
sideEffects, files, bin, scripts, dependencies, devDependencies,
peerDependencies, peerDependenciesMeta, optionalDependencies,
engines, packageManager, publishConfig, pnpm, workspaces
```

### `exports` condition order

Hard rules:
- `"types"` MUST be first (TypeScript stops at first match)
- `"default"` MUST be last (Node resolver fallback)
- `"source"` / `"development"` BEFORE `"import"` / `"require"` (bundlers pick these up first for unbundled dev)

Full canonical order: `types`, `source`, `development`, `browser`, `node`, `import`, `require`, `default`.

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "source": "./src/index.ts",
      "development": "./src/index.ts",
      "browser": "./dist/browser.js",
      "node": "./dist/node.js",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  }
}
```

Include only conditions a package needs; keep the relative order regardless of which subset is present.

### Sub-path export keys

`"."` first, rest alphabetical.

### Nested objects

Alphabetical — `scripts`, `dependencies` (and variants), `files`, `keywords`, `engines`, `pnpm.overrides`.

## Working with the user

These rules govern *when to act vs. when to stop and ask*. They override the default impulse to keep producing.

### Stop signals

The moment any of these appear, **stop and report — do not work around them**:

- A circular dependency between two hooks/components ("A needs B, B needs A")
- A `useEffect` whose only job is to keep a ref synced with a value
- An `as unknown as` or other type assertion to make something compile
- A "fallback" or default that exists because two call sites disagree on what's required
- A bridge layer that converts the same data back and forth (`Set` → array → `Set`)
- The thought "this is fine, the consumer can opt out via..."

These are signals that the *design* is wrong, not that you need a cleverer workaround. Refs+effects to break circles are not a fix — they are evidence the relationship was wrong from the start.

### Defaults and optional props

- **Never add a default value or optional prop the user didn't ask for.** No `autoFocus = true`, no `'aria-label' = 'Options'`, no `?? true` to allow opting out.
- If a prop should exist, it's explicit and required. If it shouldn't, it doesn't exist.
- When tempted to write `?? defaultValue`, ask: should this prop exist at all? If yes — is it required? If no — delete it.

### Composition layers

- Respect the layering the user has stated. If the architecture is `A → B → C`, do not let `A` reach into `C` directly to "save a layer". The intermediate layer exists for a reason; bypassing it is a design change disguised as an implementation detail.

### "Kör" / "go ahead" scope

- "Kör" means: do the *specific* thing we just discussed, then stop and report. Not the next three things you can foresee.
- After completing a single instruction, return to the user before proceeding. Do not chain forward.

### Ambiguity

- If two reasonable interpretations of the user's instruction exist, ask. Do not pick.
- "Vague enough that I'm guessing" = stop.
- A 30-second clarifying question is cheaper than a 30-minute refactor that gets rolled back.

### Production cadence

- Producing code is not the goal. Building the right thing is.
- It is correct and expected to spend a turn saying "this design is wrong, here is why, what do you want to do?" — that is work, not stalling.
