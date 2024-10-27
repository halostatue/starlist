# halostatue/starlist Changelog

## 1.1.2 / 2024-10-27

- Remove `remark-github` until configuration can be added to support it.

## ~~1.1.1 / 2024-10-26~~

> This release has been removed because it does not work.

- Fix a small wording issue with the default template.
- Fix overstrict handling of the deliberately undocumented `git_local` input.

## 1.1.0 / 2024-10-26

In preparation for several major changes (see the [roadmap](./ROADMAP.md)),
halostatue/starlist configuration is now configured with a single configuration
input parameter, `config`. The configuration for `token` remains a separate
input because it must be masked on output.

New configuration options will be added only to the new config parameter object,
and any configuration option present in the config parameter take precedence
over the now deprecated named input parameters. For consistency, the names of
the date/time formatting configuration keys are also normalized to the same
pattern. Defaults remain the same.

Warnings are printed on the of old configuration input parameters (`date_time`,
`git_commit_message`, `git_email`, `git_name`, `git_pull_options`,
`load_stars_from_json`, `output_filename`, and `template_path`). Warnings will
also be printed on date/time formatting keys that use camel case (`dateStyle`,
`timeStyle`, `dayPeriod`, `fractionalSecondDigits`, `hourCycle`,
`numberingSystem`, and `timeZoneName`).

The use of the old configuration parameters will print warnings.

- The undocumented parameter `git_read_only` has been renamed to `git_local`
  with no backwards compatibility check. This emphasizes that this should be
  used only for local development testing.

## 1.0.0 / 2024-10-22

Forked from [simonecorsi/mawesome][mawesome] with substantial changes. It is not
backwards compatible.

- Input Changes

  - Removed `compact-by-topic` without direct replacement. The fields `topics`
    and `byTopic` have been added to the template data for use in the template.

  - Renamed `api-token` to `token` and described the permissions required for a
    classic Personal Access Token. Noted fine-grained PAT support as untested
    with a proposed permissions set.

  - Renamed `github-email` and `githu-name` to `git_email` and `git_name`. The
    defaults and purpose remain the same.

  - Exposed `git_pull_options` to alter the options provided to `git-pull` when
    preparing a commit. (This had been available but undocumented as
    `git-pull-method`.)

  - Added `load_stars_from_json` to load the star data from the `data.json`
    file. This permits halostatue/starlist to be run multiple times in the same
    workflow _without_ retrieving the star data from the GitHub API. In this
    way, two separate executions of halostatue/starlist can be used to simulate
    the previous option `compact-by-topic` with separate templates.

  - Added `date_time` to control the formatting of date and time values from
    timestamps.

  - Renamed `output-filename` and `template-path` to `output_filename` and
    `template_path`, respectively. (This assists with local testing as
    environment variables with dashes in them are illegal under Bash 4+.)

- Switched from EJS to Nunjucks for template management.
- Replaced [simonecorsi/gh-star-fetch][gh-star-fetch] with an in-tree GraphQL
  query and data transformation.
- Removed the `compactByTopics` configuration option.

- Package and Build Changes

  - Built for Node 20 using pnpm instead of npm.
  - Switched to Mise instead of Volta for version management.
  - Switched Biome.js for formatting and linting instead of ESLint and Prettier.
  - Switched to tsx instead of ts-node / ts-node-dev.
  - Removed commitlint, got, husky, lint-staged, markdown-release, nyc,
    semantic-release, and sinon.
  - Improved in-tree local execution for testing by not requiring
    `$GITHUB_REPOSITORY` and `$GITHUB_REF`, as well as adding the undocumented
    boolean option `git_read_only` to prevent modifying the local repo.
