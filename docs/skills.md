# Skills

Skills disponibles en el harness. Fuente: `skills/<name>/SKILL.md`.

## Propios

| Skill | Propósito |
|---|---|
| anti-slop-install | Instala las reglas Oxlint anti-slop (dmmulroy/anti-slop) en proyectos TS/JS: vendor de reglas, merge de `.oxlintrc.json`, `npx oxlint`. Solo JS/TS — sale sin cambios en otros lenguajes. |
| anti-slop-csharp | Anti-slop para C#: analizadores Roslyn + `.editorconfig`, `dotnet build -warnaserror`, `dotnet format --verify-no-changes`, tests. Solo proyectos .NET (.csproj/.sln). |
| anti-slop-php | Anti-slop para PHP: PHPStan level max + strict rules, casts encadenados, tipos shapes, supresiones con razón escrita. Solo proyectos composer. |
| thermos-quality | Gate de calidad pre-entrega multilenguaje: formatter + linter + tests + build/typecheck + checklist anti-slop manual. Bloquea "done" hasta pasar todo. |
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
