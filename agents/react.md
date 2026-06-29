## React

### Components

- Props type is an exported `type` extending `BoxProps<T>` in the same file: `export type ComponentNameProps = BoxProps<T> & { ... }` (see [[box]]). Always `type`; a standalone object type only for the raw-SVG leaf exception.
- Props are destructured on the first line of the function body, not in the signature.
- Blank line between destructuring and the rest of the function body.
- Defaults are set in the destructuring assignment.
- `...restProps` is spread onto the root element, **FIRST**, then explicit overrides come after.

**Exception:** `interface` for Props only when declaration merging is required.

```tsx
export type ButtonProps = BoxProps<'button'> & {
  disabled?: boolean;
};

export function Button(props: ButtonProps) {
  const { className, disabled, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="button"
      className={[styles.Button, className]}
      data-disabled={disabled}
      disabled={disabled}
    />
  );
}
```

### File structure

Every component lives in its own folder. The folder contains the component, sub-components, peer-exports, CSS modules, tests, hooks, context, and utilities.

```
components/
  button/
    button.tsx
    button.module.css
    button.test.tsx
    button-group.tsx
    button-group-context.ts
    use-button.ts
    index.ts
  divider/
    divider.tsx
    divider.module.css
    index.ts
```

#### File naming

Folder name = primary component name (kebab-case). Primary component file = `<folder-name>.tsx`. Sibling files are prefix-flat — every filename starts with the folder name.

```
button/                            → Button
  button.tsx                       → Button
  button-group.tsx                 → ButtonGroup
  button-group-context.ts          → ButtonGroupContext
  use-button.ts                    → useButton
```

No sub-folders inside a component folder. Everything flat.

#### `index.ts` barrel

Re-exports types and values separately, each block alphabetized:

```ts
export type { ButtonProps } from "./button";
export type { ButtonGroupProps } from "./button-group";

export { Button } from "./button";
export { ButtonGroup } from "./button-group";
```

Consumers import via the folder: `import { Button } from '#components/button'`.

#### CSS class names

Root class equals the component name (`.Button`, `.DialogTrigger`).

#### Single-component folders

Components with no internals still get their own folder. The folder shape is consistent regardless of complexity.

### Forbidden: plural component names

Never `locales.tsx`, `examples.tsx`, `items.tsx`, `tabs.tsx`. Always singular noun + element-type suffix: `LocaleStack`, `ExampleSection`, `ItemRow`, `TabBar`.

The plural is encoded in the element type (`List`, `Stack`, `Section`, `Grid`), not the noun.

`List` is reserved for `<ul>` / `<ol>` only. `<div>` with `flex-direction: column` is a `Stack`. Match the suffix to the actual DOM.

### Component suffix matches its root element

A component's name ends with the name of its root JSX element: `ChevronIcon` renders `<Icon>`, `ReferenceRow` renders `<tr>`, `OptionPickList` renders `<ul>`.

**Exception:** components whose root is `*Base`, `Box`, or `Icon` carry no element-derived suffix. An `Icon`-based component takes the icon's own name (`ChevronIcon` → `Chevron`, `CopyIcon` → `Copy`) — mechanical. A `Box`/`*Base`-based one: the coined noun MUST be an ElementType from [[css]]'s group/layout vocabulary, selected by DOM shape (column→`Stack`, row→`Row`, grid→`Grid`, landmark→`Section`).

### Component architecture

- Domain components live in `components/`, take props, and do one thing.
- Components never use route-data hooks (`useLoaderData()`, `getRouteApi()`). All data comes through props.
- Prop types come from the parsed content shapes or yapyak's public exports — never invented domain types in components.
- The route file's `Component` function is the page — it calls route-data hooks, composes domain components, and adds page-level markup.

```tsx
// ✓ Right
export const Route = createFileRoute('...')({
  component: Component,
  async loader() {
    const guides = await loadGuides();
    return { guides };
  },
});

function Component() {
  const { guides } = Route.useLoaderData();
  return (
    <div>
      <h1>Guides</h1>
      <GuideNav guides={guides} />
    </div>
  );
}
```

