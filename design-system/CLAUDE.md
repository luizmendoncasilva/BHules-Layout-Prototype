# CLAUDE.md

## Project Overview

**BSystem** (`@bhubai/bhub-design-system`) — Design system built on React 19, Tailwind CSS 4, Radix UI, and shadcn/ui patterns.
Published to GitHub Packages as ESM + CJS with TypeScript declarations.

## Commands

```bash
npm run dev              # Next.js dev server
npm run storybook        # Storybook dev (port 6006)
npm run test             # Vitest (browser mode, watch)
npm run lint             # ESLint
npm run ci               # lint + test (no watch) — used in CI
npm run build            # Rollup library build → dist/
npm run build-storybook  # Static Storybook build
npm run release          # build + npm publish
```

## Stack

- **Framework:** Next.js 16 (App Router, dev/preview only)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4 + CVA + tailwind-merge
- **Primitives:** Radix UI + shadcn/ui patterns
- **Build:** Rollup (ESM + CJS + .d.ts)
- **Testing:** Vitest + Playwright browser — stories double as tests via `storybookTest`
- **Docs:** Storybook 10 + Chromatic

## Project Structure

```
components/ui/    # 49 UI components (button, card, dialog, etc.)
stories/          # Storybook stories (*.stories.tsx) — also serve as tests
hooks/            # Custom hooks (useIsMobile)
lib/              # Utilities (cn() for className merging)
src/index.ts      # Barrel export — all components
src/icons.ts      # Re-exports from lucide-react
src/styles.css    # Design tokens + theme (Tailwind v4 @theme inline)
app/              # Next.js app (dev/preview only)
```

## Design Tokens

**IMPORTANTE:** Always use design tokens. Never hardcode hex colors, pixel values, or raw font sizes in components.

All tokens live in `src/styles.css` as CSS custom properties. Semantic tokens are mapped to Tailwind via `@theme inline`.

### Token Hierarchy

```
Primitive Palette (:root, theme-independent)
  └─ --color-neutral-50..950, --color-red-*, --color-blue-*, etc.

Semantic Tokens (:root light + .dark override)
  └─ --primary, --secondary, --destructive, --success, --warning, --info, etc.

General Tokens (:root light + .dark override)
  └─ --primary-hover, --ghost-hover, --outline-hover, --backdrop, etc.

Decorative Colors (:root + .dark, same values both modes, reference RAW tokens)
  └─ --magic-subtle/bold, --dojo-steel-subtle/bold, --mizu-flow-subtle/bold, --coral-subtle/bold

@theme inline (Tailwind mapping)
  └─ --color-primary: var(--primary) → enables `bg-primary`, `text-primary`

Dark Mode
  └─ @custom-variant dark (&:is(.dark *)) + .dark class overrides
```

### Token Usage Rules

1. **Prefer Tailwind semantic classes** when the token is mapped in `@theme inline`: `bg-primary`, `text-success`, `border-destructive`
2. **Use `var(--token)` via arbitrary values** when the token has no Tailwind mapping: `bg-[var(--primary-hover)]`, `text-[var(--ghost-foreground)]`
3. **NEVER hardcode hex colors** in components — always reference a token

### Token Reference

| Category | Tokens | Example usage |
|---|---|---|
| **Colors (semantic)** | `--background`, `--foreground`, `--primary`, `--secondary`, `--destructive`, `--muted`, `--accent`, `--card`, `--popover`, `--border`, `--ring`, `--input` | `bg-primary`, `text-muted-foreground` |
| **Status colors** | `--success`, `--warning`, `--info` — each with `-foreground`, `-text`, `-border`, `-subtle` | `bg-success`, `text-warning-foreground`, `border-[var(--info-border)]` |
| **Colors (palette)** | `--color-neutral-50..950`, `--color-red-*`, `--color-blue-*`, `--color-orange-*`, `--color-amber-*`, `--color-pink-*`, `--color-cyan-*`, `--color-purple-*`, `--color-green-*`, `--color-yellow-*`, `--color-white`, `--color-black` | `bg-neutral-100`, `text-red-500` |
| **General tokens** | `--primary-hover`, `--secondary-hover`, `--ghost`, `--ghost-foreground`, `--ghost-hover`, `--outline`, `--outline-hover`, `--outline-active`, `--foreground-alt`, `--mid-alt`, `--border-0..5`, `--accent-2..3`, `--destructive-border`, `--destructive-subtle`, `--destructive-text`, `--backdrop`, `--body-background` | `hover:bg-[var(--primary-hover)]` |
| **Focus rings** | `--focus-ring`, `--focus-ring-error` | `focus-visible:ring-ring` |
| **Radius** | `--radius` (8px base), `--radius-sm` through `--radius-4xl`. Named: `--rounded-none` through `--rounded-full` | `rounded-lg`, `rounded-md` |
| **Spacing** | `--spacing-3xs` (2px) through `--spacing-5xl` (64px) | Use with Tailwind spacing utilities |
| **Shadows** | `--shadow-2xs` through `--shadow-2xl` (stronger opacity in dark mode) | `shadow-sm`, `shadow-md` |
| **Typography** | `--font-inter`, `--font-geist-mono`. Sizes: `--font-size-h1..h4`, `--font-size-lg..xs`, `--font-size-mono`. Line heights, letter spacings, weights (`--font-weight-regular/medium/semibold`) | `font-sans`, `font-mono` |
| **Sidebar** | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`, `--sidebar-muted` | |
| **Decorative colors** | `--magic-subtle`, `--magic-bold`, `--dojo-steel-subtle`, `--dojo-steel-bold`, `--mizu-flow-subtle`, `--mizu-flow-bold`, `--coral-subtle`, `--coral-bold` — reference RAW palette tokens, same values in light and dark | `bg-magic-subtle`, `text-coral-bold` |
| **Charts** | `--chart-1` through `--chart-5`, `--chart-sentiment-positive`, `--chart-sentiment-negative`, `--chart-sentiment-neutral`, `--chart-sentiment-warning`, `--chart-shades-fill/stroke` | |

Each semantic token has a `-foreground` counterpart. Dark mode overrides via `@custom-variant dark (&:is(.dark *))`.

## Component Architecture

**IMPORTANTE:** Every new component MUST follow this pattern:

### 1. Component file (`components/ui/<name>.tsx`)
- `"use client"` directive
- Wrap Radix UI primitive (when applicable)
- Define variants with CVA (`cva()`)
- Use `cn()` from `@/lib/utils` for className merging
- Add `data-slot="<name>"` attribute on every rendered element
- Add `cursor-pointer` to all interactive elements (Tailwind v4 does not set it by default on buttons)
- Support `asChild` via `Slot.Root` from `radix-ui` for interactive elements
- **Use design tokens** (Tailwind semantic classes or `var(--token)`) — never hardcode hex colors
- Export component + variants (e.g., `Button, buttonVariants`)

### 2. Story file (`stories/<name>.stories.tsx`)
- `Meta` with `title: 'BSystem/<Name>'`, `tags: ['autodocs']`, `parameters: { layout: 'centered' }`
- Framework: `@storybook/nextjs-vite`
- Export `Playground` story using meta args + additional named stories for variants/states

### 3. Barrel export
- Add export to `src/index.ts`

### Composable pattern for complex components
Sub-components (e.g., `Card` → `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) — each gets its own `data-slot` and is exported individually.

## Code Conventions

- **Path alias:** `@/*` maps to project root
- **PascalCase** for components, **camelCase** for utilities/hooks
- **Conventional commits** enforced by commitlint: `feat:`, `fix:`, `docs:`, `ci:`, `chore:`, `refactor:`
- **Branch naming:** `feat/`, `fix/`, `chore/`, `docs/`, etc.
- **Language:** English for commits and code
- **Husky hooks:** pre-commit (lint-staged), commit-msg (commitlint), pre-push (`npm run ci`)

## CI/CD

- **PR → main:** CI via `BHubAI/shared-workflows` (lint + test + SonarQube)
- **Push to main:** CI + publish package to GitHub Packages + publish Storybook to Chromatic
- **Test versions:** `publish-test-version.yml` (manual trigger, `--tag snapshot`)

## Figma Integration

### Implementing a design from Figma (Figma → Code)

When receiving a Figma link, use the Figma MCP tools in this order:

1. **`get_design_context`** — extract code, screenshot, and component hints from the Figma node
2. **`get_code_connect_map`** — map Figma components to existing BSystem components
3. **`get_code_connect_suggestions`** — check for additional mapping suggestions
4. **Adapt to BSystem** — use our tokens, `cn()`, CVA variants, and `data-slot` attributes. Never copy raw Figma output directly.

**IMPORTANTE:** Always check if a BSystem component already exists before creating a new one. Reuse and extend existing components.

### Writing designs to Figma (Code → Figma)

When creating or updating designs in Figma:

1. Always load the **`figma-use`** skill BEFORE calling `use_figma`
2. Use **`search_design_system`** to discover existing components, variables, and styles
3. Use design system tokens (variables) instead of hardcoded values
4. Build screens incrementally, section by section

### Design System Rules

Use **`create_design_system_rules`** to generate project-specific rules that guide Figma-to-code workflows. Use **`search_design_system`** to discover available components and tokens in the Figma file before creating new ones.

### Adaptation Rules

When adapting Figma output to BSystem:
- Replace raw hex colors with BSystem semantic tokens (`--primary`, `--success`, etc.)
- Replace absolute positioning with Tailwind layout utilities
- Map Figma components to existing BSystem components via Code Connect
- Apply `data-slot`, `cn()`, and CVA variant patterns
