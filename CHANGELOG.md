# halostatue/starlist Changelog

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

[v1 Changelog]: https://github.com/halostatue/starlist/commit/c4056cf07f04cbc534edb92b16a971cf516aa5f7/blob/Changelog.md
