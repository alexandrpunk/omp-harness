---
name: anti-slop-install
description: Install dmmulroy/anti-slop Oxlint rules into TS/JS projects; exits without changes for other languages
---

# anti-slop-install

Install the anti-slop Oxlint rules (dmmulroy/anti-slop) into the current project.

## Applicability check (first step)
- If the project has no `package.json` or no JS/TS source files: **STOP, change nothing**, and report "anti-slop does not apply (Oxlint parses JS/TS only)".

## Steps
1. Verify `package.json` exists; identify package manager (lockfile).
2. Vendor the rules: clone https://github.com/dmmulroy/anti-slop and copy its rules into `tools/oxlint/anti-slop/` in the project.
3. Add `@oxlint-plugins` dependency to `package.json` (correct version for the project's oxlint).
4. Merge `.oxlintrc.json` with the anti-slop rules:
   - no-array-filter-map
   - no-chained-type-assertions
   - no-widen-then-assert
   - no-known-value-widening
   - no-object-parameters
   - no-unknown-parameters
   - no-unknown-returns
   - no-conditional-empty-object-spread
   - no-reduce-accumulator-copy
   - require-safety-comment-for-type-assertion
   Merge only — preserve existing config.
5. Run `npx oxlint` and fix findings.
