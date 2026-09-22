# Skills

Skills disponibles en el harness. Fuente: `skills/<name>/SKILL.md`.

## Propios

| Skill | Propósito |
|---|---|
| anti-slop-install | Instala las reglas Oxlint anti-slop (dmmulroy/anti-slop) en proyectos TS/JS: vendor de reglas, merge de `.oxlintrc.json`, `npx oxlint`. Solo JS/TS — sale sin cambios en otros lenguajes. |
| anti-slop-csharp | Anti-slop para C#: analizadores Roslyn + `.editorconfig`, `dotnet build -warnaserror`, `dotnet format --verify-no-changes`, tests. Solo proyectos .NET (.csproj/.sln). |
| anti-slop-php | Anti-slop para PHP: PHPStan level max + strict rules, casts encadenados, tipos shapes, supresiones con razón escrita. Solo proyectos composer. |
| thermos-quality | Gate de calidad pre-entrega multilenguaje: formatter + linter + tests + build/typecheck + checklist anti-slop manual. Bloquea "done" hasta pasar todo. |
| anti-slop-rust | Anti-slop para Rust: cargo clippy (pedantic/nursery/cargo), no clones/unwrap injustificados, lazy iterators. Gate: clippy -D warnings + cargo test + fmt --check. Solo proyectos Cargo. |
| anti-slop-python | Anti-slop para Python: ruff con reglas amplias (F/E/I/B/C4/SIM/...), no Any/type: ignore sin razón, TypedDict/NamedTuple. Gate: ruff check --fix + format --check + pytest. Solo proyectos Python. |
| anti-slop-go | Anti-slop para Go: golangci-lint completo, no interface{} sin razón, no errores ignorados, context primero, %w con contexto. Gate: golangci-lint + go test + go vet. Solo go.mod. |
| anti-slop-css | Anti-slop para CSS: stylelint standard + plugins (order/a11y), no !important/IDs/z-index mágicos, variables para colores y unidades. Gate: stylelint + prettier. Solo con CSS. |
| anti-slop-html | Anti-slop para HTML: html-validate, no divitis/inline styles/onclick/tabindex>0, semántica, alt obligatorio. Gate: html-validate. Solo con HTML. |
| design-md | Crear y mantener DESIGN.md — contrato de identidad visual del producto (tokens en frontmatter + reglas de uso); previene defaults genéricos de IA y design drift. |
| brainstorming | Metodología de obra/superpowers: exploración de intención y requisitos antes de cualquier trabajo creativo. → planner |
| writing-plans | Metodología de obra/superpowers: specs arquitectónicas y planes ejecutables. → planner |
| systematic-debugging | Metodología de obra/superpowers: debugging sistemático, cuatro fases, sin fix sin causa raíz. → debugger |
| test-driven-development | Metodología de obra/superpowers: TDD estricto, red-green-refactor, commits atómicos. → implementer/tester |
| frontend-design | Skill oficial de Anthropic: dirección estética distintiva para UI nueva. Se usa con design-md (DESIGN.md sigue siendo la fuente de verdad). → designer |
| context-hygiene | Optimización de tokens: cuándo delegar a subagentes, compactar en fronteras de fase, leer solo rangos necesarios, modo silencioso. |

## Curados de ECC (affaan-m/ECC)

| Skill | Propósito |
|---|---|
| frontend-patterns | Patrones frontend curados. |
| backend-patterns | Patrones backend curados. |
| database-migrations | Guías de migraciones de base de datos. |
| design-system | Guías de sistema de diseño. |
| postgres-patterns | Patrones PostgreSQL. |
| redis-patterns | Patrones Redis. |
| error-handling | Estrategias de manejo de errores. |
| deployment-patterns | Patrones de despliegue. |
