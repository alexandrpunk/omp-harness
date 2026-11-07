# Manual de uso — Orquestación EGM + Consejo de Agentes (omp-harness)

Sistema ligero para recibir requisitos generales de un proyecto, analizarlos, diseñar la estrategia de ejecución, llevarla a cabo por slices con agentes del consejo de omp, y esperar aprobación humana antes de cualquier merge en `master`.

---

## Comando principal

```sh
./scripts/orchestrate.sh <archivo-de-requisitos>
```

**Ejemplo:**

```sh
./scripts/orchestrate.sh requisitos-mi-proyecto.txt
```

Este script ejecuta todo el flujo end-to-end con pausas de usuario en los gates críticos.

---

## ¿Qué hace el sistema?

| Etapa | Quién actúa | Qué hace | Interacción con el usuario |
|-------|-------------|----------|---------------------------|
| 1 | **Elephant** (planificador, `@reasoning`) | Lee los requisitos, analiza el contexto del repo, escribe `DESIGN.md` (draft) con alcance, estrategia, slices y criterios de aceptación | — |
| **GATE 1** | **Usuario** | Revisa `DESIGN.md`. Aprueba, pide cambios o edita manualmente | Sí — antes de congelar |
| 2 | **Usuario** | Marca `DESIGN.md` como `status: frozen` | Sí — congelar o abortar |
| 3 | **Goldfish** (ejecutor, `@cheap`/`@fast`) | Implementa los slices del diseño. Puede invocar especialistas del consejo (`implementer`, `tester`, `debugger`, `researcher`, `designer`, etc.) | Puede pedir aclaración si el diseño es ambiguo |
| 4 | **Elephant** | Revisa el patch de Goldfish contra `DESIGN.md`. Devuelve `approved` o `rejected` con motivación | — |
| **GATE 2** | **Usuario** | Revisa diseño, cambios, `CHECKS.md` y veredicto del Elephant. Aprueba o rechaza el merge en `master` | Sí — gate final obligatorio |

---

## Flujo paso a paso

### Paso 1: Preparar el archivo de requisitos

Crea un archivo de texto con lo que quieres construir. Puede ser breve o detallado:

```
quiero una CLI en Python que lea archivos CSV, valide esquemas y exporte a JSON.
Debe soportar archivos grandes sin cargar todo en memoria.
Incluye tests unitarios y un README de uso.
```

### Paso 2: Ejecutar el orquestador

```sh
./scripts/orchestrate.sh requisitos-mi-proyecto.txt
```

El script:
1. Muestra los requisitos que leyó.
2. Pide confirmación para iniciar el diseño del Elephant.
3. Espera a que `DESIGN.md` exista (escrito por el Elephant en la sesión de OMP).
4. **GATE 1:** Muestra `DESIGN.md` y pregunta si lo apruebas para congelarlo.
5. Si aceptas, marca `status: frozen` y pide confirmación para ejecutar al Goldfish.
6. Espera a que `CHECKS.md` exista (evidencia de cumplimiento del diseño).
7. Pide confirmación para revisión del Elephant.
8. **GATE 2:** Muestra todo y pide aprobación final para el merge en `master`.

### Paso 3: Revisar los artefactos

Después de cada etapa, estos archivos son la fuente de verdad:

| Archivo | Qué contiene | Quién lo escribe |
|---------|--------------|------------------|
| `DESIGN.md` | Diseño congelado: alcance, requisitos, estrategia, slices, criterios de aceptación | Elephant |
| `CHECKS.md` | Evidencia de cumplimiento punto por punto del `DESIGN.md` | Goldfish |
| Código modificado | Implementación mínima por slice | Goldfish (+ especialistas del consejo) |
| Tests | Pruebas que cubren los criterios de aceptación | Goldfish (+ tester del consejo) |

---

## Agentes del consejo y cuándo se invocan

| Agente | Rol en EGM | Modelo | Herramientas |
|--------|-----------|--------|-------------|
| **Elephant** | Planificador estratégico y revisor | `@reasoning` | `read`, `grep`, `glob` (solo lectura) |
| **Goldfish** | Ejecutor de slices | `@cheap` / `@fast` | `read`, `edit`, `write`, `bash`, `grep`, `glob` |
| **Planner** | Especialista: descompone tareas con criterios de aceptación | `@reasoning` | `read`, `grep`, `glob` |
| **Implementer** | Especialista: código bajo TDD | `@best` | `read`, `edit`, `write`, `bash`, `grep`, `glob` |
| **Tester** | Especialista: pruebas unitarias/integración | `@cheap` | `read`, `write`, `bash`, `grep`, `glob` |
| **Reviewer** | Especialista: revisión de diffs (correctness, seguridad, rendimiento) | `@review` | `read`, `grep`, `glob`, `bash` |
| **Designer** | Especialista: diseño visual y UX | `@best` | `read`, `write` |
| **Researcher** | Especialista: investigación externa, docs oficiales | `@reasoning` | `read`, `grep`, `glob` |
| **Debugger** | Especialista: root-cause de bugs persistentes | `@reasoning` | `read`, `grep`, `glob`, `bash` |
| **Docs** | Especialista: documentación y ADRs desde el estado real | `@cheap` | `read`, `write`, `grep`, `glob` |

