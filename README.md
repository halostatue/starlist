# halostatue/starlist

halostatue/starlist generates a categorized list of GitHub starred repositories
as Markdown. It runs as a **GitHub Action** or as a Gleam **CLI tool**.

An example can be seen at [halostatue/stars][stars].

## Quick Start (GitHub Action)

```yaml
name: Update star list

on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * *"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@v2.18.0
        with:
          disable-sudo: true
          egress-policy: block
          allowed-endpoints: >
            api.github.com:443
            github.com:443

      - uses: actions/checkout@v6
        with:
          persist-credentials: false

      - name: Generate stars list
        uses: halostatue/starlist@v3.0.1
        with:
          token: ${{ secrets.STARLIST_PAT }}
```

Stars are fetched, rendered into Markdown grouped by language, and committed
back to the repository. For repositories with more than 2,000 stars, output is
automatically partitioned by year.

See [ACTION.md](ACTION.md) for full action documentation including TOML
configuration, partitioning options, and template customization.

## Quick Start (CLI)

```console
$ gleam run -m starlist fetch
$ gleam run -m starlist generate
```

The CLI fetches star data to `data.json` and renders Markdown from it. It
supports the same TOML configuration as the action and can be used for local
testing or as a standalone tool.

See [CLI.md](CLI.md) for full CLI documentation.

## Features

- **Grouping**: stars grouped by language (default), topic, or licence
- **Partitioning**: split output across multiple files by language, topic, year,
  or year-month
- **Templates**: customizable output via [glemplate][glemplate] templates
- **TOML configuration**: shared config format between action and CLI

## Requirements

- A GitHub [Personal Access Token][pat]

## Licence

[Apache License, version 2.0](LICENCE.md)

[glemplate]: https://hexdocs.pm/glemplate/index.html
[pat]: https://github.com/settings/tokens/new
[stars]: https://github.com/halostatue/stars
