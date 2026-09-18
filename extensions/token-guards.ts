// token-guards.ts — omp extension: token optimization guards
// 1) Blocks bash cat/head/tail dumps of source files (use read tool instead)
// 2) Truncates oversized bash/read tool results (head+tail preserved)
// 3) Debug logging to stderr, silencable via TOKEN_GUARDS_QUIET=1
//
// Source: techniques adapted from abdulgafoorabid's Medium article on
// coding-agent token optimization.

// Type import with inline fallback — keep the real import commented so it
// never breaks runtime if the package can't resolve (omp loads TS directly).
// import type { HookAPI, ToolCallEvent, ToolResultEvent } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";
type HookAPI = any;
type ToolCallEvent = any;
type ToolResultEvent = any;

const MAX_CHARS = 8000;
const HEAD_RATIO = 0.6;

const CODE_EXTS = [
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".cs",
  ".php", ".java", ".json", ".yml", ".css", ".html",
];

// Small config files that are fine to cat in full.
const ALLOWED_NAMES = [".env.example", "LICENSE"];

function log(msg: string): void {
  if (!process.env.TOKEN_GUARDS_QUIET) {
    console.error(`[token-guards] ${msg}`);
  }
}

// Heuristic: a "dump" is cat/head/tail directly reading a code file with no
// pipe, no extra flags, and no small-config exception. Examples:
//   blocked:  cat src/index.ts | head -50   -> wait, this HAS a pipe; see below
//   blocked:  cat src/app.ts                -> direct dump
//   allowed:  cat src/app.ts | grep foo     -> pipeline (grep processes it)
//   allowed:  cat -n src/app.ts             -> -n flag = line numbers, bounded use
//   allowed:  cat .env.example              -> tiny config file
function isDumpCommand(cmd: string): string | null {
  const trimmed = cmd.trim();
  // Distinguish first command from pipes: only check the LAST segment's head?
  // Simpler: block only if the WHOLE command is a single dump (no '|' at all)
  // and starts with cat/head/tail + a code-file path argument.
  if (trimmed.includes("|")) return null;

  // Extract the leading program name
  const m = trimmed.match(/^(?:sudo\s+)?(cat|head|tail)\b\s*(.*)$/);
  if (!m) return null;
  const args = m[2].trim();
  if (!args) return null;

  // Skip if flags present (e.g. cat -n, head -c 10 — bounded output is OK)
  if (args.startsWith("-")) return null;

  const path = args.split(/\s+/)[0];
  const base = path.split("/").pop() || "";
  if (ALLOWED_NAMES.some((n) => base === n || base.endsWith(n))) return null;
  if (CODE_EXTS.some((ext) => path.endsWith(ext))) return path;
  return null;
}

function truncate(text: string): string {
  const n = text.length - MAX_CHARS;
  const headLen = Math.floor(MAX_CHARS * HEAD_RATIO);
  const head = text.slice(0, headLen);
  const tail = text.slice(text.length - (MAX_CHARS - headLen));
  return (
    head +
    `\n...[TRUNCATED ${n} chars by token-guards — rerun with narrower range/grep if you need the middle]...\n` +
    tail
  );
}

export default function hook(pi: HookAPI): void {
  pi.on("tool_call", async (event: ToolCallEvent) => {
    if (event.toolName !== "bash") return;
    const cmd = String(event.input?.command ?? "");
    const dumped = isDumpCommand(cmd);
    if (dumped) {
      log(`blocked dump of ${dumped}`);
      return { block: true, reason: "Use the read tool with offset/limit instead of dumping files via bash" };
    }
    return;
  });

  pi.on("tool_result", async (event: ToolResultEvent) => {
    if (event.isError) return event.content; // never truncate errors
    if (event.toolName !== "bash" && event.toolName !== "read") return event.content;

    const content = event.content;
    if (!Array.isArray(content)) return content;

    let changed = false;
    const out = content.map((part: any) => {
      if (part?.type !== "text" || typeof part.text !== "string") return part;
      if (part.text.length <= MAX_CHARS) return part;
      changed = true;
      log(`truncated ${event.toolName} result (${part.text.length} chars)`);
      return { ...part, text: truncate(part.text) };
    });
    return changed ? out : content;
  });
}
