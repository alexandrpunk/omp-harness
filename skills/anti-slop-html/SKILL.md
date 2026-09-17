---
name: anti-slop-html
description: Anti-slop rules for HTML via html-validate or nu validator; applies only to projects with HTML files
---

# anti-slop-html

Anti-slop discipline for HTML.

## Applicability check (first step)
- Only if the project has `.html` files or `package.json` with html-validate configured. Otherwise **STOP, change nothing**, report "anti-slop-html does not apply (no HTML)".

## Setup
- `.htmlvalidate.json` with rules: no-inline-style, no-obsolete-elements, prefer-button, require-sri, valid-id, no-dup-id, no-redundant-role, require-lang, require-title, no-positive-tabindex.

## Rules
- No divitis — use semantic elements (`article`, `section`, `nav`, `header`, `footer`) where they fit.
- No inline `style` attributes — move to CSS.
- No `onclick`/`onchange` handlers — use `addEventListener`.
- No `tabindex` > 0.
- No `<b>`/`<i>` — use `<strong>`/`<em>`.
- No obsolete attributes (`align`, `valign`, `bgcolor`).
- No `<marquee>`/`<blink>`.
- `img` requires `alt`.
- No generic link text ("click here") — describe the destination.
- No `<a href="#">` without purpose.
- No `<br>` for spacing — use CSS.

## Gate (all must pass before done)
1. `html-validate "*.html"` or nu validator if available

Any failure: fix, re-run, then report gate results per step.
