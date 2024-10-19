# Starlist

This action queries the GitHub API to get list of the user's stars and generates
a list ordered by implementation language. This is a fork of
[simonecorsi/mawesome][simonecorsi/mawesome].

An example can be seen at [halostatue/stars][halostatue/stars].

You can see an example of the output at my own
[simonecorsi/awesome](https://github.com/simonecorsi/awesome)

## Requirements

- An empty repository
- A personal GitHub API key

## Configuration

The service can be configured setting the appropriate environment variables in
the workflow.

### `api-token`

The Personal API Access Token is mandatory to fetch stars from the API without
incurring in Rate Limits. You'll have to generate a
[personal api token](https://github.com/settings/tokens/new) and then add it to
your repository's secrets configuration.

### `compact-by-topic` (default `'false'`)

If `compact-by-topic` is `'true'` it will generate another markdown file
`TOPICS.md` with all stars compacted by their GitHub topics. Be aware that this
list will be bigger since data is duplicated.

### `template-path`

If you don't like the output (default example [here](./TEMPLATE.ejs) ), you can
provide your custom template that will be rendered using [EJS](https://ejs.co/)
template engine.

The `template-path` is relative to the repository root; if the file is not
found, the default template will be used.

### `output-filename` (default `'README.md'`)

The output filename to use for the generated list of stars.

### `github-hame` (default `'GitHub Actions'`)

The username for the commit of the updated star list.

### `github-email` (default `'actions@users.noreply.github.com'`)

The email address for the commit of the updated star list.

## Example workflow

```yml
name: Update star list

on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * *"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate stars list
        uses: halostatue/starlist@v3
        with:
          api-token: ${{ secrets.API_TOKEN }}
          github-email: ${{ secrets.USER_EMAIL }}
          github-name: ${{ github.repository_owner }}
```

[simonecorsi/mawesome]: https://github.com/simonecorsi/mawesome
[halostatue/stars]: https://github.com/halostatue/stars
