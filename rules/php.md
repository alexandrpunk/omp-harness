# PHP self-checks

1. `vendor/bin/phpstan analyse --level max` clean (strict rules from the `anti-slop-php` skill).
2. No chained casts `(int)(string)$x` without evidence or a justification comment.
3. No untyped parameters; no unnecessary `mixed`; use `@phpstan-type` shapes instead of bare `array`.
4. Avoid `array_filter`+`array_map` double passes when one loop suffices.
5. No silent `catch` — catch specific exceptions, act or rethrow with context.
6. Every `@phpstan-ignore` carries a written reason.
7. `vendor/bin/phpunit` passes before done.
