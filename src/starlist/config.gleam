/// Starlist configuration
import gleam/bool
import gleam/dict.{type Dict}
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import starlist/errors.{type StarlistError}
import tom.{type Toml}

type Table =
  Dict(String, Toml)

/// Resolved configuration.
pub type Config {
  Config(
    token: Option(String),
    data: Data,
    fetch: Fetch,
    render: Render,
    git: Git,
  )
}

/// Configuration for the star data file.
pub type Data {
  Data(path: String)
}

/// Where to get star data.
pub type FetchSource {
  /// Fetch from the GitHub API.
  Api
  /// Load from an existing data JSON file.
  File
}

/// Sort order for starred repositories.
pub type FetchOrder {
  Descending
  Ascending
}

/// Configuration for fetching stars.
pub type Fetch {
  Fetch(
    source: FetchSource,
    login: Option(String),
    max_stars: Option(Int),
    order: FetchOrder,
  )
}

/// Configuration for rendering stars into Markdown.
pub type Render {
  Render(
    date_time: DateTimeConfig,
    filename: String,
    output_dir: String,
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
    /// The commit message to use for changed files.
    commit_message: String,
    /// Additional flags to pass to `git pull`. If `None`, no `git pull` will be executed.
    /// `--unshallow` will be added as required.
    pull: Option(String),
    /// The committer as `#(email, name)`. Used only by `starlist_action`.
    committer: Option(#(String, String)),
  )
}

/// How dates and times are formatted.
pub type DateTimeConfig {
  IsoDateTime(time_zone: String)
  /// The format for the date and time with a locale applied. See Intl.DateTimeConfig
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

pub fn default_data() -> Data {
  Data(path: "data.json")
}

pub fn default_fetch() -> Fetch {
  Fetch(source: Api, login: None, max_stars: None, order: Ascending)
}

pub fn default_render() -> Render {
  Render(
    date_time: IsoDateTime(time_zone: "UTC"),
    filename: "README.md",
    output_dir: ".",
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

/// Parse a TOML string into a dict. Returns a ConfigError on failure.
pub fn parse_toml(input: String) -> Result(Table, StarlistError) {
  case string.is_empty(string.trim(input)) {
    True -> Ok(dict.new())
    False ->
      case tom.parse(input) {
        Ok(d) -> Ok(d)
        Error(e) ->
          Error(errors.ConfigError("Invalid TOML: " <> toml_parse_error(e)))
      }
  }
}

const source_enum = [#("api", Api), #("file", File)]

const order_enum = [#("descending", Descending), #("ascending", Ascending)]

/// Decode data config from TOML, falling back to defaults.
pub fn decode_data(toml: Table) -> Result(Data, StarlistError) {
  let base = default_data()

  use _ <- is_table(toml, "data")
  use path <- get_string(toml, "data.path", base.path)

  Ok(Data(path:))
}

/// Decode fetch config from TOML, falling back to defaults.
pub fn decode_fetch(toml: Table) -> Result(Fetch, StarlistError) {
  let base = default_fetch()

  use _ <- is_table(toml, "fetch")
  use source <- get_enum(toml, "fetch.source", source_enum, base.source)
  use order <- get_enum(toml, "fetch.order", order_enum, base.order)
  use login <- get_opt_string(toml, "fetch.login")
  let login = case login {
    Some("@me") -> None
    _ -> login
  }
  use max_stars <- get_opt_pos_int(toml, ["fetch", "max_stars"])

  Ok(Fetch(source:, login:, max_stars:, order:))
}

/// Decode git config from TOML, falling back to defaults.
pub fn decode_git(toml: Table) -> Result(Git, StarlistError) {
  let base = default_git()

  use _ <- is_table(toml, "git")
  use committer <- decode_committer(toml)
  use commit_message <- get_string(
    toml,
    "git.commit_message",
    base.commit_message,
  )
  use pull <- get_opt_string(toml, "git.pull")

  Ok(Git(commit_message:, committer:, pull:))
}

const group_enum = [
  #("language", GroupByLanguage),
  #("licence", GroupByLicence),
  #("license", GroupByLicence),
  #("topic", GroupByTopic),
]

const partition_enum = [
  #("language", PartitionByLanguage),
  #("off", PartitionOff),
  #("topic", PartitionByTopic),
  #("year", PartitionByYear),
  #("year-month", PartitionByYearMonth),
]

/// Decode render config from TOML, falling back to defaults.
pub fn decode_render(toml: Table) -> Result(Render, StarlistError) {
  let base = default_render()

  use _ <- is_table(toml, "render")
  use date_time <- decode_date_time(toml, base.date_time)
  use group <- get_enum(toml, "render.group", group_enum, base.group)
  use partition <- get_enum(
    toml,
    "render.partition",
    partition_enum,
    base.partition,
  )

  use output_dir <- get_string(toml, "render.output_dir", base.output_dir)
  use filename <- get_string(toml, "render.output", base.filename)
  use partition_filename <- get_string(
    toml,
    "render.partition_output",
    base.partition_filename,
  )
  use template <- get_string(toml, "render.template", base.template)
  use index_template <- get_string(
    toml,
    "render.index_template",
    base.index_template,
  )

  Ok(Render(
    date_time:,
    filename:,
    group:,
    index_template:,
    output_dir:,
    partition:,
    partition_filename:,
    template:,
  ))
}

const date_time_styles = ["full", "long", "medium", "short"]

fn decode_date_time(
  toml: Table,
  default: DateTimeConfig,
  callback: fn(DateTimeConfig) -> Result(a, StarlistError),
) -> Result(a, StarlistError) {
  use table <- is_table(toml, "render.date_time")
  use <- bool.guard(dict.is_empty(table), return: callback(default))

  use time_zone <- get_string(toml, "render.date_time.time_zone", "UTC")

  case tom.get_string(toml, string.split("render.date_time.locale", on: ".")) {
    Ok(locale) -> {
      let styles_enum = list.zip(date_time_styles, date_time_styles)

      use date_style <- get_enum(
        toml,
        "render.date_time.date_style",
        styles_enum,
        "short",
      )
      use time_style <- get_enum(
        toml,
        "render.date_time.time_style",
        styles_enum,
        "short",
      )

      callback(LocaleDateTime(locale:, time_zone:, date_style:, time_style:))
    }
    Error(tom.NotFound(_)) -> callback(IsoDateTime(time_zone: time_zone))
    Error(error) -> toml_get_error(error)
  }
}

fn decode_committer(
  toml: Table,
  callback: fn(Option(#(String, String))) -> Result(a, StarlistError),
) -> Result(a, StarlistError) {
  use table <- is_table(toml, "git.committer")
  case dict.is_empty(table) {
    True -> callback(None)
    False -> {
      use name <- get_string(toml, "git.committer.name", "")
      use email <- get_string(toml, "git.committer.email", "")
      case name, email {
        "", "" -> callback(None)
        n, e if n != "" && e != "" -> callback(Some(#(n, e)))
        _, _ ->
          Error(errors.ConfigError(
            "git.committer requires both name and email, or neither",
          ))
      }
    }
  }
}

fn is_table(
  toml: Table,
  key: String,
  callback: fn(Table) -> Result(a, StarlistError),
) -> Result(a, StarlistError) {
  case tom.get_table(toml, string.split(key, on: ".")) {
    Ok(table) -> callback(table)
    Error(tom.NotFound(_)) -> callback(dict.new())
    Error(error) -> toml_get_error(error)
  }
}

fn get_enum(
  toml: Table,
  key: String,
  values: List(#(String, a)),
  default: a,
  callback: fn(a) -> Result(b, StarlistError),
) -> Result(b, StarlistError) {
  case tom.get_string(toml, string.split(key, on: ".")) {
    Ok(value) ->
      case list.key_find(in: values, find: value) {
        Ok(enum) -> callback(enum)
        Error(Nil) ->
          Error(errors.ConfigError(
            "Expected "
            <> key
            <> " to be one of "
            <> string.inspect(list.map(values, fn(v) { v.0 }))
            <> " but was "
            <> string.inspect(value),
          ))
      }

    Error(tom.NotFound(_)) -> callback(default)
    Error(error) -> toml_get_error(error)
  }
}

fn get_opt_pos_int(
  toml: Table,
  key: List(String),
  callback: fn(Option(Int)) -> Result(a, StarlistError),
) -> Result(a, StarlistError) {
  case tom.get_int(toml, key) {
    Ok(value) if value > 0 -> callback(Some(value))
    Ok(value) ->
      Error(errors.ConfigError(
        "Expected "
        <> toml_key(key)
        <> " to be a positive integer but was "
        <> string.inspect(value),
      ))
    Error(tom.NotFound(_)) -> callback(None)
    Error(error) -> toml_get_error(error)
  }
}

fn get_string(
  toml: Table,
  key: String,
  default: String,
  callback: fn(String) -> Result(a, StarlistError),
) -> Result(a, StarlistError) {
  case tom.get_string(toml, string.split(key, on: ".")) {
    Ok(value) -> callback(value)
    Error(tom.NotFound(_)) -> callback(default)
    Error(error) -> toml_get_error(error)
  }
}

fn get_opt_string(
  toml: Table,
  key: String,
  callback: fn(Option(String)) -> Result(a, StarlistError),
) -> Result(a, StarlistError) {
  case tom.get_string(toml, string.split(key, on: ".")) {
    Ok(value) -> callback(Some(value))
    Error(tom.NotFound(_)) -> callback(None)
    Error(error) -> toml_get_error(error)
  }
}

fn toml_parse_error(error: tom.ParseError) -> String {
  case error {
    tom.Unexpected(got:, expected:) ->
      "unexpected '" <> got <> "', expected " <> expected
    tom.KeyAlreadyInUse(key:) -> "duplicate key: " <> toml_key(key)
  }
}

fn toml_get_error(error: tom.GetError) -> Result(a, StarlistError) {
  let message = case error {
    tom.NotFound(key:) ->
      "Expected " <> toml_key(key) <> " to be present but was missing"
    tom.WrongType(expected:, got:, key:) ->
      "Expected "
      <> toml_key(key)
      <> " to be a TOML "
      <> expected
      <> " but got "
      <> got
  }

  Error(errors.ConfigError(message))
}

fn toml_key(key: List(String)) -> String {
  string.join(key, ".")
}
