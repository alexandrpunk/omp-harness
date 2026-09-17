---
name: anti-slop-go
description: Anti-slop rules for Go via golangci-lint, govet, and staticcheck; applies only to go.mod projects
---

# anti-slop-go

Anti-slop discipline for Go projects.

## Applicability check (first step)
- Only if the project contains `go.mod`. Otherwise **STOP, change nothing**, report "anti-slop-go does not apply (no Go project)".

## Setup
- `.golangci.yml` with linters: govet, errcheck, staticcheck, unused, gosimple, ineffassign, typecheck, gofmt, goimports, misspell, revive, gocritic, gosec, prealloc, unconvert, unparam, whitespace.

## Rules
- No `interface{}`/`any` without reason — prefer concrete types or small specific interfaces.
- No `_ = err` — never discard errors; handle, wrap, or propagate.
- No confusing variable shadowing — especially shadowed `err` inside nested blocks.
- No `defer` inside loops without written justification (resource leak / delayed execution).
- `context.Context` must be the first parameter.
- No unused imports (gofmt/goimports detect).
- Error wrapping must add context: `fmt.Errorf("doing X: %w", err)`.
- Every `//nolint` directive requires a reason: `//nolint:gosec <reason>`.

## Gate (all must pass before done)
1. `golangci-lint run`
2. `go test ./...`
3. `go vet ./...`

Any failure: fix, re-run, then report gate results per step.
