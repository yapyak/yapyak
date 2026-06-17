## React

### Components

- Props type is an exported `type` in the same file: `export type ComponentNameProps = { ... }`. Always `type` for React props — non-Props object shapes (Options, Config, Context) follow the default in [[base]] § Object shapes.
- Props are destructured on the first line of the function body, not in the signature.
- **Blank line between destructuring and the rest of the function body.**
- Defaults are set in the destructuring assignment.
- `...restProps` is spread onto the root element when wrapping a native or base element — and is spread **FIRST**, then explicit overrides come after.

**Exception:** Use `interface` for Props only when declaration merging is required (rare — third-party module augmentation).

```tsx
export type ButtonProps = {
  className?: string;
  isDisabled?: boolean;
};

export function Button(props: ButtonProps) {
  const { className, isDisabled, ...restProps } = props;

  return (
    <button
      {...restProps}
      className={["Button", className].filter(Boolean).join(" ")}
      disabled={isDisabled}
    />
  );
}
```

### File structure

Every component lives in its own folder. The folder contains everything that belongs to the component: the component itself, sub-components, peer-exports, CSS modules, tests, hooks, context, and utilities.

```
components/
  button/
    button.tsx
    button.module.css
    button.test.tsx
    button-group.tsx
    button-group.module.css
    button-group-context.ts
    use-button.ts
    use-button-state.ts
    index.ts
  dialog/
    dialog.tsx
    dialog.module.css
    dialog-trigger.tsx
    dialog-content.tsx
    dialog-footer.tsx
    dialog-context.ts
    use-dialog.ts
    use-dialog-trigger.ts
    index.ts
  divider/
    divider.tsx
    divider.module.css
    index.ts
```

#### File naming

Folder name = primary component name (kebab-case). Primary component file = `<folder-name>.tsx`. Sibling files inside the folder are prefix-flat — every filename starts with the folder name.

```
button/                            ← Button
  button.tsx                       → Button
  button-group.tsx                 → ButtonGroup
  button-group-context.ts          → ButtonGroupContext
  use-button.ts                    → useButton
```

File name (kebab) matches the exported symbol (Pascal/camel) by spelling. Deep nesting accretes the prefix:

```
grid/
  grid.tsx                         → Grid
  grid-body.tsx                    → GridBody
  grid-body-row.tsx                → GridBodyRow
  grid-body-row-cell.tsx           → GridBodyRowCell
```

No sub-folders inside a component folder. Everything flat.

#### `index.ts` barrel

`index.ts` is the public entry. Re-exports types and values separately, each block alphabetized:

```ts
export type { ButtonProps } from "./button";
export type { ButtonGroupProps } from "./button-group";

export { Button } from "./button";
export { ButtonGroup } from "./button-group";
```

Consumers import via the folder: `import { Button, ButtonGroup } from '#components/button'`.

#### CSS class names

Root class equals the component name (`.Button`, `.DialogTrigger`).

#### Single-component folders

Components with no internals still get their own folder:

```
divider/
  divider.tsx
  divider.module.css
  index.ts
```

The folder is consistent regardless of complexity.

### Forbidden: plural component names

**Never** `locales.tsx`, `examples.tsx`, `items.tsx`, `tabs.tsx`. Always singular noun + element-type suffix from the CSS Modules ElementType vocabulary: `LocaleStack`, `ExampleSection`, `ItemRow`, `TabBar`.

The plural is encoded in the element type (`List`, `Stack`, `Section`, `Grid`), not the noun.

```
✗ locales.tsx          → Locales         (plural, missing element)
✓ locale-stack.tsx     → LocaleStack     (singular + Stack — renders as <div> flex column)

✗ examples.tsx         → Examples
✓ example-section.tsx  → ExampleSection  (singular + Section)
```

**`List` is reserved for `<ul>` / `<ol>` elements only.** If the element renders as a `<div>` with `flex-direction: column`, it's a `Stack`. If it's a `<section>` with a heading and body, it's a `Section`. Match the suffix to the actual DOM.

