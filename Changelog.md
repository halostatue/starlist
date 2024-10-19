# halostatue/starlist Changelog

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
