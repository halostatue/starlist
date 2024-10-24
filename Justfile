_default:
    just --list

# Run the generation task. See --help.
generate TOKEN *ARGS:
    #!/usr/bin/env bash

    declare INPUT_TOKEN INPUT_GIT_LOCAL INPUT_OUTPUT_FILENAME \
      INPUT_LOAD_STARS_FROM_JSON INPUT_CONFIG
    INPUT_TOKEN="{{ TOKEN }}"
    INPUT_GIT_LOCAL=true
    INPUT_OUTPUT_FILENAME=stars.md
    INPUT_LOAD_STARS_FROM_JSON=true

    if [[ "$INPUT_TOKEN" == --help ]] || [[ "$INPUT_TOKEN"  == -h ]]; then
      cat <<USAGE
    usage: just generate TOKEN [options]
           just generate --help|-h

    Runs the generate task with TOKEN. If TOKEN is a file, the token will be
    read from that file.

    Options
      --config, -c FILENAME   Specify the `config` input YAML file.
      --output, -o FILENAME   Sets the output filename. Defaults to stars.md
      --query-api             Queries the data from the API instead of loading
                              the data from data.json. Enabled if data.json does
                              not exist.
    USAGE
      exit 0
    fi

    if [[ -f "$INPUT_TOKEN" ]]; then
      INPUT_TOKEN="$(<"$INPUT_TOKEN")"
    fi

    set -- {{ ARGS }}

    while (($#)); do
      case "$1" in
      --output | -o)
        INPUT_OUTPUT_FILENAME="${2:?}"
        shift
        ;;
      --query-api) INPUT_LOAD_STARS_FROM_JSON=false ;;
      --config | -c)
        if [[ -f "${2:?}" ]]; then
          INPUT_CONFIG="$(<"$2")"
        else
          INPUT_CONFIG="$2"
        fi

        shift
        ;;
      *)
        echo >&2 "Unknown option $1."
        exit 1
        ;;
      esac

      shift
    done

    if [[ "$INPUT_LOAD_STARS_FROM_JSON" == true ]] && ! [[ -f data.json ]]; then
      INPUT_LOAD_STARS_FROM_JSON=false
    fi

    export INPUT_TOKEN INPUT_GIT_LOCAL INPUT_OUTPUT_FILENAME \
      INPUT_LOAD_STARS_FROM_JSON INPUT_CONFIG

    pnpm exec tsx src/index.ts

# Removes generated files
clean:
    @rm -f data.json stars.md