### Component suffix matches its root element

A component's name ends with the name of its root JSX element: `SortIcon` renders `<Icon>`, `RateRow` renders `<tr>` via Box, `ClientPickList` renders `<ul>` via Box.

```
✗ ActivityCard    → renders <Box as="li">    → ActivityListItem
```

**Exception:** components whose root is `*Base`, `Box`, or `Icon`. These primitives have no opinion on the suffix; components built on them pick the suffix from the role they play (`Stack`, `Section`, `Chevron`, etc.).

### Component architecture

- **Domain components** (tables, forms, cards) live in `components/`, take props, and do one thing.
- **Components never use route-data hooks** (e.g. `useLoaderData()`, `getRouteApi()` in TanStack apps). All data comes through props.
- **Types for props come from the API contract** (sorbus, generated types, etc.) — never invented domain types in components.
- **The route file's `Component` function is the page** — it calls route-data hooks, composes domain components, and adds page-level markup (headings, layout). Domain components stay dumb.

```tsx
// ✓ Right — route IS the page, composes domain components
export const Route = createFileRoute('...')({
  component: Component,
  async loader({ context, params }) {
    const { clients } = await context.api.accounts.clients.index({ ... });
    return { clients };
  },
});

function Component() {
  const { clients } = Route.useLoaderData();
  return (
    <div>
      <h1>Kunder</h1>
      <ClientTable clients={clients} />
    </div>
  );
}
```

### Domain naming

- **Singular resource** in component names: `ClientTable`, `EmployeeCard` — never `ClientsTable`.
- **Domain components named `[Resource][Element]`**: `ClientTable`, `EmployeeCard`, `AccountNavigation`.
- **No "Page" components** — the route `Component` function handles page layout directly.
- **Dispatcher components:** when a "base" component renders a different sub-component based on a type/variant (discriminated union), name the variants `[Parent][Variant]` — not `[Parent][Element]`. Example: `ActivityItem` dispatches to `ActivityItemComment` and `ActivityItemEvent` based on `activitableType`.

### Layout vs domain name

Pick the suffix based on what the component's top-level navigation chrome lets the user switch between:

| Chrome switches between                                        | Suffix                                          |
| -------------------------------------------------------------- | ----------------------------------------------- |
| Different **instances** (master-detail list)                   | `*Layout`                                       |
| Different **peer domains** (Clients vs Employees vs Billing)   | `*Layout`                                       |
| Different **aspects of one instance** (Overview vs Sites tabs) | domain name (`*Detail`, `*Card`, `*Summary`, …) |

The pattern across nesting depth: **list-shell = Layout, instance-shell = Detail**, regardless of route tree depth.

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
- **Aspects** — these only make sense as views _of_ the parent → domain name
  (Sites and Rates only exist as collections _belonging to_ a client.)

This test is not fully deterministic — domain judgment fills in the last 5%.

**Never use REST verbs in component names** (`*ShowLayout`, `*IndexLayout`) — they describe routes, not components.

### Component naming algorithm

Given the same UI description, two independent runs must produce identical component names.

Four mechanical steps. Each uses closed vocabularies (Element suffix, Slot suffix) — if a UI piece doesn't fit, **extend the vocabulary first**, then code. Never invent names at the call site.

#### Step 1: Component or inline?

A JSX block becomes a component **if and only if at least one trigger fires**. Size/length is NOT a trigger.

```
☐ T1  Wraps <Outlet />
☐ T2  Rendered at 2+ call sites
☐ T3  Owns a defineTranslation
☐ T4  Owns hardcoded route links (to="...")
☐ T5  Owns its own hooks (useState, useEffect, useMutation, ...)
☐ T6  Branches on a domain enum (switch/if on a domain value)
☐ T7  Is a structural sub-region of a Layout or Detail (compound slot)
```