### Domain naming

- Singular resource in component names: `GuideCard`, never `GuidesCard`.
- Domain components named `[Resource][Element]`: `GuideCard`, `ReferenceTable`, `GuideNavigation`.
- No "Page" components — the route `Component` function handles page layout.
- **Dispatcher components:** when a base component renders a different sub-component based on a type/variant, name the variants `[Parent][Variant]`. `Block` dispatches to `BlockCallout` and `BlockCode` based on the block's kind.

### Layout vs domain name

| Chrome switches between | Suffix |
| --- | --- |
| Different instances (master-detail list) | `*Layout` |
| Different peer domains (Guides vs Reference vs Changelog) | `*Layout` |
| Different aspects of one instance (Overview vs Examples tabs) | domain name (`*Detail`, `*Card`, `*Summary`) |

Pattern across nesting depth: list-shell = Layout, instance-shell = Detail.

```
GuideLayout              (list of guides, master-detail shell)
  └─ GuideDetail         (one guide, tabs for facets)
       └─ ExampleLayout
            └─ ExampleDetail
```

REST verbs in component names are forbidden (`*ShowLayout`, `*IndexLayout`).

### Component naming algorithm

#### Step 1: Component or inline?

A JSX block becomes a component if at least one trigger fires. Size is NOT a trigger.

```
☐ T1  Wraps <Outlet />
☐ T2  Rendered at 2+ call sites
☐ T3  Owns hardcoded route links (to="...")
☐ T4  Owns its own hooks (useState, useEffect)
☐ T5  Branches on a domain enum
☐ T6  Is a structural sub-region of a Layout or Detail (compound slot)
```

No triggers fire → inline.

#### Step 2: Classify

| Condition | Classification |
| --- | --- |
| T1 + master-detail / workspace shell | LAYOUT |
| T1 + instance shell | DETAIL |
| T6 (structural slot, no domain logic) | COMPOUND SLOT |
| Any other trigger | DOMAIN COMPONENT |

#### Step 3: Pick suffix from closed vocabulary

A component's name IS its root CSS class.

**Element vocabulary (DOMAIN COMPONENTS):**

```
ROUTE SHELLS (wrap <Outlet />)
  Layout              list-shell or workspace shell
  Detail              instance shell

INSTANCE VIEWS
  Summary             <dl> of fields (read-only)
  Card                bordered preview block

COLLECTION VIEWS
  Table               <table>
  PickList            <ul> of selectable rows
  List                generic <ul>
  Row                 single row

CHROME
  Navigation          set of route-links (tabs, side-nav)
  ActionsBar          generic actions strip

ATOMIC
  Badge               status pill
  SearchInput         wrapped search input
  Input               wrapped generic input
  EmptyMessage        empty state
```

**Slot vocabulary (COMPOUND SLOTS):**

```
TOP-LEVEL Layout/Detail SLOTS
  Header              top region (title, actions)
  Bar                 horizontal slot below Header
  Content             main area
  Footer              bottom region
  Sidebar             side region
  Main                outermost page layout only

SIDEBAR SUB-SLOTS
  Header              search/filter
  Content             scroll area
  Footer              pagination

HEADER SUB-SLOTS
  Title               title cluster (h1 + optional badge)
```

#### Step 4: Compose

- **Standalone domain component:** `[Resource][Element]` (`OptionPickList`, `ReferenceTable`).
- **Compound slot:** `[Parent][Slot]` via dot notation (`GuideDetail.Header`).
- **Layout/Detail:** `[Resource][Layout|Detail]` (`GuideLayout`, `GuideDetail`).

#### Compound slot vs standalone — the test

A sub-component is `Parent.Slot` if and only if it is a pure layout shell:

- No hardcoded `to=` route links
- No hooks
- No domain switch/if
- No domain data as prop

If any are present → standalone `ParentName` component (own folder).

#### Vocabulary extension rule

If a UI piece does not match any Element or Slot in the vocabulary, stop. Add the new entry with a definition, then proceed.

### Compound components

Plain property assignment in app code — never `Object.assign` or `*Fn` suffix.