Elephant y Goldfish son los **planificadores principales** del consejo para este flujo. Los demás son especialistas que se invocan solo cuando el slice lo requiere (ahorro de tokens).

---

## Gates de interacción con el usuario

Hay **dos puertas obligatorias** donde el sistema se detiene y espera tu decisión:

1. **GATE 1 (después del diseño del Elephant):** Revisas `DESIGN.md`. Si no está bien, pides cambios o editas manualmente antes de marcarlo como `frozen`. Sin diseño congelado, el Goldfish no puede ejecutar.

2. **GATE 2 (antes del merge en `master`):** Revisas `DESIGN.md`, los cambios de código, `CHECKS.md` y el veredicto del Elephant. Solo tú puedes aprobar el merge. Ni Elephant ni Goldfish tienen permiso para escribir en `master`.

---

## Archivos clave del sistema

| Ruta | Propósito |
|------|-----------|
| `scripts/orchestrate.sh` | Comando de orquestación (punto de entrada) |
| `DESIGN.md` | Artefacto de diseño persistente (versión, estado, alcance, slices, criterios) |
| `CHECKS.md` | Evidencia de cumplimiento del diseño por el Goldfish |
| `agents/elephant.md` | Definición del agente planificador |
| `agents/goldfish.md` | Definición del agente ejecutor |
| `extensions/cpa-orchestration.ts` | Guarda técnica: bloquea código si no hay diseño congelado; bloquea git hasta aprobación |
| `extensions/elephant-goldfish.ts` | Guarda de handoff EGM |
| `extensions/token-guards.ts` | Bloquea dumps de archivos vía bash (ahorro de tokens) |
| `config.yml` | Roles de modelo: `elephant` (`best-reasoning`), `goldfish` (`cheap`) |
| `docs/omp-runtime/egm-orchestration.md` | Documentación técnica del flujo |
| `SECURITY.md` | Política de seguridad del agente (dry-run, consentimiento, prohibiciones) |

---

## Ejemplo completo de uso

```sh
# 1. Escribir requisitos
cat > requisitos.txt << 'EOF'
Necesito una API REST en Node.js con Express que gestione tareas (CRUD).
Endpoints: GET /tasks, POST /tasks, PUT /tasks/:id, DELETE /tasks/:id.
Base de datos SQLite. Incluir tests y documentación.
EOF

# 2. Ejecutar orquestación
./scripts/orchestrate.sh requisitos.txt

# 3. En GATE 1, revisar DESIGN.md y aprobar para congelar
# 4. En GATE 2, revisar todo y aprobar el merge en master
```

---

## Seguridad

- **Elephant solo lee:** nunca escribe ni edita archivos de producción durante el diseño.
- **Dry-run por defecto:** ninguna acción destructiva se ejecuta sin simulación previa (ver `SECURITY.md`).
- **Bloqueo técnico:** la extensión `cpa-orchestration.ts` impide escrituras de código fuente si `DESIGN.md` no está `frozen`.
- **Bloqueo de merge:** `git push/merge/commit` están bloqueados hasta que el Elephant firme `approved` y tú apruebes en GATE 2.
- **Sin credenciales en el repo:** `.env`, `config.local.yml`, `secrets/` están en `.gitignore`.

---

## Tarjeta de referencia rápida

```
./scripts/orchestrate.sh <archivo-requisitos>

GATE 1 → revisar DESIGN.md → marcar status: frozen
GATE 2 → revisar todo → aprobar o rechazar merge en master

Artefactos: DESIGN.md (diseño), CHECKS.md (cumplimiento)
Agentes clave: Elephant (plan) + Goldfish (ejecuta) + especialistas del consejo por slice
```

---

> **Nota:** Este sistema vive en la capa de configuración del harness omp. No modifica el runtime de omp. Para instalar las extensiones en tu agente OMP activo, ejecuta `./scripts/setup.sh`.
