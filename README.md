# omp-harness

Configuración documentada del harness "oh my pi" (omp). Este proyecto es la copia versionable de `~/.omp/agent/`; la configuración activa vive ahí.

## Qué es

Un harness de agentes para omp con un "concilio" de 6 agentes especializados, roles de modelos mapeados a un proveedor omniroute (endpoint OpenAI-compatible), memoria local con inyección de resúmenes, compaction en fronteras de fase, y un catálogo de skills (propios + curados de ECC).

## Arquitectura del concilio

| Agente | Rol modelo | Uso |
|---|---|---|
| researcher | @reasoning | Investigación externa (docs/repos oficiales, con citas) y recon del codebase; contexto comprimido, nunca archivos completos. |
| planner | @reasoning | Descompone features en tareas acotadas con criterios de aceptación. Nunca implementa. |
| implementer | @best | Ejecución rápida y acotada, TDD-first, diffs mínimos. |
| designer | @best | Dueño de UI/UX: layout, jerarquía, motion, accesibilidad, feel de componentes. No para backend/lógica. |
| reviewer | @review | Gate de review: corrección, seguridad, rendimiento, mantenibilidad; corre tests; aprueba o bloquea. |
| debugger | @reasoning | Análisis de causa raíz; reproduce primero, hipótesis, fix mínimo. |
| tester | @cheap | Tests unitarios/integración, coverage, tests de regresión. |
| docs | @cheap | Actualiza docs/ADRs/README desde el estado real del código. |
| observer | @vision | Análisis aislado de medios (screenshots, PDFs, diagramas); devuelve texto estructurado. |

**Enrutamiento por defecto:** researcher → planner → implementer/designer → reviewer; tester en paralelo post-implementación; debugger solo para bugs persistentes (supervivientes a un intento de fix); observer para análisis de medios; docs tras aprobación del reviewer.

## Roles de modelos

| Rol | Modelo |
|---|---|
| default | omniroute/zai-coding-plan/glm-5.2 |
| cheap | omniroute/auto/cheap |
| fast | omniroute/auto/fast |
| best | omniroute/auto/best-coding |
| reasoning | omniroute/auto/best-reasoning |
| vision | omniroute/auto/best-vision |
| review | omniroute/auto/pro-coding:high |

## Skills

Ver `docs/skills.md` para la tabla completa. Incluye skills propios (anti-slop-install, thermos-quality, context-hygiene, design-md, anti-slop para 7 lenguajes), skills de proceso portados de obra/superpowers (brainstorming, writing-plans, systematic-debugging, test-driven-development), frontend-design (Anthropic) y 8 skills curados del repo [affaan-m/ECC](https://github.com/affaan-m/ECC).

> Cobertura anti-slop para **7 lenguajes**: JS/TS (`anti-slop-install`, Oxlint de dmmulroy/anti-slop — solo JS/TS), C# (`anti-slop-csharp`), PHP (`anti-slop-php`), Rust (`anti-slop-rust`), Python (`anti-slop-python`), Go (`anti-slop-go`) y CSS/HTML (`anti-slop-css`, `anti-slop-html`). Cada skill verifica aplicabilidad primero y sale sin cambios si el lenguaje no corresponde.

## Instalación

```bash
# copiar configuración al destino activo
cp config.yml models.yml AGENTS.md ~/.omp/agent/
cp agents/*.md ~/.omp/agent/agents/
cp -r skills/* ~/.omp/agent/skills/  # o copiar solo los skills deseados

# API key (models.yml de este repo lleva placeholder)
export OMNIROUTE_API_KEY="sk-..."
```

## Política de tokens / memoria / compaction

- **Tokens:** delegar tareas acotadas a subagentes; `@cheap` para trabajo mecánico (tester, docs); `@reasoning` solo donde el análisis profundo lo paga. Ver skill `context-hygiene`.
- **Memoria:** backend local, `summaryInjectionTokenLimit: 5000` — inyección de resúmenes acotada a 5k tokens.
- **Compaction:** habilitada, orden de métodos `remote → snapcompact → handoff → shake → soft`; compactar en fronteras de fase (post-planning, post-implementación, post-review), nunca a mitad de tarea.

## Token optimization

Además de la política anterior, dos mecanismos activos:

- **`extensions/token-guards.ts`** (registrado en config.yml): hook de omp que (1) bloquea volcados de archivos de código vía `cat`/`head`/`tail` en bash (obliga a usar la herramienta read con offset/limit; pipelines con pipe quedan permitidos), y (2) trunca resultados de herramientas bash/read que superen ~8000 caracteres conservando head (60%) y tail (40%) con marcador claro. Debug silenciable con `TOKEN_GUARDS_QUIET=1`.
- **`extensions/security-guidance.ts`** (también en config.yml): hook que inspecciona el contenido de edit/write y bloquea secrets hardcodeados (API keys AWS/Google/GitHub, private keys) y patrones peligrosos (eval interpolado, exec con template literals, SQL concatenado, innerHTML con variable, http:// en APIs). Exenta test fixtures, archivos `.example`/`.md` y placeholders. `SECURITY_STRICT=false` para solo-log; silenciable con `SECURITY_QUIET=1`.
- **`rules/*.md`** — reglas de self-check por stack (TypeScript, Python, Go, Rust, C#, PHP). El agente debe leer la del lenguaje dominante al inicio de sesión y verificarlas antes de declarar done. Cada regla empareja con su skill `anti-slop-*`.

Técnicas adaptadas del artículo de Medium de abdulgafoorabid sobre optimización de tokens en coding agents.