No triggers fire → **inline** in the route or parent component.

#### Step 2: Classify

| Condition                                   | Classification   |
| ------------------------------------------- | ---------------- |
| T1 fires + master-detail / workspace shell  | LAYOUT           |
| T1 fires + instance shell                   | DETAIL           |
| T7 fires (structural slot, no domain logic) | COMPOUND SLOT    |
| Otherwise (any other trigger fired)         | DOMAIN COMPONENT |

#### Step 3: Pick suffix from a closed vocabulary

Component names share vocabulary with CSS class element suffixes — a component's name IS its root CSS class.

**Element vocabulary (for DOMAIN COMPONENTS):**

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

**Slot vocabulary (for COMPOUND SLOTS):**

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

#### Step 4: Compose the name

- **Standalone domain component:** `[Resource][Element]`
  - Resource = singular domain noun matching the API resource (`Client`, `Employee`, `Account`, `Rate`)
  - Examples: `ClientSummary`, `ClientPickList`, `ClientBulkActionsBar`
- **Compound slot:** `[Parent][Slot]`, accessed via dot notation
  - Examples: `ClientDetail.Header`, `ClientLayout.Sidebar.Content`
- **Layout/Detail:** `[Resource][Layout|Detail]`
  - Examples: `ClientLayout`, `ClientDetail`, `AccountLayout`

#### Compound slot vs standalone — the test

A sub-component is `Parent.Slot` (compound) **if and only if it is a pure layout shell**:

- No `defineTranslation`
- No hardcoded `to=` route links
- No hooks
- No domain switch/if
- No domain data as prop (`client`, `employee`, …)

If **any** of these are present → it's a standalone `ParentName` component (own folder).

#### Vocabulary extension rule

If a UI piece doesn't match any Element or Slot in the vocabulary above, **stop**. Add the new entry with a clear definition, then proceed.

### Compound components

Use plain property assignment in app code — never `Object.assign` or `*Fn` suffix.

```tsx
// ✓ Right — app code (inference)
export function ActionList(props: ActionListProps) {
  // body
}

ActionList.Item = ActionListItem;
ActionList.Separator = ActionListSeparator;

// ✗ Wrong — body inside Object.assign, ugly *Fn suffix
export const ActionList = Object.assign(ActionListFn, { Item: ActionListItem });
function ActionListFn(props) { ... }
```

- File order: `function` declaration → property assignments at the end.
- TypeScript infers the sub-component types from the assignments — no `declare namespace` needed.
- **Exception for library packages** (`isolatedDeclarations: true`): you must declare the namespace explicitly:

  ```tsx
  // Required only in library packages with isolatedDeclarations
  export declare namespace ActionList {
    let Item: typeof ActionListItem;
    let Separator: typeof ActionListSeparator;
  }
  ```

  - File order with namespace: `declare namespace` → `function` declaration → property assignments
  - Use `let` (not `const`) inside the namespace — `const` makes properties readonly and blocks the assignment

### Nested components — access through parent only

A component placed inside another component's folder (or used only by that parent) is **internal to the parent**. The only way external code accesses it is via the parent's compound-component dot notation (`ActionList.Item`) or by passing data to the parent.

```tsx
// ✓ Right — Item is internal to ActionList
ActionList.Item = ActionListItem;
import { ActionList } from "#components/action-list";
<ActionList.Item />;

// ✗ Wrong — exporting Item as a sibling for direct import
export { ActionListItem } from "./action-list/action-list-item";
import { ActionListItem } from "#components/action-list/action-list-item";
```

This keeps the parent's authoring control over its internals and prevents consumers from coupling to private structure.

### List/Item pairs

Components named `*Item` always come paired with a parent `*List` (or equivalent collection component). The pair is structural, not stylistic: the List owns iteration, layout, and selection; the Item owns rendering a single element.

