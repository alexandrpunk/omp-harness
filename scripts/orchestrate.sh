#!/bin/sh
# Orchestrate a project through the Elephant-Goldfish flow on omp-harness.
# Follows the official EGM model (google/elephant-goldfish-model):
#   1. Elephant (full context) drafts the specification (DESIGN.md).
#   2. Goldfish (zero-context, fresh eyes) reviews the draft and source material,
#      exposing unstated assumptions and blind spots.
#   3. Human makes architectural trade-offs and approves the specification
#      BEFORE any implementation.
#   4. Council of agents (implementer, tester, debugger, etc.) implements
#      against the frozen specification.
#   5. Human approves or rejects the final merge in master.
# No network calls. No secrets logged.
set -eu

force=0
project_file=""

usage() {
    printf '%s\n' "Usage: $0 [--help] [--force] <project-requirements-file>" "" \
        "Runs the Elephant-Goldfish orchestration flow:" \
        "  1. Elephant analyzes requirements and drafts DESIGN.md (specification)" \
        "  2. Goldfish reviews DESIGN.md with fresh eyes (zero-context)" \
        "  3. Gate 1: Human approves or rejects the specification (EGM official)" \
        "  4. Council of agents implements against frozen DESIGN.md" \
        "  5. Gate 2: Human approves or rejects merge in master" "" \
        "Arguments:" \
        "  project-requirements-file  File with general project requirements" "" \
        "Options:" \
        "  --help, -h       Show this help" \
        "  --force          Skip confirmation prompts where safe"
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --help|-h) usage; exit 0 ;;
        --force) force=1 ;;
        -*) printf '%s\n' "Unknown option: $1" >&2; usage >&2; exit 2 ;;
        *) project_file=$1 ;;
    esac
    shift
done

if [ -z "$project_file" ]; then
    printf '%s\n' 'Error: project-requirements-file is required.' >&2
    usage >&2
    exit 2
fi

if [ ! -f "$project_file" ]; then
    printf '%s\n' "Error: file not found: $project_file" >&2
    exit 1
fi

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
[ -f "$repo_dir/DESIGN.md" ] || { printf '%s\n' 'Error: DESIGN.md is missing.' >&2; exit 1; }
[ -f "$repo_dir/agents/elephant.md" ] || { printf '%s\n' 'Error: agents/elephant.md is missing.' >&2; exit 1; }
[ -f "$repo_dir/agents/goldfish.md" ] || { printf '%s\n' 'Error: agents/goldfish.md is missing.' >&2; exit 1; }

# Read project requirements
project_reqs=$(cat "$project_file")

# Stage 1: Elephant drafts the specification
printf '%s\n' "=== Stage 1: Elephant drafts the specification ==="
printf '%s\n' "Project requirements:"
printf '%s\n' "$project_reqs"
printf '%s\n' ""

if [ "$force" -ne 1 ]; then
    printf '%s' 'Proceed with Elephant specification draft? [y/N]: '
    IFS= read -r confirm
    case "$confirm" in
        y|Y) ;;
        *) printf '%s\n' 'Aborted by user.'; exit 0 ;;
    esac
fi

printf '%s\n' "Elephant is analyzing requirements and drafting DESIGN.md..."
# NOTE: The Elephant agent writes DESIGN.md in the OMP agent session.

design_path="$repo_dir/DESIGN.md"

if [ ! -f "$design_path" ]; then
    printf '%s\n' "ERROR: DESIGN.md not found after Elephant draft stage." >&2
    exit 1
fi

# Stage 2: Goldfish reviews with fresh eyes
printf '%s\n' "=== Stage 2: Goldfish reviews specification with fresh eyes ==="
printf '%s\n' "Goldfish will examine DESIGN.md and referenced source material without"
printf '%s\n' "the prior conversation, exposing unstated assumptions and blind spots."
printf '%s\n' ""

if [ "$force" -ne 1 ]; then
    printf '%s' 'Proceed with Goldfish review? [y/N]: '
    IFS= read -r confirm2
    case "$confirm2" in
        y|Y) ;;
        *) printf '%s\n' 'Aborted by user.'; exit 0 ;;
    esac
fi

printf '%s\n' "Goldfish is reviewing the specification..."
# NOTE: The Goldfish agent writes a review report in the OMP agent session.

# Gate 1: Human approves the specification (EGM official)
printf '%s\n' "=== Gate 1: Human approves the specification ==="
printf '%s\n' "Review DESIGN.md and the Goldfish review report."
printf '%s\n' "You make the architectural trade-offs and approve the specification."
printf '%s\n' "NO implementation happens until you approve."
printf '%s\n' ""

if [ "$force" -ne 1 ]; then
    printf '%s' 'Approve specification and freeze DESIGN.md? (y/n/edit): '
    IFS= read -r gate1
    case "$gate1" in
        y|Y)
            sed -i 's/status: draft/status: frozen/' "$design_path" 2>/dev/null || \
            perl -0pi -e 's/status:\s*draft/status: frozen/' "$design_path"
            ;;
        n|N)
            printf '%s\n' 'Specification not approved. Aborted.'; exit 0 ;;
        edit)
            printf '%s\n' 'Edit DESIGN.md manually, then mark status: frozen and re-run.'; exit 0 ;;
        *)
            printf '%s\n' 'Invalid option. Aborted.'; exit 2 ;;
    esac
else
    sed -i 's/status: draft/status: frozen/' "$design_path" 2>/dev/null || \
    perl -0pi -e 's/status:\s*draft/status: frozen/' "$design_path"
fi

printf '%s\n' "Specification approved. DESIGN.md is frozen."

# Stage 3: Council of agents implements
printf '%s\n' "=== Stage 3: Council of agents implements ==="
printf '%s\n' "Specialist agents (implementer, tester, debugger, researcher, designer, docs)"
printf '%s\n' "implement against the frozen DESIGN.md by slice."
printf '%s\n' ""

if [ "$force" -ne 1 ]; then
    printf '%s' 'Proceed with implementation by council agents? [y/N]: '
    IFS= read -r confirm3
    case "$confirm3" in
        y|Y) ;;
        *) printf '%s\n' 'Aborted by user.'; exit 0 ;;
    esac
fi

# NOTE: Implementation happens in the OMP agent session by council specialists.

checks_path="$repo_dir/CHECKS.md"

if [ ! -f "$checks_path" ]; then
    printf '%s\n' "WARNING: CHECKS.md not found. Implementation may not have completed." >&2
fi

# Gate 2: Human final approval (omp-harness additional gate)
printf '%s\n' "=== Gate 2: Human final approval ==="
printf '%s\n' "Review before merging into master:"
printf '%s\n' "  1. DESIGN.md (frozen specification)"
printf '%s\n' "  2. Code changes from council agents"
printf '%s\n' "  3. CHECKS.md (compliance evidence)"
printf '%s\n' "  4. Goldfish review report"
printf '%s\n' ""

if [ "$force" -ne 1 ]; then
    printf '%s' 'Approve merge into master? (y/N): '
    IFS= read -r gate2
    case "$gate2" in
        y|Y) ;;
        *) printf '%s\n' 'Merge rejected by user. Aborted.'; exit 0 ;;
    esac
fi

printf '%s\n' "Orchestration complete. You may now merge the changes into master."
printf '%s\n' "Remember: only the human can approve the final merge (Gate 2)."
