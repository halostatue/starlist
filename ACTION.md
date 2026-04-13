# Starlist Action

Starlist is a GitHub action that reads the GitHub GraphQL API to get the list of
a user's starred repositories and generates markdown output for those stars,
grouped and optionally partitioned.

This is an incompatible fork of [simonecorsi/mawesome][mawesome] and of the 1.x
series of `halostatue/starlist` (this repo). An example can be seen at
[halostatue/stars][stars].

## Requirements

- A (mostly) empty repository.
- A GitHub Personal Access Token

## Usage

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
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - name: Generate stars list
        uses: halostatue/starlist@v3.0.0
        with:
          token: ${{ secrets.STARLIST_PAT }}
```

Alternatively, you can save your configuration as a TOML file and load it from
`config_file`:

```yaml
…
      - name: Generate stars list
        uses: halostatue/starlist@v3.0.0
        with:
          token: ${{ secrets.STARLIST_PAT }}
          config_file: stars.toml
```

### Action Parameters

#### `token` **required**

The `token` parameter is **required** to fetch stars from the API and for
committing and pushing the changes back to the origin repository. The GitHub
Actions default token (`secrets.GITHUB_TOKEN`) is insufficient; a [Personal
Access Token][pat] must be generated and added to the target repository's
secrets configuration.

Both classic and fine-grained PATs are supported:

- **Classic PATs** require the `public_repo` scope for public repositories, or
  the `repo` scope for private repositories.
- **Fine-grained PATs** must be scoped to the target repository with the
  permission `contents: read and write`.

#### Checkout and Credentials

The action injects the provided token into the git remote URL for push access.
The recommended configuration uses `persist-credentials: false` on the checkout
step so that the default `GITHUB_TOKEN` credential helper does not interfere:

```yaml
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
```

If `persist-credentials` is omitted or set to `true`, the default `GITHUB_TOKEN`
is used for push. In that case, the job or workflow must have
`permissions: { contents: write }`.

#### `config`

The TOML configuration. Cannot be used with `config_file`.

#### `config_file`

The path to the TOML configuration file in the repo where the stars will be
generated. Cannot be used with `config`.

## Configuration

Configuration is provided through TOML. It may be embedded in the `config`
parameter or be referenced in the `config_file` parameter. Configuration may be
_partial_ configuration, overriding the default values. There are four major
sections:

- `data` (configuration for the star data file)
- `fetch` (configuration for fetching stars)
- `render` (configuration for rendering stars as markdown)
- `git` (configuration for committing the rendered stars and pushing them back
  to the origin)

### `data` Configuration

#### `data.path`

The path to the star data JSON file, used for both writing after fetch and
reading before render. Defaults to `"data.json"`. Useful for multi-user
workflows where each user's data is stored separately.

```toml
[data]
path = "data/halostatue.json"
```

### `fetch` Configuration

The action `token` is used for fetching stars from the GitHub GraphQL API. Stars
are fetched in fixed page sizes of 40 (larger pages cause errors with the
GraphQL API).

#### `fetch.login`

The GitHub login of the user whose stars to fetch. Defaults to the authenticated
user (the PAT owner). The value `"@me"` is treated as unset (the authenticated
user). Useful for fetching another user's public stars.

```toml
[fetch]
login = "halostatue"
```

#### `fetch.max_stars`

Limits the number of stars retrieved during fetch. Defaults to unlimited. Mostly
useful for testing or when pulling stars for a different user. Rounded to the
nearest 40 stars.

```toml
[fetch]
max_stars = 100
```

#### `fetch.order`

The order in which stars will be sorted: "ascending" (the default) will sort
the most recently starred repositories last; "descending" will sort them first.
Useful with `max_stars` to get the most recent N stars.

```toml
fetch.order = "descending"
```

#### `fetch.users`

> _This feature is planned but not yet available._

The users (or viewer) for whom to fetch stars. Defaults to `["@me"]`, the owner
of the GitHub PAT.

```toml
[fetch]
users = ["@me", "halostatue"]
```

### `render` Configuration

Options for rendering the stars into Markdown.

#### `render.date_time`

How dates and times should be formatted. Two formats are supported, `iso` and
`locale`. The `iso` format is a human-readable ISO8601 24-hour clock variation
(`2006-01-02 15:04:05`). The `locale` format uses [`Intl.DateTimeFormat`][idtf]
for locale-specific formatting. To use `locale` format, the `locale` option must
be provided.

- [`time_zone`][time_zone]: The timezone to use for adjusting timestamps (which
  are returned as `UTC` by GitHub). Defaults to `UTC`. Applies to both `iso` and
  `locale` formatting.

  ```toml
  [render]
  date_time = { time_zone = "America/Toronto" }
  ```

- [`locale`][lparam]: The ISO locale to use. When set, this switches formatting
  to `locale`. Only a single locale is supported, unlike `Intl.DateTimeFormat`.
  When set, enables the `date_style` and `time_style` options.

- [`date_style`][date_style]: The date formatting style to use. Possible values
  are `"full"`, `"long"`, `"medium"`, and `"short"`. It expands to styles for
  `weekday`, `day`, `month`, `year`, and `era`, with the exact combination of
  values depending on the locale.

  Defaults to `short`.

- [`time_style`][time_style]: The time formatting style to use. Possible values
  are `"full"`, `"long"`, `"medium"`, and `"short"`. It expands to styles for
  `hour`, `minute`, `second`, and `timeZoneName`, with the exact combination of
  values depending on the locale.

  Defaults to `short`.

```toml
[render.date_time]
time_zone = "America/Montreal"
locale = "fr-CA"
date_style = "medium"
time_style = "short"
```

#### `render.output`

The output filename for the rendered stars. Defaults to `README.md`.

When star partitioning is enabled, this file will be used for the partition
index file.

#### `render.output_dir`

The root directory for rendered output files. Defaults to `"."` (the repository
root). Useful for multi-user workflows where each user's stars are written to a
separate directory.

```toml
[render]
output_dir = "stars/halostatue"
```

#### `render.partition_output`

The output filename pattern for partitioned files. If `partition_output` does
not contain `{key}`, it is assumed that the pattern is a directory name and
`/{key}.md` will be appended. Defaults to `stars/{key}.md`.

#### `render.group`

How stars are grouped within the rendered file.

- `language` groups starred repositories by the first language of the
  repository. This is the default.

- `licence` groups starred repositories by the licence SPDX ID, or nickname if
  that is not present.

- `topic` groups starred repositories by the first topic of the repository.

#### `render.partition`

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

#### `render.template`

The path to the [glemplate][glemplate] template used for rendering stars.

If specified, refers to a template file in the repository being processed. If
not specified, refers to the default [`TEMPLATE.md.glemp`][default-template].

#### `render.index_template`

The path to the [glemplate][glemplate] template used for rendering the partition
index, when star partitioning is enabled.

If specified, refers to a template file in the repository being processed. If
not specified, refers to the default [`INDEX.md.glemp`][default-index].

### `git` Configuration

Configuration options to prepare the repository for updates to the generated
star list. The action `token` is used for authorizing commits and pushes back to
the origin remote.

#### `git.commit_message`

The commit message when a change is detected. Defaults to
`chore(updates): updated entries in files`.

#### `git.smart_commit`

Commits only if there are changed detectable other than the date that the stars
were run. Defaults to `true`.

#### `git.pull`

Additional options to use when calling `git pull` prior to committing the
update. The default value is blank for the action. Note that `--tags` and
`--unshallow` are added as required.

#### `git.committer`

An object with the committer name and email address for the action. Both `name`
and `email` must be provided together, or neither. Providing only one will
produce a configuration error. Defaults to a bot address:

```toml
[git.committer]
name = "github-actions[bot]"
email = "41898282+github-actions[bot]@users.noreply.github.com"
```

## Template Data

The data provided to the template is built from the retrieved GitHub starred
repositories for the user associated with the personal access token (`token`),
excluding any starred private repositories. This data is saved as a JSON data
file and then enriched into template variables for rendering.

There are two template contexts: the **star template** (used for the main page
or per-partition pages) and the **index template** (used only when partitioning
is enabled).

### Star Template Variables

- `login` (`string`): The GitHub login name associated with the personal access
  token.

- `truncated` (`boolean`): If `true`, the list of starred repositories should be
  considered _incomplete_. GitHub may truncate the star list for users with very
  many stars.

- `total` (`integer`): The total number of starred repositories on the account.

- `fetched` (`integer`): The number of stars actually retrieved (may be less
  than `total` when `fetch.max_stars` is set).

- `updated_at` (`Timestamp`): When the star data was last fetched or loaded. For
  the action, this value and `generated_value` are the same.

- `generated_at` (`Timestamp`): When the template was rendered. For the action,
  this value and `updated_at` are the same.

- `data_version` (`integer`): The data format version number.

- `groups` (`Group[]`): The starred repositories organized into groups based on
  the `render.group` setting. Each group has:

  - `name` (`string`): the group key (language name, topic name, or licence)
  - `repos` (`DisplayRepo[]`): the repositories in this group
  - `count` (`integer`): the number of repositories in this group
  - `count_label` (`string`): pre-formatted count ("1 repo" or "N repos")

  Groups are sorted alphabetically by `name`.

- `group_count` (`integer`): The total number of groups.

- `group_description` (`string`): A label describing the grouping (e.g.,
  "languages", "topics", "licences").

- `partition` (`Partition` or `false`): If not false, the partition for this
  template. Set only when partitioning is enabled.

### Index Template Variables

When partitioning is enabled, the index template receives many of the top-level
variables as the star template (`login`, `truncated`, `total`, `fetched`,
`updated_at`, `generated_at`, and `data_version`).

It also receives the following variables:

- `partitions` (`Partition[]`): The starred repositories organized into
  partitions based on the `render.partition` setting. Each partition has:

  - `name` (`string`): the partition key (e.g., "Rust", "go", "2024", "2024-03"
    depending on the partition strategy)
  - `filename` (`string`): the relative path to the partition file, suitable for
    use as a link target.
  - `count` (`integer`): the number of repositories in this partition
  - `count_label` (`string`): pre-formatted count ("1 repo" or "N repos")

- `partition_description` (`string`): A label describing the partitioning (e.g.,
  "languages", "topics", "years", "months").

- `partition_count` (`integer`): The total number of partitions.

### `DisplayRepo`

- `name` (`string`): The full name of the repository (`owner/repo`).

- `url` (`string`): The URL for the repository.

- `description` (`string`): The description of the repository, or an empty
  string if none.

- `licence` (`string`): The licence nickname, SPDX identifier, or
  `Unknown licence`.

- `forks` (`integer`): The number of forks.

- `stars` (`integer`): The total number of stars on the repository.

- `is_fork` (`boolean`): Whether the repository is a fork.

- `is_template` (`boolean`): Whether the repository is a template.

- `parent_repo` (`string`): The parent repository name if `is_fork` is true, or
  if the repo was generated from a template. Empty string if neither applies.

- `homepage_url` (`string`): The home page URL for the repository, or an empty
  string.

- `total_languages` (`integer`): The total number of languages detected in the
  repository.

- `languages` (`Language[]`): Up to the first ten languages in the repository.

- `topic_count` (`integer`): The number of topics associated with the
  repository.

- `topics` (`Topic[]` | `false`): The list of topics, or `false` if the
  repository has no topics.

- `topic_links` (`string` | `false`): Pre-formatted comma-separated markdown
  links for all topics, or `false` if the repository has no topics.

- `pushed_on` (`Timestamp`): When the repository was last pushed to.

- `starred_on` (`Timestamp`): When the user starred this repository.

- `archived_on` (`Timestamp` | `false`): When the repository was archived, or
  `false` if not archived.

- `latest_release` (`Release` | `false`): The most recent GitHub release, or
  `false` if the repository has no releases.

### `Timestamp`

A formatted timestamp with separate `date` and `time` string components,
localized using the `render.date_time` configuration.

- `date` (`string`): The formatted date component.
- `time` (`string`): The formatted time component.

### `Release`

- `name` (`string`): The release name (may be absent).
- `published_on` (`Timestamp`): When the release was published.

### `Topic`

- `name` (`string`): The topic name.
- `url` (`string`): The topic URL on GitHub.

### `Language`

- `name` (`string`): The language name (or `Unclassified` if none detected).
- `percent` (`integer`): Approximate percentage of code by bytes.

[date_style]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#datestyle
[default-index]: https://github.com/halostatue/starlist/blob/main/INDEX.md.glemp
[default-template]: https://github.com/halostatue/starlist/blob/main/TEMPLATE.md.glemp
[glemplate]: https://hexdocs.pm/glemplate/index.html
[idtf]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
[lparam]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#locales
[mawesome]: https://github.com/simonecorsi/mawesome
[pat]: https://github.com/settings/tokens/new
[stars]: https://github.com/halostatue/stars
[time_style]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timestyle
[time_zone]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezone
