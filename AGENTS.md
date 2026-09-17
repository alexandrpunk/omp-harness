# Agent Council — Global Context

## Architecture
- **planner** (@reasoning): decomposes features into bounded tasks with acceptance criteria. Never implements.
- **implementer** (@best): fast bounded execution, TDD-first, minimal diffs.
- **reviewer** (@review): correctness/security/performance/maintainability gate; runs tests; approves or blocks.
- **debugger** (@reasoning): root-cause analysis for persistent bugs; reproduces first, fixes minimally.
- **tester** (@cheap): unit/integration tests, coverage, regression tests.
- **docs** (@cheap): docs/ADRs/README updated from actual code state.

## Routing rules
- Default flow: **planner → implementer → reviewer**.
- **tester** runs in parallel after implementation, before review completes.
- **debugger** only for bugs that survive one fix attempt.
- **docs** after reviewer approval.

## Token policy
- Delegate bounded tasks; keep main context lean.
- Use **@cheap** (tester, docs) for mechanical work; **@reasoning** only where deep analysis pays.
- Compact at phase boundaries. See `context-hygiene` skill.

## Available skills
- `anti-slop-install`: vendor dmmulroy/anti-slop Oxlint rules into TS/JS projects (no-op otherwise).
- `thermos-quality`: pre-delivery quality gate (format/lint/tests/build + anti-slop checklist). Blocks "done".
- `context-hygiene`: token-optimization discipline.
- ECC curated: `frontend-patterns`, `backend-patterns`, `database-migrations`, `design-system`, `postgres-patterns`, `redis-patterns`, `error-handling`, `deployment-patterns`.
