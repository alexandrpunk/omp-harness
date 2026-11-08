// elephant-goldfish.ts — omp extension: Guarda de handoff EGM (solo auditoría pasiva)
// Flujo EGM oficial:
//   - Elephant redacta DESIGN.md (draft)
//   - Goldfish revisa (zero-context)
//   - Humano aprueba → DESIGN.md status: frozen
//   - Consejo implementa contra DESIGN.md congelado
//   - Gate humano aprobar merge en master
//
// Este hook SOLO registra el estado frozen. Bloquea NINGUNA operación:
// - Escrituras de código fuente: permitidas siempre (el humano/diseño las controla)
// - Git commits/pushes: permitidos siempre (administración de reposo)
// - tool_result/write: solo audita cuando DESIGN.md está frozen

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
  // Solo rastreamos el estado; no bloqueamos nada.
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

  // Sin bloqueo operativo. Cualquier escritura o llamada de herramienta queda
  // bajo control del usuario y del flujo de git, no del diseño EGM.
  pi.on("tool_call", async (_event: ToolCallEvent) => {
    // Registro pasivo si se desea; no hay bloqueo.
  });
}
