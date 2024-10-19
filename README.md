# Starlist

This action queries the GitHub API to get list of the user's stars and generates
a list ordered by implementation language. This is an incompatible fork of
[simonecorsi/mawesome][mawesome].

An example can be seen at [halostatue/stars][stars].

## Requirements

- An empty repository
- A personal GitHub API key

## Configuration

The service can be configured setting the appropriate environment variables in
the workflow.

### `token` **required**

The Personal Access Token is mandatory to fetch stars from the API. The default
GitHub Actions token cannot be used, so it is necessary to to generate a
[Personal Access Token][pat] and then add it to the target repository's secrets
configuration.

Both classic and fine-grained PATs are supported. Classic PATs require no
additional OAuth scopes. Fine-grained PATs should be scoped to include the
target repository and the permissions `repository:contents:read-write`,
`repository:metadata:read-only`, and `account:starring:read-only`.

### `template_path` (default `./TEMPLATE.md.njk`)

The template path relative to the repo root directory. The default value is
[`TEMPLATE.md.njk`][default-template], a [`nunjucks`][nunjucks] template.

See [Template Data](#template-data) for more details.

### `date_time` (default _special_)

The YAML locale configuration for dates and times. This is used to configure
[`Intl.DateTimeFormat`][idtf] objects for formatting date and time. If omitted,
dates will be formatted as year-month-day and times will be formatted with a
24-hour clock, as if `iso: true` was specified.

- [`locale`][lparam]: The ISO locale to use, or the special value `iso`. If
  omitted, this value will default to `iso` if it is the only key or if the only
  other option provided is `timeZone`. Otherwise, it will default to `en`. The
  `Intl.DateTimeFormat` constructor accepts an array of locales; this action
  does not.

- [`timeZone`][timezone]: The timezone to use for adjusting timestamps (which
  are returned as `UTC` by GitHub). Defaults to `UTC`.

If the `locale` value is _not_ `iso`, additional options may be used:

- The [locale][lopt] options [`calendar`][calendar],
  [`numberingSystem`][numberingsystem], [`hour12`][hour12], and
  [`hourCycle`][hourcycle] will be applied to both date and time formatters.

- The [date-time component][dtopt] options [`weekday`][weekday], [`era`][era],
  [`year`][year], [`month`][month], and [`day`][day] will be applied to date
  formatters. These will be ignored if `dateStyle` is set.

- The [date-time component][dtopt] options [`dayPeriod`][dayPeriod],
  [`hour`][hour], [`minute`][minute], [`second`][second],
  [`fractionalSecondDigits`][fractionalSecondDigits],
  [`timeZoneName`][timeZoneName] will be applied to time formatters. These will
  be ignored if `timeStyle` is set.

- The [style][style] shortcuts [`dateStyle`][dateStyle] and
  [`timeStyle`][timeStyle] will be used in preference to date-time component
  options.

If no date formatter options are set, `dateStyle` will be set to `short`. If no
time formatter are set, `timeStyle` will be set to `short`.

The default configuration is

```yaml
locale: iso
timeZone: UTC
```

With this, dates will be formatted as an ISO date (`2024-10-21`) and times will
be formatted with a 24-hour clock, omitting minutes (`13:24`).

> NOTE: No validation is performed on the various date time format option
> _values_, but keys will be checked and only supported keys will be provided.

### `output_filename` (default `README.md`)

The output filename to use for the generated list of stars.

### `git_commit_message` (default: `chore(updates): updated entries in files`)

The commit message to use.

### `git_name` (default `GitHub Actions`)

The username for the commit of the updated star list.

### `git_email` (default `actions@users.noreply.github.com`)

The email address for the commit of the updated star list.

### `git_pull_options` (default blank)

The method to use when calling `git-pull` prior to committing the update. Blank
by default, supported values are any parameters to `git-pull`. Note that
`--tags` and `--unshallow` will be added automatically as required.

### `load_stars_from_json` (default `false`)

This is an advanced option. If specified, the viewer stargazing data will be
loaded from the `data.json` file in the repository.

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
          git_email: ${{ secrets.USER_EMAIL }}
          git_name: ${{ github.repository_owner }}
```

[calendar]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#calendar
[dateStyle]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#datestyle
[dayPeriod]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#dayperiod
[day]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#day
[default-template]: ./TEMPLATE.md.njk
[dtopt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#date-time_component_options
[era]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#era
[fractionalSecondDigits]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#fractionalseconddigits
[hour12]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hour12
[hour]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hour
[hourcycle]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hourcycle
[idtf]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
[lopt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#locale_options
[lparam]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#locales
[mawesome]: https://github.com/simonecorsi/mawesome
[minute]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#minute
[month]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#month
[numberingsystem]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#numberingsystem
[nunjucks]: https://mozilla.github.io/nunjucks/
[pat]: https://github.com/settings/tokens/new
[second]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#era
[stars]: https://github.com/halostatue/stars
[style]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#style_shortcuts
[timeStyle]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timestyle
[timeZoneName]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezonename
[timezone]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezone
[weekday]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#weekday
[year]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#year
[gateway]: https://github.com/orgs/community/discussions/36441#discussioncomment-11008673
