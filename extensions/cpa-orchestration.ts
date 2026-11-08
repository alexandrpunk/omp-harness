// cpa-orchestration.ts — omp extension: Capa de Planeación y Orquestación EGM (solo auditoría, sin bloqueo)
//
// Coordina el flujo Elephant-Goldfish sobre omp-harness según el modelo oficial de Google.
// Este hook solo registra estado; no bloquea escrituras de código fuente ni operaciones git.
// Las correcciones operativas, ajuste de errores y commits son responsabilidad del humano.

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
  let designFrozen = false;

  pi.on("tool_result", async (event: ToolResultEvent) => {
    if (!event.isError && event.toolName === "write") {
      const target = String(event.input?.file ?? event.input?.path ?? "");
      if (target === DESIGN_PATH || target.endsWith("/" + DESIGN_PATH)) {
        const content = extractTextContent(event);
        if (content && isDesignFrozen(content)) {
          designFrozen = true;
          log(`DESIGN.md frozen detected`);
        }
      }
    }
  });

  // Nota: este hook ya no bloquea tool_call ni operaciones de git. Las escrituras
  // de código fuente y los commits/pushes quedan bajo control del flujo de git y
  // del usuario, no del diseño EGM.
  pi.on("tool_call", async (_event: ToolCallEvent) => {
    // Sin bloqueo operativo.
  });
}
