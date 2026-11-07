// cpa-orchestration.ts — omp extension: Capa de Planeación y Orquestación EGM
// Coordina el flujo Elephant-Goldfish sobre omp-harness según el modelo oficial de Google.
//
// Flujo:
//   1. Elephant (contexto completo) redacta DESIGN.md (draft).
//   2. Goldfish (zero-context, ojos nuevos) revisa el draft y expone puntos ciegos.
//   3. Humano aprueba la especificación (GATE 2 del EGM oficial).
//   4. Consejo de agentes implementa contra DESIGN.md congelado.
//   5. Humano aprueba el merge en master (gate adicional de omp-harness).
//
// Guarda de seguridad:
//   - Bloquea escrituras de código fuente si DESIGN.md no está frozen.
//   - Bloquea git push/merge/commit hasta aprobación humana final.
//
// No toca el runtime de omp. Vive en la capa de extensiones del harness y es copiado
// por scripts/setup.sh al directorio de extensiones del agente OMP activo.

type HookAPI = any;
type ToolCallEvent = any;
type ToolResultEvent = any;

const DESIGN_PATH = "DESIGN.md";

function log(msg: string): void {
  if (!process.env.CPA_QUIET) {
    console.error(`[cpa-orchestration] ${msg}`);
  }
}

// Extrae texto plano de un resultado de tool_result.
function extractTextContent(event: ToolResultEvent): string | null {
  const content = event.content;
  if (!Array.isArray(content)) return null;
  for (const part of content) {
    if (part?.type === "text" && typeof part.text === "string") {
      return part.text;
    }
  }
  return null;
}

// Detecta si un texto de DESIGN.md está congelado (status: frozen).
function isDesignFrozen(text: string): boolean {
  return /status:\s*frozen/i.test(text);
}

// Detecta si un texto contiene aprobación humana de la especificación.
function hasHumanApprovedSpec(text: string): boolean {
  return /specification\s*approved|status:\s*frozen|aprobado|approved/i.test(text);
}

export default function hook(pi: HookAPI): void {
  // Estado de sesión: ¿el diseño está congelado y aprobado?
  let designFrozen = false;
  let specApproved = false;

  // Etapa 1-3: Detectar escritura de DESIGN.md y estado de congelación/aprobación.
  pi.on("tool_result", async (event: ToolResultEvent) => {
    if (!event.isError && event.toolName === "write") {
      const target = String(event.input?.file ?? event.input?.path ?? "");
      if (target === DESIGN_PATH || target.endsWith("/" + DESIGN_PATH)) {
        const content = extractTextContent(event);
        if (content) {
          if (isDesignFrozen(content)) {
            designFrozen = true;
            log(`DESIGN.md frozen detected`);
          }
          if (hasHumanApprovedSpec(content)) {
            specApproved = true;
            log(`Human specification approval detected`);
          }
        }
      }
    }
  });

  // Guarda de implementación: bloquear escrituras de código fuente
  // hasta que el diseño esté frozen y aprobado por el humano.
  pi.on("tool_call", async (event: ToolCallEvent) => {
    const toolName = event.toolName;
    const target = String(event.input?.file ?? event.input?.path ?? "");
    const base = target.split("/").pop() || "";

    // Permitir escribir DESIGN.md y CHECKS.md (artefactos del flujo EGM).
    if (base === DESIGN_PATH || base === "CHECKS.md") return;

    // Permitir documentación.
    if (base.endsWith(".md")) return;

    // Bloquear escrituras de código si el diseño no está listo.
    if (toolName === "edit" || toolName === "write") {
      if (!designFrozen || !specApproved) {
        log(`blocked ${toolName} on ${target}: DESIGN.md not frozen or spec not approved`);
        return {
          block: true,
          reason:
            "Implementación bloqueada: DESIGN.md debe estar congelado y la especificación aprobada por el humano antes de escribir código de producción.",
        };
      }
    }

    // Bloquear comandos de git que impliquen merge/push/commit hasta aprobación humana final.
    if (toolName === "bash") {
      const command = String(event.input?.command ?? "");
      const isGitWrite =
        /\bgit\s+(push|merge|commit)\b/.test(command) ||
        command.includes("git push") ||
        command.includes("git merge") ||
        command.includes("git commit");
      if (isGitWrite && !specApproved) {
        log(`blocked bash git operation: specification not approved`);
        return {
          block: true,
          reason:
            "Operación git bloqueada: la especificación debe estar aprobada por el humano antes de hacer commit, merge o push.",
        };
      }
    }
  });
}
