---
name: anti-slop-rust
description: Anti-slop rules for Rust via cargo clippy strict lints; applies only to cargo projects
---

# anti-slop-rust

Anti-slop discipline for Rust projects.

## Applicability check (first step)
- Only if the project contains `Cargo.toml`. Otherwise **STOP, change nothing**, report "anti-slop-rust does not apply (no cargo project)".

## Setup
- Enable strict lints at crate level (`#![warn(...)]`) or `.clippy.toml`:
  - `clippy::pedantic`
  - `clippy::nursery` (selective — enable reviewed rules only)
  - `clippy::cargo`

## Rules
- No unnecessary `.clone()` — borrow, `Cow`, or restructure instead; justify every clone.
- No `unwrap()`/`expect()` in production code — handle `Result`/`Option` properly; `expect` only in tests or with documented invariant.
- No `.into()` chains without evidence the types align — prefer explicit conversions at boundaries.
- No `Box<dyn Any>` without reason.
- No generic parameters without bounds / unnecessary generics where a concrete type fits.
- Avoid intermediate `.collect()` in iterators — prefer lazy evaluation; materialize once only when reused.
- No confusing shadowing — shadow only for type transformations (`let x = x.len()`), never to reuse a name for unrelated data.
- Every `#[allow(clippy::...)]` requires a written reason comment above it.

## Gate (all must pass before done)
1. `cargo clippy --all-targets --all-features -- -D warnings`
2. `cargo test`
3. `cargo fmt --check`

Any failure: fix, re-run, then report gate results per step.
