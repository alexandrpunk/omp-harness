// elephant-goldfish.ts — omp extension: Guarda de handoff EGM
// Asegura que el flujo Elephant-Goldfish respete el protocolo oficial:
//   - Elephant redacta el diseño con contexto completo.
//   - Goldfish revisa con ojos nuevos (zero-context): solo DESIGN.md y material fuente.
//   - Ninguna implementación ocurre hasta que el humano apruebe la especificación.
//
// No toca el runtime de omp. Copiado por scripts/setup.sh al directorio de extensiones.

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

  // Detectar cuando se escribe DESIGN.md y si está congelado.
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

  // Guarda de handoff: bloquear escrituras de código fuente hasta que el diseño esté frozen.
  pi.on("tool_call", async (event: ToolCallEvent) => {
    const toolName = event.toolName;
    const target = String(event.input?.file ?? event.input?.path ?? "");
    const base = target.split("/").pop() || "";

    if (base === DESIGN_PATH || base === "CHECKS.md" || base.endsWith(".md")) return;

    if (toolName === "edit" || toolName === "write") {
      if (!designFrozen) {
        log(`blocked ${toolName} on ${target}: DESIGN.md not frozen`);
        return {
          block: true,
          reason:
            "Handoff EGM bloqueado: DESIGN.md debe estar congelado (status: frozen) y la especificación aprobada por el humano antes de escribir código de producción.",
        };
      }
    }

    if (toolName === "bash") {
      const command = String(event.input?.command ?? "");
      const isGitWrite =
        /\bgit\s+(push|merge|commit)\b/.test(command) ||
        command.includes("git push") ||
        command.includes("git merge") ||
        command.includes("git commit");
      if (isGitWrite && !designFrozen) {
        log(`blocked bash git operation: DESIGN.md not frozen`);
        return {
          block: true,
          reason:
            "Operación git bloqueada: el diseño debe estar congelado antes de commit, merge o push.",
        };
      }
    }
  });
}
