// cpa-orchestration.ts — omp extension: Capa de Planeación y Orquestación EGM (auditoría pasiva, sin bloqueos)
// 
// Flujo oficial (EGM + omp-harness):
//   1. Elephant (contexto) redacta DESIGN.md (draft)
//   2. Goldfish (zero-context) revisa el draft
//   3. Humano aprueba la especificación → DESIGN.md status: frozen (GATE 2)
//   4. Consejo de agentes implementa contra DESIGN.md congelado
//   5. Humano aprueba merge en master (GATE 3)
//   6. Operaciones git (commits, pushes) sin bloqueos — bajo control del usuario
//
// Este hook:
//
//   - Solo registra cuándo DESIGN.md está frozen (auditoría pasiva).
//   - No bloquea escrituras de código source.
//   - No bloquea tool_call ni operaciones de git.
//   - El flujo de merge y git queda bajo control humano/directo.

type HookAPI = any;
type ToolCallEvent = any;
type ToolResultEvent = any;

const DESIGN_PATH = "DESIGN.md";

function log(msg: string): void {
  if (!process.env.CPA_QUIET) {
    console.error(`[cpa-orchestration] ${msg}`);
  }
}

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

function isDesignFrozen(text: string): boolean {
  return /status:\s*frozen/i.test(text);
}

export default function hook(pi: HookAPI): void {
  // Solo rastreamos el estado; no bloqueamos operaciones.
  let designFrozen = false;

  pi.on("tool_result", async (event: ToolResultEvent) => {
    if (!event.isError && event.toolName === "write") {
      const target = String(event.input?.file ?? event.input?.path ?? "");
      if (target === DESIGN_PATH || target.endsWith("/" + DESIGN_PATH)) {
        const content = extractTextContent(event);
        if (content && isDesignFrozen(content)) {
          designFrozen = true;
          log(`DESIGN.md frozen detected (audit only)`);
        }
      }
    }
  });

  pi.on("tool_call", async (_event: ToolCallEvent) => {
    // Sin bloqueo. Escrituras y operaciones de git quedan bajo control del usuario.
  });
}
