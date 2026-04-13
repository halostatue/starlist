# halostatue/starlist Roadmap

Considerations for the future. This is _not_ a promise that these will be
implemented, but considerations for the future now that I've reimplemented this
in Gleam.

## Multi-user star fetching

> Chance of implementation: Low

User-specific star fetching has been implemented with the `fetch.login`
configuration. Combined with `data.path` and `render.out_dir`, it is now
possible to run `halostatue/starlist` for different users and ensure that the
data files and rendered Markdown files are separate.

It's unlikely that further development on this will be done for automatic
generation of a meta-index. This can be written by hand by users who want to use
it for team star repos.

## CLI Distribution

> Chance of implementation: Medium (JavaScript)

There is a "CLI" mode built in for test purposes, and this may be extremely
useful to some people. Supporting a JavaScript binary distribution should be
fairly easy (but requires a `package.json`).

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

## ~~Fetch order configuration~~ (done, v3.0)

- ~~`fetch.order` (ascending/descending) for controlling star sort order~~
- ~~Useful with `max_stars` to get "most recent N stars"~~
- ~~Requires changes to the GraphQL query to pass ordering parameters~~

## Commit options

> Chance of implementation: High

The action currently always commits and pushes after rendering. For multi-user
workflows (running the action multiple times with different `fetch.login` and
`render.output_dir` values), finer control over commit/push behaviour is needed.

- `git.push` (boolean, default `true`) to suppress push after commit
- Enables patterns like: fetch user A → commit (no push) → fetch user B → commit
  and push
- Without this, each action invocation pushes separately (which works but
  produces multiple pushes per workflow run)

## Improved Data Shape

The `StarData` is very closely aligned to the original GraphQL response. This is
problematic for the stored data for multiple reasons:

1. The data is highly duplicative (topics are not normalized into their own
   storage)
2. The starred repo fields can be flattened in many ways making template writing
   easier.

Some of this may depend on improved or inlined glemplate like functionality.
