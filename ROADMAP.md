# halostatue/starlist Roadmap

Considerations for the future. This is _not_ a promise that these will be
implemented, but considerations for the future now that I've reimplemented this
in Gleam.

## Multi-user star fetching

> Chance of implementation: Low

Build a development team's shared star list based on each member of the team's
star collection. This could be done by making `fetch.users` accept a list of
users, including `@me` to indicate the PAT owner's user account.

There are open questions:

- Separate JSON files per user?
- Merged data?
- How to attribute stars to specific team members in templates if merged?
- Complexity: significant template and data model changes
- Target: v3 or new repo

## CLI Distribution

> Chance of implementation: Medium (JavaScript), Low (BEAM)

There is a "CLI" mode built in for test purposes, and this may be extremely
useful to some people. Supporting a JavaScript binary distribution is fairly
easy (but requires `package.json`), but it would be useful to have a BEAM
`escript` distribution (using `gleescript`) as well.

BEAM distribution means that a number of things which return promises now can no
longer do so, or we will need separate implementations. With the deprecation of
`@target` in Gleam, that becomes harder to justify.

## Separate template shapes for partition modes

> Chance of implementation: Medium

Instead of one template that works for both single-file and partitioned output,
have distinct template types with different variable shapes. This is especially
important if multi-user star fetching is implemented.

This prevents wrong-shape-for-wrong-mode errors at the type level.

This will probably be a v3 change _or_ a new repo.

## Private repo handling

> Chance of implementation: Medium

The current version of the action filters private repos before they're written
to `data.json`; this is still the case. When using the CLI, private repos are
saved to disk.

This behaviour should be configurable for `fetch` configuration (exclude before
writing to disk) and `render` configuration (include private repos in
rendering). Template variables would need to be updated to provide or clear
potentially sensitive data as separate fields (so the template writer has a
choice).

## Improve glemplate with expressions

> Chance of implementation: Medium

`glemplate` is fantastic but limited. There's no expression support, there's no
case or else-if support. Can `glemplate` be extended or replaced, or can we
anticipate most of the helper values to pre-compute them (probably not).

## Language alias mapping

Some Linguist language names have more recognizable aliases (e.g., `D2` →
`d2lang`, `Vim Script` → `viml`, `Shell` → `bash`)

- Could support a `[render.language_aliases]` TOML table for user overrides
- Default alias table could be generated from Linguist's `languages.yml`
  `aliases` field — each language lists its common aliases, and the first alias
  (or `fs_name` if present) could be the default partition key
- Would also solve cases like `F*` having `fs_name: Fstar` in Linguist

## Fetch order configuration

- `fetch.order` (ascending/descending) for controlling star sort order
- Useful with `max_stars` to get "most recent N stars"
- Requires changes to the GraphQL query to pass ordering parameters
- Parked because the current query doesn't support it
