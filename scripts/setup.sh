#!/bin/sh
# Install the public omp-harness template into a local OMP agent directory.
# This script never performs network calls and never logs the API key.
set -eu

force=0
usage() {
    printf '%s\n' "Usage: $0 [--help] [--force]" "" \
        "Interactively asks for:" \
        "  - the OMP installation directory" \
        "  - the provider base endpoint" \
        "  - an API key (hidden input)" \
        "" \
        "Existing config.yml, models.yml, and .env files are never replaced" \
        "unless --force is supplied and the final confirmation is accepted."
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --help|-h) usage; exit 0 ;;
        --force) force=1 ;;
        *) printf '%s\n' "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
    shift
done

command -v awk >/dev/null 2>&1 || { printf '%s\n' 'Error: awk is required.' >&2; exit 1; }
command -v mkdir >/dev/null 2>&1 || { printf '%s\n' 'Error: mkdir is required.' >&2; exit 1; }
command -v cp >/dev/null 2>&1 || { printf '%s\n' 'Error: cp is required.' >&2; exit 1; }
command -v mv >/dev/null 2>&1 || { printf '%s\n' 'Error: mv is required.' >&2; exit 1; }
command -v rm >/dev/null 2>&1 || { printf '%s\n' 'Error: rm is required.' >&2; exit 1; }
command -v dirname >/dev/null 2>&1 || { printf '%s\n' 'Error: dirname is required.' >&2; exit 1; }
command -v basename >/dev/null 2>&1 || { printf '%s\n' 'Error: basename is required.' >&2; exit 1; }
command -v pwd >/dev/null 2>&1 || { printf '%s\n' 'Error: pwd is required.' >&2; exit 1; }
command -v stty >/dev/null 2>&1 || { printf '%s\n' 'Error: stty is required for hidden API-key input.' >&2; exit 1; }

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
[ -f "$repo_dir/extensions/token-guards.ts" ] || { printf '%s\n' 'Error: token-guards extension is missing.' >&2; exit 1; }
[ -f "$repo_dir/extensions/security-guidance.ts" ] || { printf '%s\n' 'Error: security-guidance extension is missing.' >&2; exit 1; }

# Keep controls out of paths and values without ever putting a secret in argv.
newline='
'
contains_control() {
    case "$1" in
        *"$newline"*) return 1 ;;
    esac
    printf '%s' "$1" | LC_ALL=C awk 'BEGIN { ok = 1 } { if ($0 ~ /[[:cntrl:]]/) ok = 0 } END { exit(ok ? 0 : 1) }'
}

printf '%s' 'OMP installation directory [~/.omp/agent]: '
IFS= read -r omp_dir
if [ -z "$omp_dir" ]; then
    [ -n "${HOME:-}" ] || { printf '%s\n' 'Error: HOME is unset; provide an installation directory.' >&2; exit 1; }
    omp_dir=$HOME/.omp/agent