```tsx
// ✓
export function ActionList(props: ActionListProps) {
  // body
}

ActionList.Item = ActionListItem;
ActionList.Separator = ActionListSeparator;
```

- File order: `function` declaration → property assignments at the end.
- TypeScript infers sub-component types — no `declare namespace`.
- **Library exception** (`isolatedDeclarations: true`): declare the namespace explicitly:

  ```tsx
  export declare namespace ActionList {
    let Item: typeof ActionListItem;
    let Separator: typeof ActionListSeparator;
  }
  ```

  File order: `declare namespace` → `function` declaration → property assignments. Use `let`, not `const`.

### Nested components — access through parent only

A component placed inside another component's folder is internal to the parent. External code accesses via the parent's compound-component dot notation or by passing data to the parent.

```tsx
// ✓
ActionList.Item = ActionListItem;
import { ActionList } from "#components/action-list";
<ActionList.Item />;

// ✗ Wrong — exporting Item as a sibling
import { ActionListItem } from "#components/action-list/action-list-item";
```

### List/Item pairs

Components named `*Item` always come paired with a parent `*List` (or equivalent collection component). The List owns iteration, layout, and selection. The Item owns rendering a single element.

If rendering `*Item` outside its `*List` happens — the abstraction is wrong.

### `.map` callbacks as their own component

A `.map` callback that produces JSX gets extracted into its own component. No size threshold. Named after what it renders (typically a `*Item` paired with the parent `*List`).

```tsx
// ✓
<GuideList>
  {guides.map((guide) => (
    <GuideListItem key={guide.slug} guide={guide} />
  ))}
</GuideList>

function GuideListItem(props: { guide: Guide }) {
  const { guide } = props;
  return (
    <li>
      <span>{guide.title}</span>
      <span>{formatSection(guide.section)}</span>
    </li>
  );
}
```

### Conditional rendering

Explicit comparisons against `undefined`, `''`, `null`, or `0` for conditional rendering are forbidden. Use the truthy short-circuit `&&`.

```tsx
// ✓
{description && <p>{description}</p>}
{items.length > 0 && <ul>{items.map(...)}</ul>}

// ✗
{description !== undefined && description !== '' ? <p>{description}</p> : null}
{condition ? <Foo /> : null}
```

Ternary is justified only when rendering different content (`condition ? <A /> : <B />`).

This is JSX context only. Plain function logic follows [[null-vs-undefined]].

### Hoist constant expressions to module scope

When an expression's inputs are all module-scope constants, hoist the result to module scope.

```tsx
// ✓
const styles = createStyle({ base: "rounded px-4" });

function Button(props) {
  return <button className={styles.base} />;
}
```

If any input depends on props or state, the expression lives inside the component.

### Shared union-literal prop types are exported

When two or more components accept the same string-literal union, export the type from one canonical location and import it.

```tsx
// ✓
// src/components/button/button.tsx
export type ButtonAppearance = "solid" | "ghost" | "outline";

// src/components/icon-button/icon-button.tsx
import type { ButtonAppearance } from "../button";
```

### Module-scope helpers — `get*` prefix

Module-scope helper functions that derive a value get `get*`. When the value is captured in a `const`, the `const` is named after the returned value, without the `get`.

```tsx
// ✓
function getButtonLabel(action: Action): string { /* ... */ }

function ActionButton(props: { action: Action }) {
  const buttonLabel = getButtonLabel(props.action);
  return <button>{buttonLabel}</button>;
}
```

### Props

- Never pass data as a separate prop when it is already accessible from another prop. If a component receives `param` and needs `param.name`, read it from `param.name` inside the component.
- Pass domain data as-is through the component tree. Derive computed values at the point of use.
- `data-*` attributes use lowercase kebab-case: `data-animating`, never `data-isAnimating`.
- `data-*` attributes never use `is`/`has` prefix: `data-active`, `data-disabled` — never `data-is-active`.
- CSS custom properties (`style={{ '--x': value }}`) are always set on the root element.
- Cross-component CSS variables must be prefixed with the owning component's kebab-case name (`--selection-indicator-fill-color`).
- **Box-consumer rules** — rendering `Box` for every element, `BoxProps<T>` shape, `data-*` value passthrough (no `|| undefined`), `className` forwarding, styled-component variants over `className`, and JSX generics — live in [[box]].

