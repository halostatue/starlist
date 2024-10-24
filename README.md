# Starlist

This action queries the GitHub API to get the list of the user's stars and
generates markdown containing the list of stars grouped by implementation
language. This is an incompatible fork of [simonecorsi/mawesome][mawesome].

The generated markdown is output as a single file using a [Nunjucks][nunjucks]
template.

This action queries the GitHub API to get list of the user's stars and generates
a list ordered by implementation language.

An example can be seen at [halostatue/stars][stars].

## Requirements

- A (mostly) empty repository.
- A GitHub Personal Access Token

## Configuration

The service can be configured setting the appropriate environment variables in
the workflow.

### `token` **required**

The `token` parameter is **required** to fetch stars from the API. The GitHub
Actions default token cannot be used, so you must generate a
[Personal Access Token][pat] and then add it to the target repository's secrets
configuration.

Both classic and fine-grained PATs are supported. Classic PATs require no
additional OAuth scopes. Fine-grained PATs should be scoped to include the
target repository and the permissions `repository:contents:read-write`,
`repository:metadata:read-only`, and `account:starring:read-only`.

### `config` (default _special_)

The YAML configuration object. Any values present in a provided configuration
object parameter take precedence over _override_ values provided by other input
parameters.

#### `config.format`

General data formatting options. Currently only has one option, `date_time`

##### `config.format.date_time` (default _special_)

> This overrides the `date_time` input parameter.

The YAML locale configuration for dates and times. This is used to configure
[`Intl.DateTimeFormat`][idtf] objects for formatting date and time. If omitted,
dates will be formatted as year-month-day and times will be formatted with a
24-hour clock, as if `mode: iso` has been provided.

- `mode`: The formatting mode, either `iso` or `locale`. If omitted, this
  defaults to `iso` _unless_ a `locale` value other than `iso` is provided.

- [`time_zone`][time_zone] (deprecated name `timeZone`): The timezone to use for
  adjusting timestamps (which are returned as `UTC` by GitHub). Defaults to
  `UTC`.

- [`locale`][lparam]: The ISO locale to use. If `mode` is `locale`, this value
  defaults to `en`. The `Intl.DateTimeFormat` constructor accepts an array of
  locales; this action currently does not.

  The special value `iso` If omitted, this value will default to `iso` if it is
  the only key or if the only other option provided is `time_zone`.

If the `locale` value is _not_ `iso`, additional options may be used. Secondary
names marked with a dagger (†) are deprecated and will be removed in a future
version.

- The [locale][lopt] options [`calendar`][calendar],
  [`numbering_system`][numbering_system] (`numberingSystem`†),
  [`hour12`][hour12], and [`hour_cycle`][hour_cycle] (`hourCycle`†) will be
  applied to both date and time formatters.

- The [date-time component][dtopt] options [`weekday`][weekday], [`era`][era],
  [`year`][year], [`month`][month], and [`day`][day] will be applied to date
  formatters. These will be ignored if `date_style` is set.

- The [date-time component][dtopt] options [`day_period`][day_period]
  (`dayPeriod`†), [`hour`][hour], [`minute`][minute], [`second`][second],
  [`fractional_second_digits`][fractional_second_digits]
  (`fractionalSecondDigits`†), and [`time_zone_name`][time_zone_name]
  (`timeZoneName`†) will be applied to time formatters. These will be ignored if
  `time_style` is set.

- The [style][style] shortcuts [`date_style`][date_style] (`dateStyle`†) and
  [`time_style`][time_style] (`timeStyle`†) will be used in preference to
  date-time component options.

If no date formatter options are set, `date_style` will be set to `short`. If no
time formatter options are set, `time_style` will be set to `short`.

The default configuration is

```yaml
format:
  date_time:
    locale: iso
    time_zone: UTC
```

With this, dates will be formatted as an ISO date (`2024-10-21`) and times will
be formatted with a 24-hour clock, omitting minutes (`13:24`).

> NOTE: No validation is performed on the various date time format option
> _values_, but keys will be checked and only supported keys will be provided.

#### `config.git`

Configuration options to prepare the repository for updates for code generation.

##### `config.git.commit_message` (default: `chore(updates): updated entries in files`)

> This overrides the `git_commit_message` input parameter.

The commit message to use.

##### `config.git.name` (default `GitHub Actions`)

> This overrides the `git_name` input parameter.

The username for the commit of the updated star list.

##### `config.git.email` (default `actions@users.noreply.github.com`)

> This overrides the `git_email` input parameter.

The email address for the commit of the updated star list.

##### `config.git.pull_flags` (default blank)

> This overrides the `git_pull_options` input parameter.

The method to use when calling `git-pull` prior to committing the update. Blank
by default, supported values are any parameters to `git-pull`. Note that
`--tags` and `--unshallow` will be added automatically as required.

### `config.output`

Configuration options for generated file output.

#### `config.output.filename` (default `README.md`)

The output filename to use for the generated list of stars.

#### `config.stars`

Configuration options for star data retrieval.

##### `config.stars.source` (default `api`)

> This overrides the `load_stars_from_json` input parameter.

The source of the star data, either `api` or `file`. If set to `api`, the
stargazing data will be loaded from the GitHub API. If set to `file`, the
stargazing data will be loaded from the `data.json` file in the repository.

`load_stars_from_json: true` is the same as `config.stars.source: file`.

### `config.template`

Configuration options for template discovery and parsing.

### `config.template.source` (default `./TEMPLATE.md.njk`)

The template path relative to the repo root directory. The default value is
[`TEMPLATE.md.njk`][default-template], a [Nunjucks][nunjucks] template.

