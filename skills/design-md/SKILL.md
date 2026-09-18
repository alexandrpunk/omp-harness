---
name: design-md
description: "Create and maintain DESIGN.md — the product's visual identity contract (tokens + rules) that grounds all UI work; prevents generic AI defaults and design drift"
---

# design-md

## Purpose

DESIGN.md is the single source of truth for how the product looks and feels — it should "tell a story of your product". Without it, agents fall back on generic abstract defaults and invent new decisions; with it, every UI change is grounded in decisions already made.

## Structure

Two layers:

**1. YAML frontmatter with atomic design tokens:**
- `name`: design system name
- `colors`: semantic roles (`surface`, `surface-dim`, `primary`, `inverse-primary`, `secondary`, `accent`, `error`/`success`/`warning` if any) as hex
- `typography`: per-scale (`display`, `headline`, `title`, `body`, `label`) with fontFamily, fontSize, weight, lineHeight
- `rounded`: scale (`sm`, `DEFAULT`, `md`, `lg`, `full`) in rem
- `spacing`: base unit (e.g. 4px) + scale (`xs`–`3xl`)

**2. Markdown body with three sections:**
- **Brand & Style**: how the brand should be perceived (2–4 sentences, adjectives, tone)
- **Colors / Typography / Spacing / Shapes**: how each token is USED and NOT used (e.g. "Use primary for primary buttons, selected states, CTAs. Do NOT use it for large backgrounds or decorative elements")
- **Components**: how components are built from tokens (buttons, inputs, cards, nav), each referencing token names

Minimal example:

```yaml
---
name: aurora
colors:
  surface: "#FAFAF7"
  primary: "#2D6A4F"
  error: "#B3261E"
typography:
  body: { fontFamily: Inter, fontSize: 16, weight: 400, lineHeight: 1.5 }
rounded:
  DEFAULT: 0.5rem
spacing:
  base: 4px
  scale: { xs: 1, sm: 2, md: 4, lg: 6, xl: 8 }
---
```

```markdown
## Colors
- Use `primary` for primary buttons, selected states, CTAs. Do NOT use it
  for large backgrounds or decorative elements.
- `error` is reserved for destructive actions and validation messages only.
```

## Workflow

1. If DESIGN.md exists in project root: READ IT FIRST before any UI change; use its tokens and rules; never invent new colors/spacing/typography.
2. If missing and the project has existing UI: derive DESIGN.md from the actual code (extract tokens from CSS/Tailwind config/styles), present for approval, save to project root.
3. If greenfield: draft DESIGN.md from brand input before writing any component code.
4. When a design decision must change: update DESIGN.md FIRST, then the code — never let code drift from the spec.
5. Verify before done: no magic values in components (raw hex, px spacing not on scale, undeclared fonts); every visual value must trace to a frontmatter token.

## Drift prevention checklist

1. All colors reference `colors` tokens (semantic roles, not raw hex).
2. Spacing multiples of the base unit; radii from `rounded` scale.
3. Type styles only from `typography` scale — no ad-hoc sizes.
4. Each token has a "use for / don't use for" note in body.
5. Components section maps each component to tokens it consumes.
6. DESIGN.md updated before code when tokens change.

## Anti-patterns

- Generic AI defaults (Inter + blue + 4px radius everywhere with no rationale) when the project already has an identity.
- Body text that describes tokens without usage rules.
- Inventing new tokens mid-task instead of extending the spec deliberately.
- Letting DESIGN.md rot after initial creation.
