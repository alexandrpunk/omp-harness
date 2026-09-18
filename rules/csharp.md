# C# self-checks

1. No chained casts `(T)(object)x` without evidence — use pattern matching; trivial casts carry a justification comment.
2. No unnecessary `dynamic`; no `object` parameters where a concrete type fits.
3. LINQ: no multiple enumeration of `.Where().Select()` chains — materialize once if consumed more than once.
4. Prefer sealed `record` hierarchies for discriminated data.
5. No empty `catch` blocks — catch specific exceptions, act or wrap with context.
6. Gate: `dotnet build -warnaserror`, `dotnet format --verify-no-changes`, tests — all green before done.
