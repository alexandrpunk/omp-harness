# Python self-checks

1. Run ruff with the full lint set from the `anti-slop-python` skill.
2. No `Any` or `# type: ignore` without a written reason.
3. Use `TypedDict`/`NamedTuple` shapes instead of bare `dict`/`tuple` where expressible.
4. No `except: pass` — catch specific exceptions, act or re-raise with context.
5. Every `# noqa` carries a reason.
6. `pytest` passes before done.
