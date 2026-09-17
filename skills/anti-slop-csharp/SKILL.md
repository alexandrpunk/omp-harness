---
name: anti-slop-csharp
description: Anti-slop rules for C# via Roslyn analyzers and .editorconfig; JS/TS-only anti-slop does not apply here
---

# anti-slop-csharp

Anti-slop discipline for C# projects.

## Applicability check (first step)
- Only if the project contains a `.csproj` or `.sln`. Otherwise **STOP, change nothing**, report "anti-slop-csharp does not apply (no .NET project)".

## Setup
- Configure Roslyn analyzers via `.editorconfig`; set `TreatWarningsAsErrors=true` in the csproj for the rules below.
- Wire `dotnet format` into the gate.

## Rules (severity mapping in .editorconfig)
- No chained casts `(T)(object)x` without evidence — verify the runtime type or use pattern matching (`if (x is T t)`); trivial casts require a justification comment.
- No unnecessary `dynamic` — use concrete types or generics.
- No `object` parameters where a concrete type fits.
- LINQ: avoid multiple enumeration of `.Where().Select()` chains — materialize once (`ToList()`) if consumed more than once; no defensive copies of already-immutable data.
- Prefer concrete types; model discriminated unions via sealed `record` hierarchies.
- No empty `catch` blocks — catch specific exceptions, act or wrap with context.

## Gate (all must pass before done)
1. `dotnet build -warnaserror`
2. `dotnet format --verify-no-changes`
3. Run the test suite (`dotnet test`)

Any failure: fix, re-run, then report gate results per step.
