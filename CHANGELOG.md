# halostatue/starlist Changelog

## 3.0.1 / 2026-05-03

A minor update, for a change.

Instead of using `esgleam`, starlist is now bundled with `pontil_build`. Other
dependencies were updated.

The README example also shows the use of [step-security/harden-runner][sshr] to
limit the outbound network requests permitted.

## 3.0.0 / 2026-04-18

This release presents more breaking changes. It uses the newest version of
[`pontil`][pontil] for GitHub Actions integration and has improved
maintainability through some architectural changes.

### User-Facing Changes

The previous version will work until you're ready to update. If you are not
using custom templates, the main change will be that the data format version has
changed and your existing `data.json` _must_ be re-fetched even if fetch is
otherwise disabled.

#### Configuration changes

- `data.path` has been added to configuration so that the star data JSON can be
  written to and read from a single location.
- `fetch.login` allows for the selection of stars for specific users. If
  omitted, or the special value `"@me"`, the owner of the PAT will be used for
  login resolution.
- `fetch.order` allows the stars to be returned in either descending (most
  recent first) or ascending order (oldest first). The default is ascending.
- `render.output_dir` allows for specific output directories.
- `git.committer` now requires both `name` and `email` provided, or the whole
  configuration omitted. Previously, one could be provided.

Additionally, the TOML configuration parser is much stricter. Previously, if
`fetch.source` was neither `"api"` nor `"file"`, it would fall back to `"api"`.
It now produces an error.

#### Fetch Changes

In addition to supporting `fetch.login` and `fetch.order`, the GraphQL query now
fetches up to 10 languages per repository from the previous limit of 5.

The action also filters starred private repositories from `data.json`
automatically (this is _not_ done by the CLI module).

#### Template Changes

Several template variables changed, requiring updates to any custom templates
that may be in use:

- `repo.license` → `repo.licence`: This was an error that should have been
  corrected with the previous version. If no licence can be found, the fallback
  value will be "Unknown licence".

- `repo.language_count` → `repo.total_languages`: This is a rename for clarity.
  `language_count` implied that it was limited to the number of languages
  _retrieved_, but it's actually the total number of languages that GitHub
  counts on the repository.

- `repo.topic_count` is no longer stored in `data.json`, but is instead computed
  from the retrieved list of topics when rendering.

- Index and page templates now have separate variable sets. In v2, both template
  types received all variables. Now page templates cannot access `partitions`,
  `partition_count`, or `partition_description`, and index templates cannot
  access `groups`, `stars`, `group_count`, or `group_description`.

### Implementation Changes

There's been significant restructuring to reduce code duplication between the
CLI and action implementations and shift `starlist.gleam` to being the common
interface between the two. There have also been a number of type and field
renames to better reflect the expected usage.

The CLI is not published as its own NPM package, but that will happen in a
future update.

## 2.1.0 / 2026-04-04

Use [pontil][pontil] instead of an embedded implementation of `actions/core`.

## 2.0.2 / 2026-04-03

- Fixed default template resolution by reading embedded templates if the
  templates cannot be found in the checked out repo.

- Fixed committer validation: empty name or email strings in TOML config are now
  treated as missing, falling back to bot defaults in the action.

- Fixed git push authentication: the action now builds the remote URL from
  `GITHUB_REPOSITORY` and `GITHUB_SERVER_URL` instead of mutating the existing
  remote URL.

- Fixed commit with nothing to commit: `git diff --cached --quiet` is checked
  before committing, so a clean working tree no longer causes an error.

- Updated PAT documentation: classic PATs require `public_repo` or `repo`;
  fine-grained PATs require `contents: read and write` on the target repository.

- Added `persist-credentials: false` guidance to action documentation.

## 2.0.1 / 2026-04-01

Fixed an issue with resolving default templates.

## 2.0.0 / 2026-04-01

This is a breaking change release and a complete rewrite in Gleam. This should
probably be made a new release because none of the configuration is the same.

The [v1 Changelog][v1-changelog] is on its last release from 2024-10-27.

[pontil]: https://hex.pm/packages/pontil
[sshr]: https://github.com/step-security/harden-runner
[v1-Changelog]: https://github.com/halostatue/starlist/commit/c4056cf07f04cbc534edb92b16a971cf516aa5f7/blob/Changelog.md
