---
name: anti-slop-python
description: Anti-slop rules for Python via ruff with a broad strict ruleset; applies only to Python projects
---

# anti-slop-python

Anti-slop discipline for Python projects.

## Applicability check (first step)
- Only if the project has `pyproject.toml`, `setup.py`, or `requirements.txt`. Otherwise **STOP, change nothing**, report "anti-slop-python does not apply (no Python project)".
- If the project already uses mypy + pylint, apply the equivalents there; do not introduce a second toolchain.

## Setup
- `pyproject.toml` `[tool.ruff]` with lints: F, E/W, I, N, UP, B, A, COM, C4, DTZ, T10, EM, ISC, ICN, G, PIE, PT, RSE, RET, SLF, SIM, TID, TCH, ARG, PTH, ERA.

## Rules
- No `Any` without reason — prefer concrete types, `Protocol`, or generics.
- No bare `# type: ignore` — requires a written reason (`# type: ignore[code] <reason>`).
- No bare `dict`/`tuple` where `TypedDict`/`NamedTuple` expresses the shape.
- No nested list comprehensions — extract to a function.
- No silent `except: pass` — catch specific exceptions; act or re-raise with context.
- No single-letter variable names except short loop indices/comprehensions.
- No wildcard imports (`from x import *`).
- Every `# noqa` requires a written reason.

## Gate (all must pass before done)
1. `ruff check --fix`
2. `ruff format --check`
3. `pytest` if present

Any failure: fix, re-run, then report gate results per step.
