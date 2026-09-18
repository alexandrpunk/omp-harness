# TypeScript / JavaScript self-checks

1. Run the anti-slop Oxlint gate (`anti-slop-install` skill rules) before declaring done.
2. Strict types: no `any`/`unknown` where a concrete type fits; generics bounded.
3. Type assertions require an evidence comment (see `require-safety-comment-for-type-assertion`).
4. No chained `.filter().map()` where a single pass suffices.
5. Materialize LINQ/array chains once if consumed more than once.
6. Tests pass before done.
