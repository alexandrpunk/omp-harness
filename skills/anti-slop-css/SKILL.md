---
name: anti-slop-css
description: Anti-slop rules for CSS via stylelint with standard config and a11y/order plugins; applies only to CSS projects
---

# anti-slop-css

Anti-slop discipline for CSS.

## Applicability check (first step)
- Only if the project has `.css` files or `package.json` with stylelint configured. Otherwise **STOP, change nothing**, report "anti-slop-css does not apply (no CSS)".

## Setup
- `.stylelintrc.json` extending `stylelint-config-standard`, `stylelint-config-recommended`, with plugins: `stylelint-order`, `stylelint-a11y`, `stylelint-declaration-strict-value`, `stylelint-no-unsupported-browser-features`.

## Rules
- No `!important` without a `/* important-reason */` justification comment.
- No IDs in selectors — use classes.
- No duplicate properties in a rule.
- No magic units — use CSS variables (`--spacing-*`, `--z-*` scales).
- No `z-index` outside a documented scale.
- No duplicated media queries — consolidate.
- No nesting deeper than 3 levels.
- No raw hex colors — use CSS variables / design tokens.
- No `font-size` in `px` without considering `rem`/`em`.
- No negative `margin`/`padding` without a context comment.

## Gate (all must pass before done)
1. `stylelint "**/*.css"`
2. Prettier check if the repo uses it

Any failure: fix, re-run, then report gate results per step.
