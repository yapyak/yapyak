---
name: yapyak-react
description: "React components: component-vs-inline, classification, the slot test, props, refs, hooks. Use when writing or editing a React component."
---

### Components

- Props type is an exported `type` extending `BoxProps<T>` in the same file: `export type ComponentNameProps = BoxProps<T> & { ... }` (see [[yapyak-box]]). Always `type`; a standalone object type only for the raw-SVG leaf exception.
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

Folder name = primary component name (kebab-case). Primary component file = `<folder-name>.tsx`. Sibling files are prefix-flat — every filename starts with the folder name. This scheme governs component files; [[yapyak-name]]'s filename-derivation algorithm does not apply to them.

```
button/                            → Button
  button.tsx                       → Button
  button-group.tsx                 → ButtonGroup
  button-group-context.ts          → ButtonGroupContext
  use-button.ts                    → useButton
```

No sub-folders inside a component folder. Everything flat.

#### Sub-components vs separate roots — rendered-inside, never concept

This governs `components/` — the app's domain components. A folder there holds only the components its primary **renders inside itself** (sub-components). A component mounted by a *different* parent — a sibling root composed elsewhere — gets its **own** folder, even when it belongs to the same feature. A `components/` folder is named for a component, never a feature: there are no "concept" folders here.

**Mechanical test:** does the primary component's JSX render this component? Yes → sub-component, same folder. No → its own folder.

A trigger and the overlay it opens are the canonical case — they are peer roots composed by a shared parent (see § Trigger and overlay are separate components), so each gets its own folder.

```
// ✓ peer roots — separate folders
components/
  search-dialog/                  → SearchDialog renders SearchDialogListbox
    search-dialog.tsx
    search-dialog-listbox.tsx     //   rendered inside SearchDialog → sub-component
  search-dialog-button/           → SearchDialogButton (the trigger, mounted in the header)
    search-dialog-button.tsx

// ✗ concept folder lumping two peer roots together
components/
  search-dialog/
    search-dialog.tsx
    search-dialog-button.tsx      //   WRONG — the trigger isn't rendered inside SearchDialog
    search-dialog-listbox.tsx
```

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

**Exception:** components whose root is `*Base`, `Box`, or `Icon` carry no element-derived suffix. An `Icon`-based component takes the icon's own name (`ChevronIcon` → `Chevron`, `CopyIcon` → `Copy`) — mechanical. A `Box`/`*Base`-based one: the coined noun MUST be an ElementType from [[yapyak-element-type]]'s layout group, selected by DOM shape (column→`Stack`, row→`Row`, grid→`Grid`, landmark→`Section`, no layout→`Wrapper`).

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
    <Box>
      <Box as="h1">Guides</Box>
      <GuideNav guides={guides} />
    </Box>
  );
}
```

#### Trigger and overlay are separate components

Never author a toggle and the overlay it opens (dialog, drawer, sheet, menu, popover) in one component → give the trigger and the overlay each its own component.

Keep the `open` state in the parent that composes both: pass `open` + `onToggle` to the trigger, `open` to the overlay. A glue that takes both as slots (`DialogTrigger`) is such a parent.

Keep the effects the open state drives across siblings (`inert`, scroll-lock, Escape, route-change close) in a hook the parent calls.

```tsx
// ✓ Two components; parent owns the glue
function Component() {
  const dialog = useMobileDialog();
  return (
    <Layout>
      <MobileDialogButton open={dialog.isOpen} onToggle={dialog.toggle} />
      <MobileDialog open={dialog.isOpen} />
      <Layout.Main inert={dialog.isOpen} />
    </Layout>
  );
}

// ✗ One component fuses trigger, overlay, and state
function MobileDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <MobileDialogButton open={open} onToggle={() => setOpen((value) => !value)} />
      <Animate in={open}>{/* panel */}</Animate>
    </Box>
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

#### The peer-vs-aspect test

For a component bound to one `$id` whose children navigate between sub-sections:

- Children could stand alone as top-level resources → `*Layout`.
- Children only exist as views of the parent → domain name (`*Detail`, `*Card`, `*Summary`).

Domain judgment resolves ambiguity — the test is not fully deterministic.

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

T2 means the block is rendered from 2+ separate components. Reusing one component's markup across slots of its own render is a markup const, not a T2 hit — a const shared between an inline slot and a drawer stays a const.

#### Step 2: Classify

First match wins.

| Condition | Classification |
| --- | --- |
| T1 + instance shell | DETAIL |
| T1 (any other route shell) | LAYOUT |
| T6 (structural slot, no domain logic) | COMPOUND SLOT |
| Any other trigger | DOMAIN COMPONENT |

#### Step 3: Pick suffix from closed vocabulary

A component's name IS its root CSS class — its suffix is an ElementType from [[yapyak-element-type]]: the type of its root element, or a composite type it implements (`Layout`, `Detail`, `Summary`, `Card`, `Table`, `PickList`, `ActionsBar`, `SearchInput`, `EmptyMessage`).

A compound slot's suffix is its region's element-type — a landmark (`Header` / `Content` / `Footer` / `Sidebar` / `Main`), `Bar`, or `Title`.

#### Step 4: Compose

- **Standalone domain component:** `[Resource][Element]` (`OptionPickList`, `ReferenceTable`).
- **Compound slot:** `[Parent][Slot]` via dot notation (`GuideDetail.Header`).
- **Layout/Detail:** `[Resource][Layout|Detail]` (`GuideLayout`, `GuideDetail`).

#### Compound slot vs standalone — the test

A sub-component is `Parent.Slot` iff it is a pure layout shell:

- No hardcoded `to=` route links
- No hooks
- No domain switch/if
- No domain data as prop, beyond a single field rendered inline

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

### Extending compound components

Mirror the parent's compound structure.

- Root wrapper: `[Prefix][Parent]` extends `[Parent]`.
- Sub-parts: `[Prefix][Parent].[SubPart]` extends `[Parent].[SubPart]`.

```tsx
// ✓
export function ChatMenu(props: ChatMenuProps) { ... }
ChatMenu.Item = ChatMenuItem;

<ChatMenu aria-label="...">
  <ChatMenu.Item provider={...} />
</ChatMenu>

// ✗ Flat sub-part wrapper without matching container
<Menu aria-label="...">
  <ChatProviderMenuItem provider={...} />
</Menu>
```

Wrapping `[Parent].Sub` without providing `[Prefix][Parent]` is forbidden → provide the full compound.

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

Extract a `.map` callback that produces JSX into its own component. Name it after its root element-type per [[yapyak-element-type]] — `*Item` when the row is an `<li>` in a `*List`, otherwise the root's own type (a card row is `*Card`).

**Exception — single-element pass-through.** Keep inline when the callback returns exactly one JSX element with prop forwarding only — no wrapping structure, no logic beyond binding the iteration variable to handlers.

```tsx
// ✓ Inline — single element, forwards iteration variable
providers.map((provider) => (
  <Menu.Item
    key={provider.value}
    leadingIcon={<Swatch accent={provider.value} />}
    onSelect={() => handleSelect(provider)}
  >
    {provider.label}
  </Menu.Item>
))

// ✗ Multiple children or wrapping structure → extract
items.map((item) => (
  <Row>
    <Cell>{item.name}</Cell>
    <Cell>{item.status}</Cell>
  </Row>
))

// ✗ Logic beyond prop forwarding → extract
items.map((item) => {
  const computed = derive(item);
  return <Row value={computed} />;
})
```

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

This is JSX context only. Plain function logic follows [[yapyak-nullability]].

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

### Companion types prefix the component name

Every companion type exported from a component starts with the component name. `Props` is the primary; unions, options, and return shapes follow the same rule.

```tsx
// ✓
export type ButtonAppearance = 'solid' | 'ghost' | 'outline';
export type DrawerDirection = 'start' | 'end';
export type SwatchAccent = 'react' | 'vue';

// ✗ Bare noun — collides across components
export type Appearance = 'solid' | 'ghost' | 'outline';
export type Accent = 'react' | 'vue';
```

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
- Prop names never repeat a segment of the component name → name the variation, not the kind.
- **Box-consumer rules** — rendering `Box` for every element, `BoxProps<T>` shape, `data-*` value passthrough (no `|| undefined`), `className` forwarding, styled-component variants over `className`, and JSX generics — live in [[yapyak-box]].

```tsx
// ✗ Stutter
<AccentDot accent="react" />
<ChevronIcon chevron="down" />

// ✓ Names the variation
<Swatch accent="react" />
<ChevronIcon direction="down" />
```

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

### Pointer events, never mouse events

For pointer interaction — press, release, movement, enter/leave — use the pointer event family. Never the mouse family. Pointer events unify mouse, touch, and pen in one handler; mouse events silently miss touch and pen.

| Use | Never |
| --- | --- |
| `onPointerDown` | `onMouseDown` |
| `onPointerUp` | `onMouseUp` |
| `onPointerMove` | `onMouseMove` |
| `onPointerEnter` | `onMouseEnter` |
| `onPointerLeave` | `onMouseLeave` |
| `onPointerCancel` | `onMouseOut` / `onMouseOver` |

`onClick` is the **activation** event — it fires for pointer *and* keyboard (Enter/Space on a `<button>`), so it stays. Use `onClick` for "the user activated this control"; use `onPointerDown` when you need the press itself (e.g. `preventDefault` on a focus steal, or driving a press interaction).

