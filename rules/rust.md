# Rust self-checks

1. `cargo clippy --all-targets --all-features -- -D warnings` clean.
2. No `unwrap()`/`expect()` without documented invariant or context — prefer `Result`/`Option` handling.
3. Iterators stay lazy — no intermediate `.collect()` unless the collection is reused.
4. No unjustified `.clone()` — borrow or restructure.
5. Every `#[allow(clippy::...)]` has a reason comment above it.
6. `cargo test` and `cargo fmt --check` pass before done.
