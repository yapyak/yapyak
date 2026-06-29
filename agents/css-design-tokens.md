## CSS — design-tokens

Tokens live in `src/styles/tokens.css` (or equivalent) and follow a strict two-tier architecture.

### Tier 1 — Palette (`--color-*`)

A small set of raw palette colors, named after their identity (what the color IS).

```css
--color-mint:   oklab(0.87 -0.24 0.06);
--color-aqua:   oklab(0.88 -0.21 0.01);
--color-coral:  #ff9aa0;
--color-silver: #e6e6e6;
--color-ink:    #141414;
```

Components must never reference `--color-*` directly. The palette only exists to feed tier 2.

### Tier 2 — Semantic (everything else)

What components actually use. Named after intent (what the color DOES).

- Color intent (`--brand`, `--accent`, `--danger`) — assigns a palette color to a semantic role. Swap these to re-theme.
- Variants (`--brand-soft`, `--brand-glow-strong`, `--accent-soft`) — derived from `--brand` / `--accent` via `color-mix(in oklch, var(--brand) X%, transparent)`. Never from `--color-*` directly.
- Surfaces, rings, text (`--surface`, `--ring`, `--text-soft`) — derived from `--color-silver` or `--color-ink`.
- Effects (`--shadow-brand-glow`, `--gradient-brand`) — composite values derived from semantic tokens.

### Rules

1. Components only use tier 2. Never `var(--color-mint)` in a component CSS — use `var(--brand)`.
2. Tier 2 variants derive from tier 2 intent, not from palette. `--brand-soft` mixes from `--brand`, not from `--color-mint`. This keeps the swap chain working: change `--brand` → all `--brand-*` variants follow.
3. No raw hex/rgba/oklab in component CSS. If you need a translucent brand color, write `color-mix(in oklch, var(--brand) X%, transparent)` inline. Don't inline `oklab(0.87 -0.24 0.06 / X)`.
4. Re-theming is a swap: change `--brand: var(--color-aqua)` and the entire site updates without touching components.
