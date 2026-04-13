# Starlist CLI

Starlist is a Gleam CLI module that reads the GitHub GraphQL API to get the list
of a user's starred repositories. It optionally generates markdown output for
those stars, grouped and optionally partitioned.

## Requirements

- A GitHub Personal Access Token

## Usage

```console
$ gleam run -m starlist fetch
$ gleam run -m starlist render
$ gleam run -m starlist commit
```

Configuration options for these three commands may be provided on the
command-line or through a TOML configuration file. The same configuration file
that is used for the action may be used for the CLI, but portions of the
configuration file will behave differently in CLI mode.

### GitHub Personal Access Token

The `fetch` subcommand requires a GitHub [Personal Access Token][pat] to fetch
stars from the API; with some checkouts, it may also be used for the `commit`
subcommand under some circumstances. If using the GitHub CLI `gh`, it should
have sufficient permissions natively. However, a fine-grained PAT may be used if
it is scoped to include the target repository and the permissions
`repository:contents:read-write`, `repository:metadata:read-only`, and
`account:starring:read-only`.

The token will be read from `$GITHUB_TOKEN`, `$GH_TOKEN` or from the output of
`--github-credentials-command`. File-based token reads are not supported for
security purposes.

## Configuration

Configuration is provided through a TOML configuration file or command-line
parameters.

### `data` Configuration

#### `data.path`

The path to the star data JSON file. Defaults to `"data.json"`. The CLI
`--output` flag (on `fetch`) and `--input` flag (on `generate`) override this
value for their respective commands.

```toml
[data]
path = "data/halostatue.json"
```

### `fetch` Configuration

The action `token` is used for fetching stars from the GitHub GraphQL API. Stars
are fetched in fixed page sizes of 40 (larger pages cause errors with the
GraphQL API).

#### `fetch.login` (`--login`)

The GitHub login of the user whose stars to fetch. Defaults to the authenticated
user (the PAT owner). The value `"@me"` is treated as unset (the authenticated
user). Useful for fetching another user's public stars.

```toml
[fetch]
login = "halostatue"
```

#### `fetch.max_stars` (`--max-stars`)

Limits the number of stars retrieved during fetch. Defaults to unlimited. Mostly
useful for testing or when pulling stars for a different user. Rounded to the
nearest 40 stars.

```toml
[fetch]
max_stars = 100
```

#### `fetch.order` (`--order`)

The order in which stars will be sorted: "ascending" (the default) will sort
the most recently starred repositories last; "descending" will sort them first.
Useful with `max_stars` to get the most recent N stars.

```toml
fetch.order = "descending"
```

#### `fetch.users` (`--user LIST`)

> _This feature is planned but not yet available._

The users (or viewer) for whom to fetch stars. Defaults to `["@me"]`, the owner
of the GitHub PAT.

```toml
[fetch]
users = ["@me", "halostatue"]
```

When passed as `--user`, the value is _either_ a comma-separated list
(`--user user1,user2`) which may include the special value `@me` (the owner of
the GitHub PAT), or a single value with an `@` prefix that resolves to a
filename.

```console
# Retrieves the stars for the PAT user.
$ gleam run -m starlist fetch --user @me
# Retrieves the stars for each user in the file userlist.txt.
$ gleam run -m starlist fetch --user @userlist.txt
```

### `render` Configuration

Options for rendering the stars into Markdown.

#### `render.date_time`

How dates and times should be formatted. Two formats are supported, `iso` and
`locale`. The `iso` format is a human-readable ISO8601 24-hour clock variation
(`2006-01-02 15:04:05`). The `locale` format uses [`Intl.DateTimeFormat`][idtf]
for locale-specific formatting. To use `locale` format, the `locale` option must
be provided.

- [`time_zone`][time_zone] (`--time-zone`): The timezone to use for adjusting
  timestamps (which are returned as `UTC` by GitHub). Defaults to `UTC`. Applies
  to both `iso` and `locale` formatting.

  ```toml
  [render]
  date_time = { time_zone = "America/Toronto" }
  ```

- [`locale`][lparam] (`--locale`): The ISO locale to use. When set, this
  switches formatting to `locale`. Only a single locale is supported, unlike
  `Intl.DateTimeFormat`. When set, enables the `date_style` and `time_style`
  options.

- [`date_style`][date_style] (`--date-style`): The date formatting style to use.
  Possible values are `"full"`, `"long"`, `"medium"`, and `"short"`. It expands
  to styles for `weekday`, `day`, `month`, `year`, and `era`, with the exact
  combination of values depending on the locale.

  Defaults to `short`.

