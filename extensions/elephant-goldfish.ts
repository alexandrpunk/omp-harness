// elephant-goldfish.ts — omp extension: Guarda de handoff EGM (solo auditoría, sin bloqueo)
//
// Flujo EGM documentado en DESIGN.md. Este hook solo registra estado; no bloquea
// escrituras de código fuente ni operaciones git. Las correcciones operativas,
// ajuste de errores y commits son responsabilidad del humano y del flujo de git.

type HookAPI = any;
type ToolCallEvent = any;
type ToolResultEvent = any;

const DESIGN_PATH = "DESIGN.md";

function log(msg: string): void {
  if (!process.env.EGM_QUIET) {
    console.error(`[elephant-goldfish] ${msg}`);
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

  // Nota: este hook ya no bloquea tool_call. Las operaciones de escritura y git
  // quedan bajo control del flujo de git y del usuario, no del diseño EGM.
  pi.on("tool_call", async (_event: ToolCallEvent) => {
    // Sin bloqueo operativo. Solo auditoría pasiva si se desea en el futuro.
  });
}
