/// Template compilation and rendering via glemplate.
/// Compiles template strings into renderable form and renders them
/// with TemplateVars converted to glemplate assigns.
import gleam/dict
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import gleam/string_tree
import glemplate/assigns.{type AssignData}
import glemplate/ast
import glemplate/parser
import glemplate/renderer
import glemplate/text as glemplate_text
import simplifile
import starlist/errors.{type StarlistError}
import starlist/internal/star_types.{
  type DisplayRelease, type DisplayRepo, type IndexVars, type PageVars,
  type PartitionContext,
}
import starlist/internal/templates
import starlist/types.{type Language, type Topic}

/// Opaque wrapper around a compiled glemplate template.
pub opaque type Template {
  Template(inner: ast.Template)
}

/// Compile a template from a file path, falling back to the embedded default
/// if the file cannot be read.
pub fn compile_file(path: String) -> Result(Template, StarlistError) {
  case simplifile.read(from: path) {
    Ok(content) -> compile(content, path)
    Error(_) ->
      case embedded_template(path) {
        Ok(content) -> compile(content, path)
        Error(Nil) -> Error(errors.FileError("Cannot read template: " <> path))
      }
  }
}

fn embedded_template(path: String) -> Result(String, Nil) {
  case path {
    "templates/TEMPLATE.md.glemp" -> Ok(templates.page)
    "templates/INDEX.md.glemp" -> Ok(templates.index)
    _ -> Error(Nil)
  }
}

/// Compile a template string into a renderable form.
pub fn compile(source: String, name: String) -> Result(Template, StarlistError) {
  let p = parser.new()
  case parser.parse_to_template(source, name, p) {
    Ok(tpl) -> Ok(Template(inner: tpl))
    Error(err) ->
      Error(errors.TemplateError(
        "Failed to compile template '"
        <> name
        <> "': "
        <> parse_error_to_string(err),
      ))
  }
}

/// Render a compiled template with PageVars (single-file or per-partition).
pub fn render_page(
  template: Template,
  vars: PageVars,
) -> Result(String, StarlistError) {
  let a = page_vars_to_assigns(vars)
  render_assigns(template, a)
}

/// Render a compiled template with IndexVars (partition index).
pub fn render_index(
  template: Template,
  vars: IndexVars,
) -> Result(String, StarlistError) {
  let a = index_vars_to_assigns(vars)
  render_assigns(template, a)
}

fn render_assigns(
  template: Template,
  a: dict.Dict(String, AssignData),
) -> Result(String, StarlistError) {
  let cache = dict.new()
  case glemplate_text.render(template.inner, a, cache) {
    Ok(tree) -> Ok(string_tree.to_string(tree))
    Error(err) ->
      Error(errors.TemplateError(
        "Failed to render template: " <> render_error_to_string(err),
      ))
  }
}

// --- Assigns conversion ---

/// Convert PageVars into glemplate assigns dict.
fn page_vars_to_assigns(vars: PageVars) -> dict.Dict(String, AssignData) {
  let sorted_keys =
    dict.keys(vars.groups)
    |> list.sort(string.compare)

  assigns.new()
  |> assigns.add_int("data_version", vars.data_version)
  |> assigns.add_dict("updated_at", timestamp_to_assigns(vars.updated_at))
  |> assigns.add_dict("generated_at", timestamp_to_assigns(vars.generated_at))
  |> assigns.add_string("login", vars.login)
  |> assigns.add_bool("truncated", vars.truncated)
  |> assigns.add_int("total", vars.total)
  |> assigns.add_int("fetched", vars.fetched)
  |> assigns.add_list("stars", list.map(vars.stars, starred_repo_to_assign))
  |> assigns.add_int("group_count", vars.group_count)
  |> assigns.add_string("group_description", vars.group_description)
  |> assigns.add_list("groups", build_groups(sorted_keys, vars.groups))
  |> add_partition(vars.partition)
}

/// Convert IndexVars into glemplate assigns dict.
fn index_vars_to_assigns(vars: IndexVars) -> dict.Dict(String, AssignData) {
  assigns.new()
  |> assigns.add_int("data_version", vars.data_version)
  |> assigns.add_dict("updated_at", timestamp_to_assigns(vars.updated_at))
  |> assigns.add_dict("generated_at", timestamp_to_assigns(vars.generated_at))
  |> assigns.add_string("login", vars.login)
  |> assigns.add_bool("truncated", vars.truncated)
  |> assigns.add_int("total", vars.total)
  |> assigns.add_int("fetched", vars.fetched)
  |> assigns.add_list("partitions", build_partition_list(vars.partitions))
  |> assigns.add_int("partition_count", vars.partition_count)
  |> assigns.add_string("partition_description", vars.partition_description)
}

