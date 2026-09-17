# Agent Council — Global Context

## Architecture
- **researcher** (@reasoning): external research (official docs, repos, changelogs — cited) and codebase recon; returns compressed context, never full files. Never writes code.
- **planner** (@reasoning): decomposes features into bounded tasks with acceptance criteria. Never implements.
- **implementer** (@best): fast bounded execution, TDD-first, minimal diffs.
- **designer** (@best): owns UI/UX — layout, hierarchy, motion, accessibility, component feel. Not for backend/logic.
- **reviewer** (@review): correctness/security/performance/maintainability gate; runs tests; approves or blocks.
- **debugger** (@reasoning): root-cause analysis for persistent bugs; reproduces first, fixes minimally.
- **tester** (@cheap): unit/integration tests, coverage, regression tests.
- **docs** (@cheap): docs/ADRs/README updated from actual code state.
- **observer** (@vision): isolated media analysis — screenshots, PDFs, diagrams; returns structured text only.

## Routing rules
- Default flow: **researcher → planner → implementer/designer → reviewer**.
  - researcher for docs and codebase recon before planning; skip when context already has the answer.
  - designer for any user-facing UI change; implementer for logic/backend.
- **tester** runs in parallel after implementation, before review completes.
- **debugger** only for bugs that survive one fix attempt.
- **observer** for media analysis (screenshots, PDFs, diagrams) — keeps media bytes out of main context.
- **docs** after reviewer approval.

## Token policy
- Delegate bounded tasks; keep main context lean.
- Use **@cheap** (tester, docs) for mechanical work; **@reasoning** only where deep analysis pays.
- Compact at phase boundaries. See `context-hygiene` skill.

## Available skills
- `anti-slop-install`: vendor dmmulroy/anti-slop Oxlint rules into TS/JS projects (no-op otherwise).
- Anti-slop per language: `anti-slop-csharp`, `anti-slop-php`, `anti-slop-rust`, `anti-slop-python`, `anti-slop-go`, `anti-slop-css`, `anti-slop-html` (each checks applicability first; no-op otherwise).
- `thermos-quality`: pre-delivery quality gate (format/lint/tests/build + anti-slop checklist). Blocks "done".
- `context-hygiene`: token-optimization discipline.
- ECC curated: `frontend-patterns`, `backend-patterns`, `database-migrations`, `design-system`, `postgres-patterns`, `redis-patterns`, `error-handling`, `deployment-patterns`.