fi
case "$omp_dir" in
    ~/*) omp_dir=${HOME:-}${omp_dir#\~} ;;
    ~) omp_dir=${HOME:-} ;;
esac
contains_control "$omp_dir" || { printf '%s\n' 'Error: installation directory contains control characters.' >&2; exit 1; }
case "$omp_dir" in
    /*) ;;
    *) printf '%s\n' 'Error: installation directory must be absolute (or use ~/...).' >&2; exit 1 ;;
esac
# Do not normalize through a path containing dot components: this keeps checks
# below unambiguous and avoids accepting /etc/../somewhere by accident.
case "$omp_dir" in
    */../*|*/..|../*|..|*/./*|*/.|./*|.)
        printf '%s\n' 'Error: installation directory may not contain . or .. path components.' >&2
        exit 1 ;;
esac
case "$omp_dir" in
    /|/etc|/etc/*|/usr|/usr/*|/var|/var/*|/bin|/bin/*|/sbin|/sbin/*|/lib|/lib/*|/lib64|/lib64/*|/boot|/boot/*|/dev|/dev/*|/proc|/proc/*|/sys|/sys/*|/run|/run/*|/root|/root/*|/opt|/opt/*)
        printf '%s\n' 'Error: refusing an unsafe system installation directory.' >&2
        exit 1 ;;
esac

# Resolve an existing destination (including symlinks), or its existing parent.
if [ -d "$omp_dir" ]; then
    omp_dir=$(CDPATH= cd -- "$omp_dir" && pwd)
else
    # The destination and its parents may be created after confirmation. Keep
    # the already-validated absolute spelling until then.
    [ ! -e "$omp_dir" ] || { printf '%s\n' 'Error: installation path is not a directory.' >&2; exit 1; }
fi
case "$omp_dir" in
    /|/etc|/etc/*|/usr|/usr/*|/var|/var/*|/bin|/bin/*|/sbin|/sbin/*|/lib|/lib/*|/lib64|/lib64/*|/boot|/boot/*|/dev|/dev/*|/proc|/proc/*|/sys|/sys/*|/run|/run/*|/root|/root/*|/opt|/opt/*)
        printf '%s\n' 'Error: refusing an unsafe system installation directory.' >&2
        exit 1 ;;
esac

printf '%s' 'Provider base endpoint (for example, https://api.example.com/v1): '
IFS= read -r base_url
[ -n "$base_url" ] || { printf '%s\n' 'Error: endpoint cannot be empty.' >&2; exit 1; }
# Deliberately accept a small, unambiguous URL grammar. It excludes controls,
# credentials, queries/fragments, and YAML indicator characters. The value is
# quoted again when emitted into models.yml.
printf '%s' "$base_url" | LC_ALL=C awk '
BEGIN { ok = 1 }
{
    url = $0
    if (url !~ /^https?:\/\//) ok = 0
    if (url ~ /^https:\/\//) rest = substr(url, 9)
    else rest = substr(url, 8)
    slash = index(rest, "/")
    if (slash) {
        authority = substr(rest, 1, slash - 1)
        path = substr(rest, slash)
        if (path !~ /^\/[A-Za-z0-9._~\/-]*$/) ok = 0
    } else authority = rest
    port = ""
    host = authority
    colon = index(authority, ":")
    if (colon) {
        host = substr(authority, 1, colon - 1)
        port = substr(authority, colon + 1)
        if (port !~ /^[0-9]+$/ || port < 1 || port > 65535) ok = 0
    }
    if (host !~ /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/) ok = 0
    if (host ~ /^[0-9]+(\.[0-9]+){3}$/) ok = 0
    if (host ~ /\.\.|\.-|-/ && (host ~ /\.\.|\.-|\-\./)) ok = 0
    count = split(host, labels, ".")
    for (i = 1; i <= count; i++) {
        if (labels[i] !~ /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/) ok = 0
        if (length(labels[i]) > 63) ok = 0
    }
    if (length(host) > 253) ok = 0
    if (url ~ /[[:cntrl:][:space:]#{}\[\],&*!|>\047\"%@?]/) ok = 0
}
END { exit(ok ? 0 : 1) }' || {
    printf '%s\n' 'Error: endpoint must be http(s) with a valid host and a safe path (for example, https://api.example.com/v1).' >&2
    exit 1
}

printf '%s' 'API key (input hidden): '
if [ -t 0 ]; then
    old_stty=$(stty -g)
    trap 'stty "$old_stty" 2>/dev/null || true' EXIT HUP INT TERM
    stty -echo
    IFS= read -r api_key
    stty "$old_stty"
    trap - EXIT HUP INT TERM
else
    # Piped input is useful for local smoke tests; it is never echoed by this script.
    IFS= read -r api_key
fi
printf '\n'
[ -n "$api_key" ] || { printf '%s\n' 'Error: API key cannot be empty.' >&2; exit 1; }
contains_control "$api_key" || { printf '%s\n' 'Error: API key contains control characters.' >&2; exit 1; }

config_file=$omp_dir/config.yml
models_file=$omp_dir/models.yml
env_file=$omp_dir/.env
existing=0
for file in "$config_file" "$models_file" "$env_file"; do
    if [ -e "$file" ]; then existing=1; fi
done
if [ "$existing" -eq 1 ] && [ "$force" -eq 0 ]; then
    printf '%s\n' 'Error: config.yml, models.yml, or .env already exists; aborting without --force. No files were changed.' >&2
    exit 1
fi

printf '%s\n' '' 'Installation summary:' "  directory: $omp_dir" "  endpoint:  $base_url" '  API key:   provided (not displayed)' \
    "  mode:      $(if [ "$force" -eq 1 ]; then printf '%s' 'replace existing files with backup'; else printf '%s' 'new files only'; fi)"
printf '%s' 'Proceed? [y/N]: '
IFS= read -r answer
case "$answer" in
    y|Y|yes|YES|Yes) ;;
    *) printf '%s\n' 'Installation cancelled. No files were changed.'; exit 0 ;;
esac

umask 077
tmp_dir=$omp_dir/.omp-harness-tmp-$$
backup_dir=
cleanup() {
    [ -z "${tmp_dir:-}" ] || rm -rf "$tmp_dir"
}
trap cleanup EXIT HUP INT TERM
[ ! -e "$tmp_dir" ] || { printf '%s\n' 'Error: temporary installer directory already exists.' >&2; exit 1; }
mkdir -p "$omp_dir/extensions" "$omp_dir/agents" "$omp_dir/skills"
mkdir "$tmp_dir" "$tmp_dir/extensions"

# Stage every generated file before changing the destination.
{
    printf '%s\n' \
        'model: omniroute/zai-coding-plan/glm-5.2' \
        'modelRoles:' \
        '  default: omniroute/zai-coding-plan/glm-5.2' \
        '  cheap: omniroute/auto/cheap' \
        '  fast: omniroute/auto/fast' \
        '  best: omniroute/auto/best-coding' \
        '  reasoning: omniroute/auto/best-reasoning' \
        '  review: omniroute/auto/pro-coding:high' \
        '  image: free-stack/vision' \
        'memory:' \
        '  backend: local' \
        '  summaryInjectionTokenLimit: 5000' \
        'compaction:' \
        '  enabled: true' \
        '  methodOrder: [remote, snapcompact, handoff, shake, soft]' \
        'permissions: {}' \
        'symbolPreset: nerd' \
        'composer:' \
        '  shape: claude' \
        'theme:' \
        '  dark: titanium' \
        '  light: light' \
        'setupVersion: 3' \
        'extensions:'
    printf "  - '%s'\n" "$omp_dir/extensions/token-guards.ts" "$omp_dir/extensions/security-guidance.ts"
} > "$tmp_dir/config.yml"
{
    printf '%s\n' 'providers:' '  omniroute:'
    printf "    baseUrl: '%s'\n" "$base_url"
    printf '%s\n' \
        '    apiKey: OMNIROUTE_API_KEY' \
        '    api: openai-completions' \
        '    authHeader: true' \
        '    disableStrictTools: true'
} > "$tmp_dir/models.yml"
printf '%s\n' "OMNIROUTE_API_KEY=$api_key" > "$tmp_dir/.env"
cp "$repo_dir/extensions/token-guards.ts" "$tmp_dir/extensions/token-guards.ts"
cp "$repo_dir/extensions/security-guidance.ts" "$tmp_dir/extensions/security-guidance.ts"
chmod 600 "$tmp_dir/.env" "$tmp_dir/config.yml" "$tmp_dir/models.yml"

if [ "$force" -eq 1 ] && [ "$existing" -eq 1 ]; then
    backup_dir=$omp_dir/.omp-harness-backup-$$
    [ ! -e "$backup_dir" ] || { printf '%s\n' 'Error: backup directory already exists.' >&2; exit 1; }
    mkdir "$backup_dir"
    for file in "$config_file" "$models_file" "$env_file"; do
        if [ -e "$file" ]; then cp "$file" "$backup_dir/$(basename "$file")"; fi
    done
    for file in "$omp_dir/extensions/token-guards.ts" "$omp_dir/extensions/security-guidance.ts"; do
        if [ -e "$file" ]; then
            mkdir -p "$backup_dir/extensions"
            cp "$file" "$backup_dir/extensions/$(basename "$file")"
        fi
    done
    printf '%s\n' "Backed up existing files to $backup_dir"
fi

mv "$tmp_dir/config.yml" "$config_file"
mv "$tmp_dir/models.yml" "$models_file"
mv "$tmp_dir/.env" "$env_file"
mv "$tmp_dir/extensions/token-guards.ts" "$omp_dir/extensions/token-guards.ts"
mv "$tmp_dir/extensions/security-guidance.ts" "$omp_dir/extensions/security-guidance.ts"
printf '%s\n' "Installed portable omp-harness configuration in $omp_dir" \
    'The API key was not printed. Keep the generated .env, config.yml, and models.yml private.' \
    'No network request was made.'