```tsx
// ✓ Right — pair
<EmployeeList employees={employees}>
  {(employee) => <EmployeeListItem employee={employee} />}
</EmployeeList>

// ✗ Wrong — orphan Item without a List sibling
<EmployeeListItem employee={employee} />  // floating, no List context
```

If you find yourself rendering `*Item` outside its `*List`, the abstraction is wrong — either inline the rendering or promote the Item to a standalone component without the `Item` suffix.

### `.map` callbacks as their own component

A `.map` callback that produces JSX gets extracted into its own component — always, no size threshold. The component is named after what it renders (typically a `*Item` paired with the parent `*List`).

```tsx
// ✓ Right — extracted
<EmployeeList>
  {employees.map((employee) => (
    <EmployeeListItem key={employee.id} employee={employee} />
  ))}
</EmployeeList>;

function EmployeeListItem(props: { employee: Employee }) {
  const { employee } = props;
  return (
    <li>
      <span>{employee.name}</span>
      <span>{formatRole(employee.role)}</span>
    </li>
  );
}

// ✗ Wrong — JSX produced inline inside .map
<EmployeeList>
  {employees.map((employee) => (
    <li key={employee.id}>
      <span>{employee.name}</span>
      <span>{formatRole(employee.role)}</span>
    </li>
  ))}
</EmployeeList>;
```

Even one-line JSX maps get extracted. The threshold isn't size — it's that `.map` callbacks introduce a render context (key handling, re-render boundary) that deserves a named component.

### Conditional rendering

**Forbidden: explicit comparisons against `undefined`, `''`, `null`, or `0` for conditional rendering.** Use the truthy short-circuit `&&`. JavaScript's falsy semantics already cover all empty/missing states.

```tsx
// ✓ Right
{description && <p>{description}</p>}
{items.length > 0 && <ul>{items.map(...)}</ul>}
{user?.name && <span>{user.name}</span>}

// ✗ Wrong — verbose, over-thinking
{description !== undefined && description !== '' ? <p>{description}</p> : null}
{items.length !== 0 && items.length !== undefined && <ul>...</ul>}

// ✗ Also wrong — ternary with null branch when && works
{condition ? <Foo /> : null}
```

Ternary is justified only when rendering **different content** based on the condition (`condition ? <A /> : <B />`). For "render or don't render", `&&` is the rule.

This is JSX context only. Plain function logic follows the explicit null/undefined check rules in [[base]].

### Hoist constant expressions to module scope

When an expression's inputs are all module-scope constants, hoist the result of evaluating it to module scope. Don't re-compute on every render.

```tsx
// ✗ Wrong — recomputed on every render
function Button(props) {
  const styles = createStyle({ base: "rounded px-4" });
  return <button className={styles.base} />;
}

// ✓ Right — hoisted, computed once
const styles = createStyle({ base: "rounded px-4" });

function Button(props) {
  return <button className={styles.base} />;
}
```

If any input depends on props or state, the expression has to live inside the component — but pure constants always hoist.

### Shared union-literal prop types are exported

When two or more components accept the same string-literal union as a prop, **export the type from one canonical location and import it everywhere**. Never duplicate the literal union.

```tsx
// ✓ Right — exported once, imported elsewhere
// src/components/button/button.tsx
export type ButtonAppearance = "solid" | "ghost" | "outline";
export type ButtonProps = {
  appearance?: ButtonAppearance;
};

// src/components/icon-button/icon-button.tsx
import type { ButtonAppearance } from "../button";
export type IconButtonProps = {
  appearance?: ButtonAppearance;
};

// ✗ Wrong — duplicate literal in two places
// button.tsx
export type ButtonProps = { appearance?: "solid" | "ghost" | "outline" };
// icon-button.tsx
export type IconButtonProps = { appearance?: "solid" | "ghost" | "outline" };
```

Duplication is a typo waiting to happen: someone adds `'subtle'` to one and forgets the other. The named type forces the values to evolve together.

