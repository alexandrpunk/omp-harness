# EGM — Elephant-Goldfish en omp-harness

**Versión:** 0.4
**Status:** frozen
**Specification approved:** yes
**Aprobado por:** usuario (indicación directa, 2026-11-07)
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
| Operaciones no bloqueadas | Correcciones operativas, ajuste de errores, commits y pushes de git quedan bajo control del usuario y del flujo de git; el diseño EGM no bloquea estas acciones |

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
    → código + tests + docs
    │  [GATE 3: Humano aprueba merge en master]
    ▼
Humano
    → aprueba o rechaza el merge final
```

### Etapa 1 — Elephant redacta la especificación

- **Entrada:** requisitos generales
- **Salida:** `DESIGN.md` con status: draft
- **Acción:** Elephant lee el proyecto completo y redacta la especificación técnica.

### Etapa 2 — Goldfish revisa (zero-context)

- **Entrada:** `DESIGN.md` (draft) + material fuente referenciado
- **Salida:** Comentarios y puntos ciegos detectados
- **Acción:** Goldfish revisa sin historial previo, exponiendo suposiciones no declaradas.

### Etapa 3 — Humano aprueba

- **Entrada:** `DESIGN.md` (draft) + comentarios de Goldfish
- **Salida:** `DESIGN.md` con status: frozen (o cambios solicitados)
- **Acción:** Humano hace trade-offs arquitectónicos y aprueba.

### Etapa 4 — Consejo implementa

- **Entrada:** `DESIGN.md` (frozen)
- **Salida:** Código + tests + docs
- **Acción:** Agentes implementan por slices contra la especificación congelada.

## Extensiones

| Archivo | Función |
|---------|---------|
| `extensions/elephant-goldfish.ts` | Auditoria de estado EGM: registra cuando DESIGN.md está frozen; ya no bloquea escrituras ni operaciones git |
| `extensions/cpa-orchestration.ts` | Orquestación de agentes (Council, Parallel, Adversarial); solo auditoría, sin bloqueo operativo |

## Especificación — corrección de rutas anidadas en scripts/setup.sh

**Problema:** El instalador acepta la ruta de instalación de OMP sin normalizarla. Cuando el usuario pega una ruta absoluta que ya contiene su directorio home (p. ej. `/home/alex/home/alex/.omp/agent`), o rutas con componentes `//` duplicados, el script las acepta tal cual e instala `config.yml`, `models.yml` y `.env` en la ruta anidada incorrecta. El runtime omp lee desde `~/.omp/agent`, por lo que no encuentra el `.env` ni el endpoint real, y reporta que no detecta la configuración del modelo.

**Fix requerido:**
1. Normalizar la ruta de instalación tras la expansión de `~`: colapsar `//` repetidos y descartar componentes vacíos o `.` antes de validar y usar la ruta.
2. Rechazar explícitamente una ruta que anide `$HOME` dentro de sí misma (p. ej. `/home/alex/home/alex/...`) con un mensaje de error claro.
3. Mantener todas las validaciones existentes (sin caracteres de control, absoluta, no sistema, sin `..`).
4. No cambiar el comportamiento para rutas válidas y bien formadas.

**Slices de implementación:**
- Slice 1: Añadir función `normalize_path` y aplicarla a `omp_dir` tras la expansión de `~` (líneas ~57-61 de `scripts/setup.sh`).
- Slice 2: Añadir guardia de ruta home-anidada tras la normalización.
- Slice 3: Ejecutar `scripts/setup.sh` en dry-run/local contra rutas válidas, rutas con `//` y ruta home-anidada; verificar que solo las válidas avancen.

**Criterios de aceptación:**
- `scripts/setup.sh` normaliza `//home/alex//.omp/agent` a `/home/alex/.omp/agent`.
- `scripts/setup.sh` rechaza `/home/alex/home/alex/.omp/agent` con mensaje de error y salida != 0.
- Rutas válidas (`~/.omp/agent`, `/home/alex/.omp/agent`) siguen funcionando sin cambios.
- El `.env` resultante se escribe exactamente en el directorio de instalación normalizado.

## Riesgos conocidos (adición)

| Riesgo | Mitigación |
|--------|------------|
| Normalización demasiado agresiva altera rutas intencionales con enlaces simbólicos | La normalización colapsa solo `//` y `.`; no resuelve `..` (ya rechazado) ni enlaces simbólicos (se resuelven después con `cd && pwd` si el directorio existe). |
| Usuario pega ruta con `$HOME` literal sin expandir | El `case ~/*)` existente expande `~` antes de normalizar; `$HOME` literal queda como componente y pasa a la validación absoluta. |