fn timestamp_to_assigns(ts: types.Timestamp) -> dict.Dict(String, AssignData) {
  assigns.new()
  |> assigns.add_string("date", ts.date)
  |> assigns.add_string("time", ts.time)
}

fn starred_repo_to_assign(repo: DisplayRepo) -> AssignData {
  let d =
    assigns.new()
    |> assigns.add_string("name", repo.name)
    |> assigns.add_string("url", repo.url)
    |> assigns.add_string("licence", repo.licence)
    |> assigns.add_int("forks", repo.forks)
    |> assigns.add_int("stars", repo.stars)
    |> assigns.add_bool("is_fork", repo.is_fork)
    |> assigns.add_bool("is_private", repo.is_private)
    |> assigns.add_bool("is_template", repo.is_template)
    |> assigns.add_int("total_languages", repo.total_languages)
    |> assigns.add_list(
      "languages",
      list.map(repo.languages, language_to_assign),
    )
    |> assigns.add_dict("pushed_on", timestamp_to_assigns(repo.pushed_on))
    |> assigns.add_dict("starred_on", timestamp_to_assigns(repo.starred_on))
    |> add_optional_string("description", repo.description)
    |> add_optional_string("homepage_url", repo.homepage_url)
    |> add_optional_string("parent_repo", repo.parent_repo)
    |> add_optional_timestamp("archived_on", repo.archived_on)
    |> add_optional_release("latest_release", repo.latest_release)
    |> add_optional_topics("topics", repo.topics)
    |> add_optional_topic_links("topic_links", repo.topics)
    |> add_topic_count(repo.topics)
  assigns.Dict(d)
}

fn language_to_assign(lang: Language) -> AssignData {
  assigns.Dict(
    assigns.new()
    |> assigns.add_string("name", lang.name)
    |> assigns.add_int("percent", lang.percent),
  )
}

fn topic_to_assign(topic: Topic) -> AssignData {
  assigns.Dict(
    assigns.new()
    |> assigns.add_string("name", topic.name)
    |> assigns.add_string("url", topic.url),
  )
}

fn release_to_assigns(rel: DisplayRelease) -> dict.Dict(String, AssignData) {
  let d =
    assigns.new()
    |> assigns.add_dict("published_on", timestamp_to_assigns(rel.published_on))
  case rel.name {
    Some(n) -> assigns.add_string(d, "name", n)
    None -> d
  }
}

// --- Optional field helpers ---

fn add_optional_string(
  d: dict.Dict(String, AssignData),
  key: String,
  value: Option(String),
) -> dict.Dict(String, AssignData) {
  case value {
    Some(v) -> assigns.add_string(d, key, v)
    None -> assigns.add_string(d, key, "")
  }
}

fn add_optional_timestamp(
  d: dict.Dict(String, AssignData),
  key: String,
  value: Option(types.Timestamp),
) -> dict.Dict(String, AssignData) {
  case value {
    Some(ts) -> assigns.add_dict(d, key, timestamp_to_assigns(ts))
    None -> assigns.add_bool(d, key, False)
  }
}

fn add_optional_release(
  d: dict.Dict(String, AssignData),
  key: String,
  value: Option(DisplayRelease),
) -> dict.Dict(String, AssignData) {
  case value {
    Some(rel) -> assigns.add_dict(d, key, release_to_assigns(rel))
    None -> assigns.add_bool(d, key, False)
  }
}

fn add_optional_topics(
  d: dict.Dict(String, AssignData),
  key: String,
  value: Option(List(Topic)),
) -> dict.Dict(String, AssignData) {
  case value {
    Some(topics) -> assigns.add_list(d, key, list.map(topics, topic_to_assign))
    None -> assigns.add_bool(d, key, False)
  }
}

fn add_topic_count(
  d: dict.Dict(String, AssignData),
  value: Option(List(Topic)),
) -> dict.Dict(String, AssignData) {
  assigns.add_int(d, "topic_count", case value {
    Some(topics) -> list.length(topics)
    None -> 0
  })
}