### Extending component props

Always extend the underlying component's prop type (`BoxProps`, `OptionPickListProps`). Never re-declare props that are already inherited — most HTML attributes (`aria-*`, `role`, `id`, `className`, `style`) live on the base prop type.

```ts
// ✗
type MyComponentProps = Omit<OptionPickListProps, "aria-label" | "children"> & {
  "aria-label"?: string;
};

// ✓
type MyComponentProps = Omit<OptionPickListProps, "children"> & { /* ... */ };
```

### Root attributes belong to the root

Never route HTML attributes (`aria-*`, `role`, `id`, `className`, `style`, `data-*`, event handlers) to a child element. They belong on the root.

For child-element attributes, expose a `[childElement][AttributeName]` prop — `checkboxLabel`, `triggerLabel`, `dismissLabel`. Named after the element, never the action.

### Hooks

- One hook per file: `use-locale.ts`, `use-controllable-state.ts`.
- Options/return types named `Use[Name]Options` / `Use[Name]Return`.

### State

- `useCallback` is forbidden — define functions directly in the component body.
- Boolean state variables follow the boolean naming rule (`is*`/`has*` prefix) per [[naming]].
- Refs must not be written to during render — use `useEffect`.
- Inside `useEffect` / `useLayoutEffect` callbacks, always use arrow functions:

  ```ts
  // ✓
  useEffect(() => {
    const update = () => { ... };
  }, [...]);
  ```

### Refs

**DOM element refs** — root is always named `element`. Child element refs are named `[child]Element`. Never suffix with `Ref`:

```ts
const element = useRef<HTMLDivElement>(null);
const linkElement = useRef<HTMLAnchorElement>(null);
const activeElement = useRef<HTMLElement>(null);
```

**All other refs** (values, callbacks, timers, flags) — always suffix with `Ref`:

```ts
const delayRef = useRef(delay);
const onChangeRef = useRef(options.onChange);
const timerRef = useRef<number>(undefined);
const hasRevealedRef = useRef(false);
```

### `$`-prefix for ref extractions

`$`-prefix is reserved for ref extractions — values pulled from `.current`. It marks "this is the live value of a ref at this moment".

```ts
// ✓ Ref extraction
const $element = element.current;
const $onChange = onChangeRef.current;

// ✗ Plain DOM lookup — no ref involved
const $sampleElement = container.querySelector(...);
```

**When to extract:**

- Consuming `.current` more than once (or after a null-check) → extract into `$`-prefixed variable.
- Used exactly once inline → leave inline.

Extracted ref-variable names mirror the ref names exactly. DOM element extractions carry the `Element` suffix: `const $triggerElement = triggerElement.current`.

Plain DOM lookups carry the `Element` suffix but no `$`-prefix:

```ts
const sampleElement = $element.querySelector(...);
const targetElement = document.getElementById(id);
```

### Variable extraction discipline

Never extract a variable used exactly once. Inline the expression. Extract a single-use value only when (a) a later rule requires a null-check before use, or (b) the expression contains a function call whose result isn't named by an adjacent literal. Otherwise inline.

Values derived from the root element are named after what they return:

```ts
// ✓
const rect = getRect($element);              // root — implicit
const activeRect = getRect($activeElement);  // child — explicit
```

### Timeout/interval refs

Named `timeoutRef` / `intervalRef`, always typed `useRef<number>(undefined)`:

```ts
const timeoutRef = useRef<number>(undefined);
```

`undefined` (not `null`) is the initial value because `window.clearTimeout` accepts `number | undefined` directly.

When multiple timeouts coexist in the same scope, prefix with what they control:

```ts
const hideTimeoutRef = useRef<number>(undefined);
const resetTimeoutRef = useRef<number>(undefined);
const pollIntervalRef = useRef<number>(undefined);
```