```tsx
// ✓ pointer press — keeps focus in the input on padding clicks
<Dialog
  onPointerDown={(event) => {
    if (event.target !== inputElement.current) {
      event.preventDefault();
    }
  }}
/>

// ✓ activation — fires for pointer and keyboard
<button onClick={handleSubmit}>Save</button>

// ✗ mouse-only — misses touch and pen
<div onMouseDown={handlePress} onMouseEnter={handleHover} />
```

### Hooks

- One hook per file: `use-locale.ts`, `use-controllable-state.ts`.
- Options/return types named `Use[Name]Options` / `Use[Name]Return`.

### State

- `useCallback` is forbidden — define functions directly in the component body.
- Boolean state variables follow the boolean naming rule (`is*`/`has*` prefix) per [[yapyak-name]].
- Refs must not be written to during render — use `useEffect`.
- Inside `useEffect` / `useLayoutEffect` callbacks, always use arrow functions:

  ```ts
  // ✓
  useEffect(() => {
    const update = () => { ... };
  }, [...]);
  ```

### Event handlers

Name local event handlers `handle*`, never `on*`. `on*` is reserved for event props.

Format: `handle[ChildName][EventName]`. Omit `ChildName` when the handler binds to the component's own root.

```tsx
// ✓ Root event
const handleClick = () => { /* ... */ };
return <button onClick={handleClick} />;

// ✓ Child event
const handleItemSelect = (id: string) => { /* ... */ };
return <MenuItem onSelect={handleItemSelect} />;

// ✗ Event-prop prefix on a local function
const onClick = () => { /* ... */ };

// ✗ Missing ChildName for a child-targeted handler
const handleClick = (id: string) => { /* ... */ };
return <MenuItem onSelect={handleClick} />;
```

Never inline an event handler in JSX → define a named handler in the component body.

```tsx
// ✗ Inline arrow
<button onClick={() => onFrameworkChange(id)} />

// ✓ Named handler
const handleClick = () => {
  onFrameworkChange(id);
};
return <button onClick={handleClick} />;
```

**Exception — iteration binding in `.map`.** Keep inline arrow when the callback iterates and the arrow body is one call to a named handler forwarding the iteration variable (and event arguments only).

```tsx
// ✓ Iteration binding
items.map((item) => (
  <Row onClick={() => handleRowClick(item)} />
))

// ✓ Iteration binding + event forwarding
items.map((item) => (
  <Row onClick={(event) => handleRowClick(item, event)} />
))

// ✗ Multiple statements
items.map((item) => (
  <Row onClick={() => { setActive(item); trackEvent('click'); }} />
))

// ✗ Logic beyond forwarding
items.map((item) => (
  <Row onClick={() => handleClick(item.id + 1)} />
))
```

For a per-iteration handler that does not fit the iteration-binding exception, extract the row into its own component per [[.map callbacks as their own component]].

Handlers always use block-body arrow functions → never shorthand implicit-return.

```tsx
// ✗ Shorthand implicit-return
const handleClick = () => onActivate(id);

// ✓ Block body
const handleClick = () => {
  onActivate(id);
};
```

Handlers always use `const handle* = () => { ... }` → never `function handle*() { ... }`.

```tsx
// ✗ function declaration
function handlePointerDown(event: PointerEvent) { /* ... */ }

// ✓ const arrow
const handlePointerDown = (event: PointerEvent) => { /* ... */ };
```

### Callbacks captured by long-lived subscriptions

When an effect subscribes long-lived and its callback must call the latest version of a prop callback → capture the prop in a ref, sync it in a separate effect, read `.current` inside the subscription. Keep the prop out of the subscribing effect's dep array.

```ts
// ✓
const onChangeRef = useRef(onChange);
useEffect(() => {
  onChangeRef.current = onChange;
});

useEffect(() => {
  const handleEvent = (event: Event) => {
    onChangeRef.current(event);
  };
  window.addEventListener('event', handleEvent);
  return () => window.removeEventListener('event', handleEvent);
}, []);

// ✗ Resubscribes every render
useEffect(() => {
  const handleEvent = (event: Event) => {
    onChange(event);
  };
  window.addEventListener('event', handleEvent);
  return () => window.removeEventListener('event', handleEvent);
}, [onChange]);
```

The ref is synced in a separate effect (runs after commit) — never written during render. Replaces `useCallback`-based "stable identity" patterns.

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

A JSX binding is a variable — this rule governs it. Single-use → inline it; size is never a reason to keep it. Used 2+ times within one component → keep it as a **markup const**. A markup const is not a component: whether to extract a component is the separate Step 1 decision, and reusing a local const across slots of one render is not a trigger.

Name a markup const after **where** it renders — its destination slot or region — suffixed with `Content`: `sidebarContent`, `outlineDrawerContent`. Never after what it is. Rendered in more than one place → name it after the first destination in source order. Markup consts sit directly before the `return`, after every hook and computation.

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