- [`time_style`][time_style] (`--time-style`): The time formatting style to use.
  Possible values are `"full"`, `"long"`, `"medium"`, and `"short"`. It expands
  to styles for `hour`, `minute`, `second`, and `timeZoneName`, with the exact
  combination of values depending on the locale.

  Defaults to `short`.

```toml
[render.date_time]
time_zone = "America/Montreal"
locale = "fr-CA"
date_style = "medium"
time_style = "short"
```

#### `render.output` (`--output`)

The output filename for the rendered stars. Defaults to `README.md`.

When star partitioning is enabled, this file will be used for the partition
index file.

#### `render.output_dir` (`--dir`)

The root directory for rendered output files. Defaults to `"."` (the current
directory). The `--dir` CLI flag overrides this value.

```toml
[render]
output_dir = "stars/halostatue"
```

#### `render.partition_output` (`--partition-output`)

The output filename pattern for partitioned files. If `partition_output` does
not contain `{key}`, it is assumed that the pattern is a directory name and
`/{key}.md` will be appended. Defaults to `stars/{key}.md`.

#### `render.group` (`--group language|licence|topic`)

How stars are grouped within the rendered file.

- `language` groups starred repositories by the first language of the
  repository. This is the default.

- `licence` groups starred repositories by the licence SPDX ID, or nickname if
  that is not present.

- `topic` groups starred repositories by the first topic of the repository.

#### `render.partition` (`--partition off|language|topic|year|year-month`)

How stars are partitioned within the rendered file.

- `off` disables star partitioning. This is the default for the action when
  processing fewer than 2,000 stars.

- `language` partitions stars by language. A repo will appear in a partitioned
  page for _each_ of the languages in its list (up to 10).

  It is strongly recommended that the `render.group` be a value other than
  `language` when partitioning by language.

- `topic` partitions stars by topic. A repo will appear in a partitioned page
  for _each_ of the topics in its list (up to 20).

  It is strongly recommended that the `render.group` be a value other than
  `topic` when partitioning by topic.

- `year` partitions stars by the year that the repo was starred. This is the
  default for the action when processing more than 2,000 stars.

- `year-month` partitions stars by the year and month the repo was starred.

#### `render.template` (`--template`)

The path to the [glemplate][glemplate] template used for rendering stars.

If specified, refers to a template file in the repository being processed. If
not specified, refers to the default [`TEMPLATE.md.glemp`][default-template].

#### `render.index_template` (`--index-template`)

The path to the [glemplate][glemplate] template used for rendering the partition
index, when star partitioning is enabled.

If specified, refers to a template file in the repository being processed. If
not specified, refers to the default [`INDEX.md.glemp`][default-index].

### `commit` Configuration

Configuration options to commit updates to the generated star list.

The GitHub PAT may be used for authorizing commits and pushes back to the origin
remote. This will only happen if `git config --get user.email` and
`git config --get user.name` are empty values. If this is the case, the
authorization token and committer details will be set prior to commit and
removed after commit (this will be done _even if the commit fails_).

#### `git.commit_message` (`--commit-message`)

The commit message when a change is detected. Defaults to
`chore(updates): updated entries in files`.

#### `git.smart_commit` (`--smart-commit` | `--no-smart-commit`)

Commits only if there are changed detectable other than the date that the stars
were run. Defaults to `true`.

#### `git.pull` (`--pull [OPTIONS]`)

By default, `git pull` is not run in the CLI unless `git.pull` or `--pull` is
provided.

Additional options to use when calling `git pull` prior to committing the
update. The default value is blank for the action. Note that `--tags` and
`--unshallow` are added as required.

#### `git.committer` (`--commit-author-name` and `--commit-author-email`)

An object with the committer name and email address for the action. Defaults to
a bot address:

```toml
[git.committer]
name = "github-actions[bot]"
email = "41898282+github-actions[bot]@users.noreply.github.com"
```

[date_style]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#datestyle
[default-index]: https://github.com/halostatue/starlist/blob/main/INDEX.md.glemp
[default-template]: https://github.com/halostatue/starlist/blob/main/TEMPLATE.md.glemp
[glemplate]: https://hexdocs.pm/glemplate/index.html
[idtf]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
[lparam]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#locales
[pat]: https://github.com/settings/tokens/new
[time_style]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timestyle
[time_zone]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezone
