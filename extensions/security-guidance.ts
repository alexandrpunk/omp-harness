// security-guidance.ts — omp extension: block secrets and dangerous patterns
// from being written via edit/write tools. Layered regex heuristics, with
// test-fixture and placeholder exemptions. SECURITY_STRICT=false → log only.

// import type { HookAPI, ToolCallEvent } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";
type HookAPI = any;
type ToolCallEvent = any;

const SECURITY_STRICT = true; // true = block; false = log only

type Rule = { re: RegExp; label: string; advice: string };

const SECRET_RULES: Rule[] = [
  { re: /(sk|pk|rk)-[a-zA-Z0-9]{16,}/, label: "API key (sk/pk/rk prefix)", advice: "load from env var" },
  { re: /AKIA[0-9A-Z]{16}/, label: "AWS access key", advice: "load from env var / IAM role" },
  { re: /AIza[0-9A-Za-z_-]{35}/, label: "Google API key", advice: "load from env var" },
  { re: /gh[pousr]_[A-Za-z0-9]{36,}/, label: "GitHub token", advice: "load from env var" },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: "private key material", advice: "use a secret manager / file outside repo" },
];

const DANGER_RULES: Rule[] = [
  { re: /eval\(\s*[`"'][^`"']*\$\{/m, label: "eval() with interpolated string", advice: "avoid eval; use safe parsing" },
  { re: /(?:child_process[^\n]*exec|(^|[^a-zA-Z])exec)\s*\(\s*[`"'][^`"']*\$\{/m, label: "exec with template literal containing variables", advice: "use execFile with args array" },
  { re: /(SELECT|INSERT|UPDATE|DELETE)[^;+]{0,200}\+\s*[a-zA-Z_$][\w$]*/im, label: "SQL string concatenation", advice: "use parameterized queries" },
  { re: /innerHTML\s*=\s*[^"'`]*[a-zA-Z_$][\w$.]*/m, label: "innerHTML assignment from variable", advice: "use textContent or sanitize" },
  { re: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/, label: "insecure http:// API URL", advice: "use https://" },
];

// Exemptions: test fixtures, .example files, markdown placeholders
const EXEMPT_PATH = /(__tests__|\.test\.|\.spec\.|_test\.)/;
const EXEMPT_NAME = /\.example$|\.md$/;
const PLACEHOLDER = /<YOUR_KEY>|YOUR_API_KEY|<YOUR_TOKEN>/;

function log(msg: string): void {
  if (!process.env.SECURITY_QUIET) console.error(`[security-guidance] ${msg}`);
}

function check(content: string, filePath: string, rules: Rule[]): Rule | null {
  if (PLACEHOLDER.test(content)) return null;
  for (const r of rules) {
    if (r.re.test(content)) return r;
  }
  return null;
}

export default function hook(pi: HookAPI): void {
  pi.on("tool_call", async (event: ToolCallEvent) => {
    if (event.toolName !== "edit" && event.toolName !== "write") return;

    const input = event.input || {};
    const filePath = String(input.filePath || input.path || "");
    const content =
      (typeof input.newString === "string" ? input.newString : "") ||
      (typeof input.content === "string" ? input.content : "");
    if (!content) return;

    if (EXEMPT_PATH.test(filePath) || EXEMPT_NAME.test(filePath)) return;

    const rule = check(content, filePath, SECRET_RULES) || check(content, filePath, DANGER_RULES);
    if (!rule) return;

    const msg = `${rule.label} detected in ${filePath || "(unknown file)"}. ${rule.advice}. If this is a false positive, rewrite avoiding the pattern.`;
    log(msg);
    if (SECURITY_STRICT) {
      return { block: true, reason: `security-guidance: ${msg}` };
    }
    return;
  });
}
