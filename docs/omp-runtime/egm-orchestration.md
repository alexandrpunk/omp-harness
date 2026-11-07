# Orquestación EGM en omp-harness

Capa de orquestación ligera sobre omp basada en el **Elephant-Goldfish Model (EGM)** oficial de Google (Spec-Driven Development).

## Modelo oficial de EGM

| Actor | Rol | ¿Programa? |
|-------|-----|------------|
| **Elephant** | Mantiene el contexto completo del proyecto y redacta/especifica el diseño (`DESIGN.md`). | **No** — solo lectura (`read`, `grep`, `glob`). |
| **Goldfish** | Revisor con ojos nuevos (zero-context). Examina el borrador de diseño y el material fuente sin el historial previo, exponiendo suposiciones no declaradas y puntos ciegos. | **No** — solo lectura. |
| **Humano** | Hace los trade-offs arquitectónicos y aprueba la especificación **antes** de implementar. | — |
| **Consejo de agentes** (`implementer`, `tester`, `debugger`, `researcher`, `designer`, `docs`) | Ejecuta la implementación por slices contra la especificación aprobada. | **Sí** — escritura acotada por slice. |

## Arquitectura

```
Usuario (requisitos generales del proyecto)
    │
    ▼
Elephant (contexto completo)
    → redacta DESIGN.md (draft)
    │  [GATE 1: Goldfish revisa con ojos nuevos]
    ▼
Goldfish (zero-context, sin historial previo)
    → examina DESIGN.md y material fuente referenciado
    → expone suposiciones no declaradas y puntos ciegos
    │  [GATE 2: Humano aprueba la especificación]
    ▼
Humano (trade-offs arquitectónicos)
    → aprueba DESIGN.md (status: frozen) o solicita cambios
    │
    ▼
Consejo de agentes (implementer, tester, debugger, etc.)
    → implementa por slices contra DESIGN.md congelado
    → código + tests + documentación + CHECKS.md
    │  [GATE 3: Humano aprueba merge en master]
    ▼
Humano
    → aprueba o rechaza el merge final
```

## Componentes

| Archivo | Rol |
|---------|-----|
| `DESIGN.md` | Especificación del proyecto (draft → frozen) |
| `agents/elephant.md` | Agente especificador: contexto completo, solo lectura |
| `agents/goldfish.md` | Agente revisor: ojos nuevos (zero-context), solo lectura |
| `extensions/cpa-orchestration.ts` | Bloquea implementación si DESIGN.md no está frozen y aprobado |
| `extensions/elephant-goldfish.ts` | Guarda de handoff EGM |
| `extensions/token-guards.ts` | Bloquea dumps de archivos vía bash (ahorro de tokens) |
| `scripts/orchestrate.sh` | Punto de entrada que ejecuta el flujo con gates de usuario |
| `scripts/setup.sh` | Instalador: copia extensiones al directorio OMP activo |
| `config.yml` | Roles `elephant` (`@reasoning`) y `goldfish` (`@cheap`) |

## Flujo de etapas

### Etapa 1 — Elephant redacta la especificación

Elephant lee el contexto completo del repo y los requisitos del usuario, y escribe `DESIGN.md` con `status: draft`. Nunca escribe código de producción.

### Etapa 2 — Goldfish revisa con ojos nuevos

Goldfish lee solo `DESIGN.md` y el material fuente referenciado, **sin el historial de la conversación previa**. Esto expone suposiciones no declaradas y puntos ciegos que Elephant pudo haber pasado por alto. Produce un reporte de revisión.

### GATE 1 — Humano aprueba la especificación (EGM oficial)

El humano revisa `DESIGN.md` y el reporte de Goldfish, hace los trade-offs arquitectónicos, y aprueba o rechaza la especificación. **No hay implementación hasta aprobar.**

### Etapa 3 — Consejo de agentes implementa

Una vez `DESIGN.md` está `frozen`, los agentes especialistas del consejo (`implementer`, `tester`, `debugger`, etc.) implementan por slices. Escriben código, tests y `CHECKS.md`.

### GATE 2 — Humano aprueba el merge (gate adicional de omp-harness)

El humano revisa todo y aprueba o rechaza el merge en `master`. Solo el humano puede escribir en `master`.

## Seguridad

- Elephant y Goldfish tienen solo herramientas de lectura.
- Dry-run por defecto (`SECURITY.md`).
- `cpa-orchestration.ts` bloquea escrituras de código si `DESIGN.md` no está `frozen` y aprobado.
- `elephant-goldfish.ts` bloquea operaciones de git hasta que el diseño esté congelado.
- Credenciales nunca versionadas (`.gitignore`).

## Ahorro de tokens

- `DESIGN.md` es el artefacto persistente; no se re-lee el historial de chat.
- Goldfish usa zero-context (solo lee el diseño, no el historial).
- Modelos por rol: `best-reasoning` solo para especificación; `cheap`/`fast` para revisión y especialistas.
- `token-guards.ts` bloquea dumps de archivos vía bash.

## Instalación

```sh
./scripts/setup.sh
```

Luego, para iniciar un proyecto:

```sh
./scripts/orchestrate.sh <archivo-de-requisitos>
```

Para ver el manual:

```sh
./scripts/show-manual.sh
```
