# Go self-checks

1. errcheck clean — no `_ = err`; handle, wrap, or propagate every error.
2. `context.Context` is always the first parameter.
3. Error wrapping adds context: `fmt.Errorf("doing X: %w", err)`.
4. No `interface{}`/`any` without reason — prefer concrete types or small interfaces.
5. Every `//nolint` directive carries a written reason.
6. `golangci-lint run`, `go test ./...`, `go vet ./...` pass before done.