### Module-scope helpers — `get*` prefix, const named after return value

Module-scope helper functions that derive a value get the `get*` prefix. When the value is then captured in a `const`, the `const` is named **after the returned value, without the `get`**.

```tsx
// ✓ Right — function prefixed, const named for the value
function getButtonLabel(action: Action): string {
  /* ... */
}

function ActionButton(props: { action: Action }) {
  const buttonLabel = getButtonLabel(props.action);
  return <button>{buttonLabel}</button>;
}

// ✗ Wrong — const carries the `get` prefix
const getButtonLabel = getButtonLabel(props.action); // reads as a function reference
```

The pairing keeps the function's verb form (action) distinct from its result (noun), and avoids the awkward "the variable holds the function" misread.

### Props

- **Never pass data as a separate prop when it is already accessible from another prop.** If a component receives `param` and needs `param.name`, read it from `param.name` inside the component — don't add a `name` prop.
- **Pass domain data as-is through the component tree.** Derive computed values at the point of use, not at intermediate layers.
- **`data-*` attributes use lowercase kebab-case:** `data-animating`, `data-hide-indicator` — never camelCase (`data-isAnimating`).
- **`data-*` attributes never use `is`/`has` prefix:** `data-active`, `data-disabled` — never `data-is-active`. The prefix lives on the boolean _variable_, the attribute is bare.
- **Never pass `|| undefined` to `data-*` attributes** — the underlying primitive handles falsy values automatically (`data-disabled={isDisabled}`, not `data-disabled={isDisabled || undefined}`).
- **CSS custom properties (`style={{ '--x': value }}`) are always set on the root element**, even if consumed by descendants via CSS `var()`.
- **Cross-component CSS variables** (custom properties read by one component and set by another) must be prefixed with the **owning component's kebab-case name**. The owning component is the one that _reads_ the variable — it defines the contract. Example: `SelectionIndicator` reads `--selection-indicator-fill-color`; consumers set that exact name to override. Unprefixed names like `--fill-color` collide globally. Variables consumed only within the same component (internal CSS modules) don't need prefixes.
- **Avoid passing `className` to styled components** (`Button`, `Badge`, `Link`, etc.). Use variants (`size`, `appearance`, `intent`) to customize. If no variant fits — add one to the component, or use the Base primitive for full control. `className` on styled components is a code smell — the component API is incomplete.
- **Never pass explicit generic type arguments in JSX** — no `<Box<'input'>>`, `<List<User>>`. The generic is inferred from `as=` or other props. If inference fails, the component's type definition is wrong — fix it there, not at the call site.

### Extending component props

Always extend the underlying component's prop type (`BoxProps`, `PickListProps`, `LinkBaseProps`, etc.). **Never re-declare props that are already inherited** — most HTML attributes (`aria-*`, `role`, `id`, `className`, `style`, etc.) live on the base prop type already and propagate through every component that extends it.

```ts
// ✗ Don't — re-declaring aria-label which BoxProps already has
type MyComponentProps = Omit<PickListProps, "aria-label" | "children"> & {
  "aria-label"?: string;
};

// ✓ Do — inherit from the underlying component
type MyComponentProps = Omit<PickListProps, "children"> & {
  // ...
};
```

If you find yourself wanting to make an inherited prop required at your layer, **don't**. The contract belongs to the leaf component (typically the HTML element). Re-declaring is noise.

### Root attributes belong to the root

Never route HTML attributes (`aria-*`, `role`, `id`, `className`, `style`, `data-*`, event handlers) to a child element. They belong on the root.

For child-element attributes, expose a `[childElement][AttributeName]` prop — `checkboxLabel`, `triggerLabel`, `dismissLabel`. Named after the element, never the action.

```tsx
// ✗ Wrong
export type SelectCellProps = CellProps & { selectAllLabel?: string };

// ✓ Right
export type SelectCellProps = CellProps & { checkboxLabel: string };
```