/// Pre-join topic links as a comma-separated markdown string.
/// Glemplate has no loop metadata (loop.last), so we compute this upfront.
fn add_optional_topic_links(
  d: dict.Dict(String, AssignData),
  key: String,
  value: Option(List(Topic)),
) -> dict.Dict(String, AssignData) {
  case value {
    Some(topics) -> {
      let links =
        list.map(topics, fn(t) { "[" <> t.name <> "](" <> t.url <> ")" })
        |> string.join(", ")
      assigns.add_string(d, key, links)
    }
    None -> assigns.add_bool(d, key, False)
  }
}

fn add_partition(
  d: dict.Dict(String, AssignData),
  value: option.Option(PartitionContext),
) -> dict.Dict(String, AssignData) {
  case value {
    option.Some(ctx) ->
      assigns.add_dict(
        d,
        "partition",
        assigns.new()
          |> assigns.add_string("name", ctx.name)
          |> assigns.add_string("filename", ctx.filename)
          |> assigns.add_int("count", ctx.count)
          |> assigns.add_string("count_label", ctx.count_label),
      )
    option.None -> assigns.add_bool(d, "partition", False)
  }
}

fn build_partition_list(partitions: List(PartitionContext)) -> List(AssignData) {
  list.map(partitions, fn(ctx) {
    assigns.Dict(
      assigns.new()
      |> assigns.add_string("name", ctx.name)
      |> assigns.add_string("filename", ctx.filename)
      |> assigns.add_int("count", ctx.count)
      |> assigns.add_string("count_label", ctx.count_label),
    )
  })
}

/// Build a list of {name, repos, count, count_label} dicts for template iteration.
fn build_groups(
  keys: List(String),
  groups: dict.Dict(String, List(DisplayRepo)),
) -> List(AssignData) {
  list.map(keys, fn(key) {
    let repos = case dict.get(groups, key) {
      Ok(r) -> r
      Error(_) -> []
    }
    let name = case key {
      "" -> "Other"
      k -> k
    }
    let count = list.length(repos)
    let label = case count {
      1 -> "1 repo"
      n -> int.to_string(n) <> " repos"
    }
    assigns.Dict(
      assigns.new()
      |> assigns.add_string("name", name)
      |> assigns.add_string("slug", slugify(name))
      |> assigns.add_list("repos", list.map(repos, starred_repo_to_assign))
      |> assigns.add_int("count", count)
      |> assigns.add_string("count_label", label),
    )
  })
}

/// GitHub-style heading slug: lowercase, spaces → hyphens, strip non-alnum/hyphen.
fn slugify(s: String) -> String {
  s
  |> string.lowercase
  |> string.to_graphemes
  |> list.map(fn(c) {
    case c {
      " " -> "-"
      _ ->
        case is_slug_char(c) {
          True -> c
          False -> ""
        }
    }
  })
  |> string.join("")
}

fn is_slug_char(c: String) -> Bool {
  case c {
    "a"
    | "b"
    | "c"
    | "d"
    | "e"
    | "f"
    | "g"
    | "h"
    | "i"
    | "j"
    | "k"
    | "l"
    | "m"
    | "n"
    | "o"
    | "p"
    | "q"
    | "r"
    | "s"
    | "t"
    | "u"
    | "v"
    | "w"
    | "x"
    | "y"
    | "z"
    | "0"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "-" -> True
    _ -> False
  }
}

// --- Error formatting ---

fn parse_error_to_string(err: parser.ParseError) -> String {
  case err {
    parser.LexerError(msg) -> "Lexer error: " <> msg
    parser.ParserError(msgs) -> "Parser errors: " <> string.join(msgs, "; ")
  }
}

fn render_error_to_string(err: renderer.RenderError) -> String {
  case err {
    renderer.AssignNotFound(var, _) ->
      "Assign not found: " <> var_to_string(var)
    renderer.AssignNotIterable(var, _) ->
      "Assign not iterable: " <> var_to_string(var)
    renderer.AssignNotStringifiable(var, _) ->
      "Assign not stringifiable: " <> var_to_string(var)
    renderer.AssignFieldNotFound(var, field, _) ->
      "Field '" <> field <> "' not found on: " <> var_to_string(var)
    renderer.AssignNotFieldAccessible(var, _) ->
      "Assign not field-accessible: " <> var_to_string(var)
    renderer.ChildTemplateNotFound(tpl_name) ->
      "Child template not found: " <> tpl_name
  }
}

fn var_to_string(var: ast.Var) -> String {
  case var {
    ast.Assign(name) -> name
    ast.FieldAccess(container, field) ->
      var_to_string(container) <> "." <> field
  }
}
