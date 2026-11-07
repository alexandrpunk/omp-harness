#!/bin/sh
# Muestra el manual de uso de la orquestación EGM + Consejo de Agentes.
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
manual="$repo_dir/MANUAL.md"

if [ ! -f "$manual" ]; then
    printf '%s\n' "Error: manual no encontrado en $manual" >&2
    exit 1
fi

cat "$manual"