### Hooks

- One hook per file: `use-locale.ts`, `use-controllable-state.ts`.
- Options/return types named `Use[Name]Options` / `Use[Name]Return`.

### State

- **Never use `useCallback`** — define functions directly in the component body. The cost of memoization rarely justifies the noise it adds.
- **Boolean state variables follow the boolean naming rule** (`is*`/`has*` prefix) — see [[naming]].
- **Refs must not be written to during render** — use `useEffect` to update refs.
- **Inside `useEffect` / `useLayoutEffect` callbacks, always use arrow functions** — never `function` declarations:

  ```ts
  // ✓
  useEffect(() => {
    const update = () => { ... };
  }, [...]);

  // ✗
  useEffect(() => {
    function update() { ... }
  }, [...]);
  ```

### Refs

Refs split in two by what they hold:

**DOM element refs** — root is always named `element`. Child element refs are named `[child]Element`. Never suffix with `Ref`:

```ts
const element = useRef<HTMLDivElement>(null); // root
const linkElement = useRef<HTMLAnchorElement>(null); // child
const activeElement = useRef<HTMLElement>(null); // NOT activeElementRef
```

**All other refs** (values, callbacks, timers, flags) — always suffix with `Ref`:

```ts
const delayRef = useRef(delay);
const onChangeRef = useRef(options.onChange);
const timerRef = useRef<number>(undefined);
const hasRevealedRef = useRef(false);
```

### `$`-prefix for ref extractions

The `$`-prefix is **reserved for ref extractions only** — values pulled from `.current` (or equivalent live-value accessors). It is the visual marker that says "this is the live value of a ref at this moment".

```ts
// ✓ Ref extraction
const $element = element.current;
const $onChange = onChangeRef.current;

// ✗ Plain DOM lookup — no ref involved, no $-prefix
const $sampleElement = container.querySelector(...);   // wrong
const sampleElement = container.querySelector(...);    // right
```

**When to extract:**

- When consuming a ref's `.current` value **more than once** (or after a null-check), extract into a `$`-prefixed variable.
- If `.current` is used **exactly once** inline, leave it inline — the single-use rule wins.

**Extracted ref-variable names mirror the ref names exactly.** DOM element extractions always carry the `Element` suffix (matching their refs): `const $element = element.current`, `const $triggerElement = triggerElement.current`. Never strip the suffix at the extraction site.

**Plain DOM lookups** (`document.getElementById`, `element.querySelector`) are **not** ref extractions, so they get **no `$`-prefix** — but they still carry the `Element` suffix when bound to a variable:

```ts
const sampleElement = $element.querySelector(...);
const targetElement = document.getElementById(id);
```

The `Element` suffix is about what kind of value it is (a DOM node), not where it came from.

### Variable extraction discipline

**Never extract a variable that is used exactly once.** Inline the expression. Exceptions:

- The name documents non-obvious intent.
- The extraction is required by another rule (e.g. null-check before use).

**Values derived from the root element** are named after what they return, not what they belong to — the root is implicit context. Child-derived values are prefixed with the child name:

```ts
// ✓
const rect = getRect($element); // root — implicit
const activeRect = getRect($activeElement); // child — explicit
const targetRect = getRect(targetElement);

// ✗
const containerRect = getRect($element); // unnecessary qualifier
```

### Timeout/interval refs

Named `timeoutRef` / `intervalRef`, always typed `useRef<number>(undefined)`:

```ts
const timeoutRef = useRef<number>(undefined);

// ✗ Don't
const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
```

`undefined` (not `null`) is the initial value because `window.clearTimeout` accepts `number | undefined` directly and avoids a null-guard at every call site.

When multiple timeouts or intervals coexist in the same scope, prefix with what they control:

```ts
const hideTimeoutRef = useRef<number>(undefined);
const resetTimeoutRef = useRef<number>(undefined);
const pollIntervalRef = useRef<number>(undefined);
```
