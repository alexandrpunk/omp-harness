# EGM — Elephant-Goldfish en omp-harness

**Versión:** 0.4  
**Estado:** draft  
**Formato:** Markdown (`DESIGN.md`, raíz del repo)  
**Base:** Elephant-Goldfish Model (EGM), google/elephant-goldfish-model

## Propósito

Integrar el Elephant-Goldfish Model (EGM) en omp-harness como flujo de Spec-Driven Development (SDD). El sistema recibe requisitos generales de un proyecto, Elephant redacta la especificación con todo el contexto del proyecto, Goldfish revisa con ojos nuevos (sin el historial previo) para exponer suposiciones no declaradas y puntos ciegos, el humano aprueba la especificación, y luego el consejo de agentes ejecuta la implementación.

Todo vive en la capa de configuración del harness: agentes, extensiones, scripts y `config.yml`. Sin modificar el runtime de omp.

## Modelo oficial de EGM

| Actor | Rol | ¿Programa? | Herramientas |
|-------|-----|------------|-------------|
| **Elephant** | Mantiene el contexto del proyecto y redacta/especifica el diseño (`DESIGN.md` draft). | No — solo lectura (`read`, `grep`, `glob`). | `read`, `grep`, `glob` |
| **Goldfish** | Revisor con ojos nuevos (zero-context). Examina el borrador de diseño y el material fuente referenciado, expone suposiciones no declaradas y puntos ciegos. | No — solo lectura. | `read`, `grep`, `glob` |
| **Humano** | Hace los trade-offs arquitectónicos y aprueba la especificación **antes** de implementar. | — | — |
| **Consejo de agentes** (`implementer`, `tester`, `debugger`, `researcher`, `designer`, `docs`) | Ejecuta la implementación por slices contra la especificación aprobada. | Sí — escritura acotada por slice. | `read`, `edit`, `write`, `bash`, `grep`, `glob` |

## Decisiones de diseño

| Decisión | Valor |
|----------|-------|
| Alcance | Elephant (especificador) y Goldfish (revisor zero-context) como agentes del consejo; otros agentes como especialistas de implementación por slice |
| Artefacto de diseño | `DESIGN.md` (Markdown, raíz del repo) |
| Gate humano | Antes de implementar: aprueba la especificación (EGM oficial). Luego, antes del merge en `master` (gate adicional de omp-harness) |
| Paralelismo | Un solo Goldfish revisando a la vez |
| Runtime omp | Sin cambios |
| Ahorro de tokens | Artefacto persistente (`DESIGN.md`), modelos por rol, herramientas acotadas, Goldfish sin contexto previo (lee solo el diseño), agentes especialistas solo cuando se necesita |
| Seguridad | Elephant y Goldfish solo lectura en especificación; dry-run por defecto; bloqueo de implementación sin especificación aprobada; credenciales fuera del repo |

## Flujo de orquestación (EGM oficial + omp-harness)

```
Usuario (requisitos generales del proyecto)
    │
    ▼
Elephant (contexto completo del proyecto)
    → redacta DESIGN.md (draft/specificación)
    │  [GATE 1: Goldfish revisa con ojos nuevos]
    ▼
Goldfish (zero-context, sin historial previo)
    → examina DESIGN.md y material fuente referenciado
    → expone suposiciones no declaradas y puntos ciegos
    │  [GATE 2: Humano aprueba o rechaza la especificación]
    ▼
Humano (trade-offs arquitectónicos)
    → aprueba DESIGN.md (status: frozen) o solicita cambios
    │
    ▼
Consejo de agentes (implementer, tester, debugger, etc.)
    → implementa por slices contra DESIGN.md congelado
    → código + tests + documentación
    │  [GATE 3: Humano aprueba merge en master]
    ▼
Humano
    → aprueba o rechaza el merge final
```

### Etapa 1 — Elephant redacta la especificación

- **Entrada:** requisitos generales del usuario + contexto completo del repo (`AGENTS.md`, `README.md`, `docs/`, `agents/`, `extensions/`, `config.yml`).
- **Modelo:** `best-reasoning` (rol `reasoning`).
- **Tools:** `read`, `grep`, `glob` (solo lectura).
- **Salida:** `DESIGN.md` con versión, alcance, objetivos, arquitectura propuesta, slices, trade-offs, riesgos, criterios de aceptación, e `status: draft`.
- **Regla:** Elephant **no escribe código de producción**. Solo redacta la especificación.

### Etapa 2 — Goldfish revisa con ojos nuevos

