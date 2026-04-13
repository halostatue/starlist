_default:
    just --list

@fetch:
    gleam build
    GH_TOKEN="$(gh auth token)" gleam run -m starlist_js -- fetch --max-stars 50

@userfetch USER:
    gleam build
    GH_TOKEN="$(gh auth token)" gleam run -m starlist_js -- fetch --max-stars 50 --login {{ USER }}

@generate:
    gleam run -m cog
    SQUALL_AUTH_TOKEN="$(gh auth token)" gleam run -m squall generate https://api.github.com/graphql
    gleam format

# Build the action bundle
@build: generate
    gleam build
    gleam run -m build_action

# Run the action locally in a scratch directory (options --config-file, --config, --use-data)
action *ARGS: build
    #!/usr/bin/env bash
    set -euo pipefail

    : "${INPUT_TOKEN:?Set INPUT_TOKEN or use INPUT_TOKEN=\$(gh auth token) just action}"

    declare INPUT_CONFIG INPUT_CONFIG_FILE
    declare SCRATCH USE_DATA
    USE_DATA=

    set -- {{ ARGS }}

    while (($#)); do
      case "$1" in
      --help)
        printf "usage: INPUT_TOKEN=<value> just action [options]\n\n"
        printf "INPUT_TOKEN is required.\n\n"
        printf "Options:\n\n"
        printf "--config-file FILENAME    The config file to use\n"
        printf "--use-data [FILENAME]     The data file to use. Ensure that fetch.source\n"
        printf "                          is 'file' in the configuration file. Defaults\n"
        printf "                          to 'data.json'.\n"
        ;;
      --config-file)
        INPUT_CONFIG_FILE="${2:?}"
        shift
        ;;
      --use-data)
        USE_DATA=data.json
        if [[ -n "${2:-}" ]] && [[ -f "${2}" ]]; then
          USE_DATA="${2}"
          shift
        fi
        ;;
      *)
        echo >&2 "Unknown option $1."
        exit 1
        ;;
      esac
      shift
    done

    export INPUT_TOKEN
    export INPUT_CONFIG="${INPUT_CONFIG:-}"
    export INPUT_CONFIG_FILE="${INPUT_CONFIG_FILE:-}"

    # SCRATCH="$(mktemp -d)"
    SCRATCH="scratch.$$"
    mkdir -p "$SCRATCH"
    trap 'echo "Output in $SCRATCH"' EXIT

    # Copy templates and action bundle into scratch
    cp -r dist "$SCRATCH"
    [[ -n "${USE_DATA}" ]] && cp "${USE_DATA}" "${SCRATCH}"/data.json
    cp -f TEMPLATE.md.glemp INDEX.md.glemp "$SCRATCH/" 2>/dev/null || true
    if [[ -n "$INPUT_CONFIG_FILE" ]] && [[ -f "$INPUT_CONFIG_FILE" ]]; then
      cp "$INPUT_CONFIG_FILE" "$SCRATCH/"
      INPUT_CONFIG_FILE="$(basename "$INPUT_CONFIG_FILE")"
      export INPUT_CONFIG_FILE
    fi

    cd "$SCRATCH"
    git init -q
    node dist/starlist.js

# Remove scratch artifacts (if any leaked into repo root)
clean:
    @rm -f data.json stars.json
    @rm -rf scratch.*
