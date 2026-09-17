---
name: anti-slop-php
description: Anti-slop rules for PHP via PHPStan level max with strict rules; only applies to composer projects
---

# anti-slop-php

Anti-slop discipline for PHP projects.

## Applicability check (first step)
- Only if the project contains `composer.json`. Otherwise **STOP, change nothing**, report "anti-slop-php does not apply (no composer project)".

## Setup
- PHPStan at level max with strict rules (`phpstan/extension-installer`, `phpstan/phpstan-strict-rules`); configure `phpstan.neon` with:
  - `checkMissingCallableSignature: true`
  - `checkAlwaysTrueCheckTypeFunctionCall: true`
  - `checkAlwaysTrueInstanceof: true`
  - `reportAlwaysTrueInLastCondition: true`
- If the project already uses Psalm, apply the equivalents there instead; do not introduce a second analyzer.

## Rules
- No chained casts `(int)(string)$x` without evidence — validate or use a single typed conversion with a justification comment.
- No untyped parameters; no unnecessary `mixed` where a concrete type or union fits.
- No bare `array` where a shape is expressible — declare `@phpstan-type` and use it.
- Avoid double passes `array_filter` + `array_map` when a single loop or one pass suffices, unless the intermediate is reused.
- No silent `catch` — catch specific exceptions; act or rethrow with context.
- Any suppression requires a written reason: `@phpstan-ignore-next-line <reason>` — bare ignores are blockers.

## Gate (all must pass before done)
1. `vendor/bin/phpstan analyse --level max`
2. `vendor/bin/phpunit` if present

Any failure: fix, re-run, then report gate results per step.