- **Entrada:** `DESIGN.md` (draft) + material fuente referenciado en el diseño.
- **Modelo:** `cheap` o `fast`.
- **Tools:** `read`, `grep`, `glob` (solo lectura).
- **Regla crítica (EGM):** Goldfish **no conoce la conversación previa**. Lee solo el borrador de diseño y el código fuente referenciado. Esto expone suposiciones no declaradas y puntos ciegos que Elephant pudo haber pasado por alto por tener demasiado contexto.
- **Salida:** reporte de revisión con hallazgos, suposiciones detectadas, puntos ciegos, y recomendación de `approved` / `changes-requested` / `rejected`.

### Etapa 3 — Humano aprueba la especificación

- **Entrada:** `DESIGN.md` draft + reporte de revisión de Goldfish.
- **Actor:** humano.
- **Salida:** `status: frozen` (aprobado) o solicitud de cambios al Elephant.
- **Regla (EGM oficial):** el humano hace los trade-offs arquitectónicos y aprueba la especificación **antes** de que se escriba cualquier código de implementación.

### Etapa 4 — Consejo de agentes implementa

- **Entrada:** `DESIGN.md` congelado (`status: frozen`).
- **Actores:** `implementer`, `tester`, `debugger`, `researcher`, `designer`, `docs` (especialistas del consejo, invocados por slice según necesidad).
- **Modelo:** `best` / `cheap` / `fast` según el agente.
- **Tools:** `read`, `edit`, `write`, `bash`, `grep`, `glob`.
- **Salida:** código de implementación, tests, documentación, `CHECKS.md` de cumplimiento contra el diseño.
- **Regla:** ningún agente escribe código hasta que el diseño esté `frozen` y aprobado en GATE 3.

### Etapa 5 — Humano aprueba el merge (gate adicional de omp-harness)

- **Entrada:** `DESIGN.md` congelado, código implementado, `CHECKS.md`, reporte de revisión de Goldfish.
- **Actor:** humano.
- **Salida:** merge en `master` o aborto.
- **Regla:** ni Elephant, ni Goldfish, ni ningún agente del consejo puede hacer merge en `master` sin aprobación explícita del humano.

## Contrato de agentes

### `agents/elephant.md`

- **Rol:** especificador y mantenedor del contexto del proyecto.
- **Modelo:** `@reasoning`.
- **Tools:** `read`, `grep`, `glob` (solo lectura).
- **Salida obligatoria:** `DESIGN.md` con `status: draft` → `frozen`.

### `agents/goldfish.md`

- **Rol:** revisor con ojos nuevos (zero-context).
- **Modelo:** `@cheap` o `@fast`.
- **Tools:** `read`, `grep`, `glob` (solo lectura).
- **Salida obligatoria:** reporte de revisión que exponga suposiciones no declaradas y puntos ciegos del `DESIGN.md`.

## Extensiones

| Archivo | Función |
|---------|---------|
| `extensions/cpa-orchestration.ts` | Bloquea implementación de código si `DESIGN.md` no está `frozen`; bloquea `git push/merge/commit` hasta aprobación humana final. |
| `extensions/elephant-goldfish.ts` | Guarda de handoff EGM: asegura que Goldfish lea solo `DESIGN.md` y material fuente, sin contexto previo de la conversación. |
| `extensions/token-guards.ts` | Bloquea dumps de archivos vía bash (ahorro de tokens). |

## Criterios de aceptación (v0.4)

1. Existe `agents/elephant.md` con solo herramientas de lectura.
2. Existe `agents/goldfish.md` con solo herramientas de lectura y rol de revisor zero-context.
3. Existe `DESIGN.md` con campos: versión, estado (`draft`/`frozen`), alcance, objetivos, arquitectura, slices, criterios de aceptación.
4. `config.yml` registra roles `elephant` y `goldfish`.
5. Existe `extensions/cpa-orchestration.ts` que bloquea implementación sin especificación aprobada.
6. El humano debe aprobar la especificación **antes** de cualquier implementación.
7. El humano debe aprobar el merge en `master` antes de que cualquier agente escriba en la rama principal.

## Riesgos conocidos

| Riesgo | Mitigación |
|--------|------------|
| Elephant tiene demasiado contexto y pasa por alto supuestos | Goldfish revisa con ojos nuevos (zero-context) y expone puntos ciegos. |
| Implementación sin especificación aprobada | `cpa-orchestration.ts` bloquea escrituras de código si `DESIGN.md` no está `frozen`. |
| Humano salta la revisión de especificación | Proceso documentado; bloqueo técnico de implementación. |
| Diseño ambiguo para implementación | Criterios de aceptación verificables obligatorios en `DESIGN.md`. |
| Goldfish accede a conversación previa | Herramientas de solo lectura; protocolo zero-context documentado en `agents/goldfish.md`. |
