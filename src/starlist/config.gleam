//// Starlist shared configuration types and TOML parsing.
////
//// These types are used by both the action and CLI entrypoints.
//// Each entrypoint has its own resolution module that builds a Config
//// from its specific inputs (action inputs vs CLI flags) using the
//// shared TOML parsing helpers here.

import gleam/dict.{type Dict}
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import starlist/internal/errors
import tom.{type Toml}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/// Resolved configuration.
pub type Config {
  Config(token: Option(String), fetch: Fetch, render: Render, git: Git)
}

/// Where to get star data.
pub type FetchSource {
  /// Fetch from the GitHub API.
  Api
  /// Load from an existing data.json file.
  File
}

/// Configuration for fetching stars.
pub type Fetch {
  Fetch(source: FetchSource, max_stars: Option(Int))
}

/// Configuration for rendering stars into Markdown.
pub type Render {
  Render(
    date_time: DateTimeConfig,
    filename: String,
    partition_filename: String,
    group: Group,
    partition: Partition,
    template: String,
    index_template: String,
  )
}

/// Configuration for Git operations.
pub type Git {
  Git(
    commit_message: String,
    pull: Option(String),
    committer: Option(#(String, String)),
  )
}

/// How dates and times are formatted.
pub type DateTimeConfig {
  IsoDateTime(time_zone: String)
  LocaleDateTime(
    locale: String,
    time_zone: String,
    date_style: String,
    time_style: String,
  )
}

/// How stars are grouped within a file.
pub type Group {
  GroupByLanguage
  GroupByTopic
  GroupByLicence
}

/// How stars are partitioned across files.
pub type Partition {
  PartitionOff
  PartitionByLanguage
  PartitionByTopic
  PartitionByYear
  PartitionByYearMonth
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

pub fn default_fetch() -> Fetch {
  Fetch(source: Api, max_stars: None)
}

pub fn default_render() -> Render {
  Render(
    date_time: IsoDateTime(time_zone: "UTC"),
    filename: "README.md",
    partition_filename: "stars/{key}.md",
    group: GroupByLanguage,
    partition: PartitionOff,
    template: "templates/TEMPLATE.md.glemp",
    index_template: "templates/INDEX.md.glemp",
  )
}

pub fn default_git() -> Git {
  Git(
    commit_message: "chore(updates): updated entries in files",
    pull: None,
    committer: None,
  )
}

// ---------------------------------------------------------------------------
// TOML parsing
// ---------------------------------------------------------------------------

/// Parse a TOML string into a dict. Returns a ConfigError on failure.
pub fn parse_toml(
  input: String,
) -> Result(Dict(String, Toml), errors.StarlistError) {
  case string.is_empty(string.trim(input)) {
    True -> Ok(dict.new())
    False ->
      case tom.parse(input) {
        Ok(d) -> Ok(d)
        Error(e) ->
          Error(errors.ConfigError("Invalid TOML: " <> parse_error_string(e)))
      }
  }
}

/// Decode fetch config from TOML, falling back to defaults.
pub fn decode_fetch(toml: Dict(String, Toml)) -> Fetch {
  Fetch(
    source: case tom.get_string(toml, ["fetch", "source"]) {
      Ok("file") -> File
      _ -> Api
    },
    max_stars: case tom.get_int(toml, ["fetch", "max_stars"]) {
      Ok(n) -> Some(n)
      Error(_) -> None
    },
  )
}

/// Decode render config from TOML, falling back to defaults.
pub fn decode_render(toml: Dict(String, Toml)) -> Render {
  let base = default_render()
  Render(
    date_time: decode_date_time(toml),
    filename: toml_string(toml, ["render", "output"], base.filename),
    partition_filename: toml_string(
      toml,
      ["render", "partition_output"],
      base.partition_filename,
    ),
    group: decode_group(toml),
    partition: decode_partition(toml),
    template: toml_string(toml, ["render", "template"], base.template),
    index_template: toml_string(
      toml,
      ["render", "index_template"],
      base.index_template,
    ),
  )
}

/// Decode git config from TOML, falling back to defaults.
pub fn decode_git(toml: Dict(String, Toml)) -> Git {
  let base = default_git()
  Git(
    commit_message: toml_string(
      toml,
      ["git", "commit_message"],
      base.commit_message,
    ),
    pull: case tom.get_string(toml, ["git", "pull"]) {
      Ok(v) -> Some(v)
      Error(_) -> None
    },
    committer: decode_committer(toml),
  )
}

// ---------------------------------------------------------------------------
// Internal decoders
// ---------------------------------------------------------------------------

fn decode_date_time(toml: Dict(String, Toml)) -> DateTimeConfig {
  let time_zone = toml_string(toml, ["render", "date_time", "time_zone"], "UTC")
  case tom.get_string(toml, ["render", "date_time", "locale"]) {
    Ok(locale) ->
      LocaleDateTime(
        locale: locale,
        time_zone: time_zone,
        date_style: toml_string(
          toml,
          ["render", "date_time", "date_style"],
          "short",
        ),
        time_style: toml_string(
          toml,
          ["render", "date_time", "time_style"],
          "short",
        ),
      )
    Error(_) -> IsoDateTime(time_zone: time_zone)
  }
}

fn decode_group(toml: Dict(String, Toml)) -> Group {
  case tom.get_string(toml, ["render", "group"]) {
    Ok("language") -> GroupByLanguage
    Ok("topic") -> GroupByTopic
    Ok("licence") | Ok("license") -> GroupByLicence
    _ -> GroupByLanguage
  }
}

fn decode_partition(toml: Dict(String, Toml)) -> Partition {
  case tom.get_string(toml, ["render", "partition"]) {
    Ok("language") -> PartitionByLanguage
    Ok("topic") -> PartitionByTopic
    Ok("year") -> PartitionByYear
    Ok("year-month") -> PartitionByYearMonth
    Ok("off") -> PartitionOff
    _ -> PartitionOff
  }
}

fn decode_committer(toml: Dict(String, Toml)) -> Option(#(String, String)) {
  let name = case tom.get_string(toml, ["git", "committer", "name"]) {
    Ok(n) if n != "" -> Ok(n)
    _ -> Error(Nil)
  }
  let email = case tom.get_string(toml, ["git", "committer", "email"]) {
    Ok(e) if e != "" -> Ok(e)
    _ -> Error(Nil)
  }
  case name, email {
    Ok(n), Ok(e) -> Some(#(n, e))
    _, _ -> None
  }
}

// ---------------------------------------------------------------------------
// TOML helpers
// ---------------------------------------------------------------------------

fn toml_string(
  toml: Dict(String, Toml),
  key: List(String),
  default: String,
) -> String {
  case tom.get_string(toml, key) {
    Ok(v) -> v
    Error(_) -> default
  }
}

fn parse_error_string(error: tom.ParseError) -> String {
  case error {
    tom.Unexpected(got:, expected:) ->
      "unexpected '" <> got <> "', expected " <> expected
    tom.KeyAlreadyInUse(key:) -> "duplicate key: " <> string.join(key, ".")
  }
}

// ---------------------------------------------------------------------------
// Path validation
// ---------------------------------------------------------------------------

/// Validate that a path stays within the repo root.
pub fn validate_path(
  path: String,
  repo_root: String,
  label: String,
) -> Result(String, errors.StarlistError) {
  let resolved = case is_absolute(path) {
    True -> path
    False -> repo_root <> "/" <> path
  }
  case normalize(resolved) {
    Ok(expanded) ->
      case string.starts_with(expanded, repo_root) {
        True -> Ok(expanded)
        False ->
          Error(errors.SecurityError(
            label <> " path '" <> path <> "' resolves outside repository root",
          ))
      }
    Error(Nil) ->
      Error(errors.SecurityError(
        label <> " path '" <> path <> "' contains invalid traversal",
      ))
  }
}

fn is_absolute(path: String) -> Bool {
  string.starts_with(path, "/")
}

/// Normalize a path by resolving `.` and `..` segments.
fn normalize(path: String) -> Result(String, Nil) {
  let #(prefix, to_split) = case string.starts_with(path, "/") {
    True -> #("/", string.drop_start(path, 1))
    False -> #("", path)
  }
  let segments = string.split(to_split, "/") |> collapse_segments([], _)
  case segments {
    Error(Nil) -> Error(Nil)
    Ok(parts) -> Ok(prefix <> string.join(parts, "/"))
  }
}

fn collapse_segments(
  acc: List(String),
  segments: List(String),
) -> Result(List(String), Nil) {
  case segments {
    [] -> Ok(list.reverse(acc))
    [".", ..rest] -> collapse_segments(acc, rest)
    ["", ..rest] -> collapse_segments(acc, rest)
    ["..", ..rest] ->
      case acc {
        [_, ..tail] -> collapse_segments(tail, rest)
        [] -> Error(Nil)
      }
    [seg, ..rest] -> collapse_segments([seg, ..acc], rest)
  }
}