See [Template Data](#template-data) for more details.

### Deprecated Input Parameters

- `template_path` (use `config.template.source`)
- `date_time` (use `config.format.date_time`)
- `output_filename` (use `config.output.filename`)
- `git_commit_message` (use `config.git.commit_message`)
- `git_name` (use `config.git.name`)
- `git_email` (use `config.git.email`)
- `git_pull_options` (use `config.git.pull_options`)
- `load_stars_from_json` (use `config.stars.source`)

## Template Data

The data provided to the template is built from the retrieved GitHub starred
repositories for the user associated with the personal access token (`token`),
excluding any starred private repositories. This data is transformed into a
`Viewer` object and saved as `./data.json`.

It is then enriched as a `TemplateVars` object and passed to the template for
rendering.

### `Viewer` / `TemplateVars`

#### `login`: `string`

The GitHub login name associated with the personal access token.

#### `truncated`: `boolean`

If `true`, the list of starred repositories should be considered _incomplete_.
From the GitHub documentation:

> Is the list of stars for this user truncated? This is true for users that have
> many stars.

#### `total`: `number`

The total number of starred repositories returned.

#### `updatedAt`: `Timestamp`

When the data was last updated. Unless `load_stars_from_json` has been used,
this will be when the GraphQL API call completed.

#### `stars`: `StarredRepo[]`

The unprocessed list of starred repositories, a `StarredRepo` value.

#### `byLanguage`: `LanguageGroups`; `languages`: `string[]`

These fields are only in the data passed to the template. `byLanguage` is a map
of a repository's primary languages (by size); `languages` is a sorted list of
those languages.

#### `byTopic`: `TopicGroups`; `topics`: `Topic[]`

These fields are only in the data passed to the template. `byTopic` is a map of
a repository's topics; `topics` is a sorted list of those topics. Using
`byTopic` in your templates will result in a much larger list of repositories,
as repos with multiple topics will be present in each topic grouping.

Repositories without a topic are stored in the special topic value `no-topics`.

### `Timestamp`

A `Timestamp` is a formatted object of `date` and `time` strings localized using
the `date_time` configuration.

### `StarredRepo`

#### `archivedOn`: `Timestamp` | `null`

If the repository has been archived, the `Timestamp` when it was archived will
be returned here.

#### `description`: `string`

The description of the repository or `No description provided` if omitted.

#### `forks`: `number`

The number of forks on the repository.

#### `homepageUrl`: `string` | `null`

The optional home page URL for the repository.

#### `isFork`: `boolean`, `parentRepo`: `string` | `null`

If the repository is a fork, `isFork` will be `true` and `parentRepo` will be
set. If `isFork` is `false` and `parentRepo` is set, this may represent a
repository generated from a template.

#### `isTemplate`: `boolean`

If the repository is a template, this value will be `true`.

#### `languageCount`: `number`, `languages`: `Language[]`

`languageCount` is the total number of languages on the repo and `languages` is
a list of up to the first _five_ languages in a repo.

#### `latestRelease`: `Release` | `null`

If the repo is using GitHub releases, the most recent release will be provided.

#### `license`: `string`

This will be the license nickname, SPDX identifier, or the value
`Unknown license`.

#### `name`: `string`

The full name of the repository (`owner/repo`, e.g., `halostatue/starslist`).

#### `pushedOn`: `Timestamp`

The timestamp of the last push for the repository. This can be used to show
recent code activity on the repo.

#### `starredOn`: `Timestamp`

The timestamp of when the user starred this repository.

#### `stars`: `number`

The total number of stars reported for this repository.

#### `topicCount`: `number`, `topics`: `Topic[]` | `null`

The count of topics associated with this repository and the list of topics, if
there are any.

#### `url`: `string`

The URL for the repository (e.g., `https://github.com/owner/repo`).

### `Topic`

A `Topic` is a object with `name` and `url` string properties.

### `Language`

A `Language` is a object with a `name` string property and a `percent` number
property. The `percent` is the approximate percentage (as an integer) of code
that this language represents, by bytes.

If a repository does not have identified languages, an entry `Unclassified` will
be synthesized.

### `Release`

A `Release` is an object with the name of the GitHub release (or `Unnamed` if
not named) and the `Timestamp` value `publishedOn` for when the release was
published.

### `LanguageGroups`

A map of `string` language names to `StarredRepo[]`. Repositories are filtered
into language groups by the primary (most used by number of bytes) language.

### `TopicGroups`

A map of `string` topic names to an object with a `url` (`string`) and `entries`
(`StarredRepo[]`). Repositories are filtered into topic groups for each topic,
for up to 20 topics.

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
        uses: halostatue/starlist@v1
        with:
          token: ${{ secrets.API_TOKEN }}
          config: |
            git:
              email: ${{ secrets.USER_EMAIL }}
              name: ${{ github.repository_owner }}
```

[calendar]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#calendar
[date_style]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#datestyle
[day_period]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#dayperiod
[day]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#day
[default-template]: ./TEMPLATE.md.njk
[dtopt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#date-time_component_options
[era]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#era
[fractional_second_digits]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#fractionalseconddigits
[hour12]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hour12
[hour]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hour
[hour_cycle]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hourcycle
[idtf]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
[lopt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#locale_options
[lparam]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#locales
[mawesome]: https://github.com/simonecorsi/mawesome
[minute]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#minute
[month]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#month
[numbering_system]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#numberingsystem
[nunjucks]: https://mozilla.github.io/nunjucks/
[pat]: https://github.com/settings/tokens/new
[second]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#era
[stars]: https://github.com/halostatue/stars
[style]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#style_shortcuts
[time_style]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timestyle
[time_zone_name]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezonename
[time_zone]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezone
[weekday]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#weekday
[year]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#year
[gateway]: https://github.com/orgs/community/discussions/36441#discussioncomment-11008673
[nunjucks]: https://mozilla.github.io/nunjucks/
