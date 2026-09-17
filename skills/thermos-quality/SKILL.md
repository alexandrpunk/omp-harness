---
name: thermos-quality
description: "Pre-delivery quality gate: format, lint, test, build, anti-slop checklist; block done until all pass"
---

# thermos-quality

Quality gate before declaring a task done. Inspired by Cursor's thermos. Multi-language.

## Gate steps (all must pass)

1. **Detect language** from files in scope.
2. **Formatter**: run the repo's formatter (biome/prettier for JS/TS, black/ruff for Python, gofmt for Go, rustfmt for Rust, swift-format for Swift). Fix violations.
3. **Linter**: run the repo's linter. Fix violations.
4. **Tests**: run the project's test suite; all must pass.
5. **Build/typecheck**: run `tsc --noEmit` (TS) or project build command; must succeed.
6. **Anti-slop checklist** (all languages):
   - No `assert` / casts without evidence comment
   - No generic `object`/`any`/`unknown` params where concrete types fit
   - No chained `.filter().map()` that could be single-pass (JS/TS); equivalent eager pipelines elsewhere
   - No speculative abstractions
   - No TODO without ticket reference
7. If any step fails: **BLOCK done**, report failure reason, do not mark complete.
