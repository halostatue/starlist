//// Starlist public API.
////
//// Thin facade over internal modules. Both frontends (action + CLI) should
//// call through here rather than reaching into `starlist/internal/*` directly.

import filepath
import gleam/javascript/promise.{type Promise}
import gleam/list
import gleam/option.{type Option, None}
import gleam/result
import simplifile
import starlist/config.{type Config}
import starlist/errors.{type StarlistError}
import starlist/git
import starlist/internal/data_file
import starlist/internal/github_client
import starlist/internal/partitioner
import starlist/internal/renderer
import starlist/internal/resolver
import starlist/internal/star_types.{type PageVars}
import starlist/types.{type OutputFile, type Repo, OutputFile}
import starlist/utils

pub type StarData =
  star_types.StarData

/// Build a Config from defaults only.
pub fn config_from_defaults() -> Config {
  config.Config(
    token: None,
    data: config.default_data(),
    fetch: config.default_fetch(),
    render: config.default_render(),
    git: config.default_git(),
  )
}

/// Build a Config from a TOML string, layered over defaults.
pub fn config_from_string(toml_string: String) -> Result(Config, StarlistError) {
  use toml <- result.try(config.parse_toml(toml_string))
  use data <- result.try(config.decode_data(toml))
  use fetch <- result.try(config.decode_fetch(toml))
  use git <- result.try(config.decode_git(toml))
  use render <- result.try(config.decode_render(toml))

  Ok(config.Config(token: None, data:, fetch:, git:, render:))
}

/// Build a Config from a TOML file, layered over defaults.
pub fn config_from_file(path: String) -> Result(Config, StarlistError) {
  case simplifile.read(from: path) {
    Ok(content) -> config_from_string(content)
    Error(_) -> Error(errors.FileError("Cannot read config file: " <> path))
  }
}

// ---------------------------------------------------------------------------
// Data: fetch / load / save / filter
// ---------------------------------------------------------------------------

/// Fetch starred repos from the GitHub API.
pub fn fetch_star_data(
  token: String,
  login: Option(String),
  max_stars: Option(Int),
  order: config.FetchOrder,
) -> Promise(Result(StarData, StarlistError)) {
  github_client.fetch_starred_repos(token, login, max_stars, order)
  |> promise.map(fn(result) {
    result.map(result, fn(raw) {
      let #(repos, login, truncated, total) = raw
      star_types.StarData(
        data_version: star_types.data_version,
        login: login,
        truncated: truncated,
        total: total,
        fetched: list.length(repos),
        repos: repos,
        updated_at: utils.now_iso(),
      )
    })
  })
}

/// Load star data from a JSON file.
pub fn load_star_data(filename: String) -> Result(StarData, StarlistError) {
  data_file.load_data_file(filename)
}

/// Save star data to a JSON file.
pub fn save_star_data(
  filename: String,
  data: StarData,
) -> Result(Nil, StarlistError) {
  data_file.write_data_file(data, filename)
}

/// Filter a StarData, keeping only repos that satisfy the predicate.
/// Updates the `fetched` count to match.
pub fn filter_repos(data: StarData, filter_fun: fn(Repo) -> Bool) -> StarData {
  let kept = list.filter(data.repos, filter_fun)
  star_types.StarData(..data, repos: kept, fetched: list.length(kept))
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const auto_partition_threshold = 2000

/// Auto-promote partition to ByYear when star count exceeds threshold.
pub fn auto_partition(render: config.Render, star_count: Int) -> config.Render {
  case render.partition {
    config.PartitionOff if star_count >= auto_partition_threshold ->
      config.Render(..render, partition: config.PartitionByYear)
    _ -> render
  }
}

/// Render star data into output files using the given config.
/// Handles single-file and multi-file (partitioned) modes.
pub fn render(
  render_config: config.Render,
  data: StarData,
) -> Result(List(OutputFile), StarlistError) {
  let vars =
    resolver.resolve_response(
      data,
      render_config.date_time,
      render_config.group,
    )

  case render_config.partition {
    config.PartitionOff -> render_single(render_config, vars)
    _ -> render_multi(render_config, vars)
  }
}

/// Write generated files to disk under `root_dir`, validating paths.
/// Returns the list of filenames written.
pub fn write_files(
  files: List(OutputFile),
  root_dir: String,
) -> Result(List(String), StarlistError) {
  let repo_root = case simplifile.current_directory() {
    Ok(dir) -> dir
    Error(_) -> "."
  }
  list.try_map(files, fn(file) {
    let path = filepath.join(root_dir, file.filename)
    use resolved <- result.try(utils.validate_path(path, repo_root, "output"))
    use _ <- result.try(ensure_parent(resolved))
    case simplifile.write(to: resolved, contents: file.data) {
      Ok(Nil) -> Ok(file.filename)
      Error(_) -> Error(errors.FileError("Failed to write: " <> file.filename))
    }
  })
}

/// Describe a partition mode as a human-readable plural noun.
pub fn partition_description(p: config.Partition) -> String {
  case p {
    config.PartitionOff -> ""
    config.PartitionByLanguage -> "languages"
    config.PartitionByTopic -> "topics"
    config.PartitionByYear -> "years"
    config.PartitionByYearMonth -> "months"
  }
}

// ---------------------------------------------------------------------------
// Internal: rendering
// ---------------------------------------------------------------------------

fn render_single(
  render: config.Render,
  vars: PageVars,
) -> Result(List(OutputFile), StarlistError) {
  use tpl <- result.try(renderer.compile_file(render.template))
  use rendered <- result.try(renderer.render_page(tpl, vars))
  Ok([OutputFile(filename: render.filename, data: rendered)])
}

fn render_multi(
  render: config.Render,
  vars: PageVars,
) -> Result(List(OutputFile), StarlistError) {
  use data_tpl <- result.try(renderer.compile_file(render.template))
  use index_tpl <- result.try(renderer.compile_file(render.index_template))

  case
    partitioner.partition(
      vars,
      render.partition,
      render.group,
      render.partition_filename,
      partition_description(render.partition),
    )
  {
    Error(Nil) ->
      Error(errors.ConfigError("Partition returned Off in multi-file mode"))
    Ok(pr) -> {
      use index_rendered <- result.try(renderer.render_index(
        index_tpl,
        pr.index,
      ))
      let index_file =
        OutputFile(filename: render.filename, data: index_rendered)
      use data_files <- result.try(
        list.try_map(pr.data, fn(part) {
          use rendered <- result.try(renderer.render_page(data_tpl, part.vars))
          Ok(OutputFile(filename: part.filename, data: rendered))
        }),
      )
      Ok([index_file, ..data_files])
    }
  }
}

// ---------------------------------------------------------------------------
// Internal: file helpers
// ---------------------------------------------------------------------------

fn ensure_parent(path: String) -> Result(Nil, StarlistError) {
  let dir = filepath.directory_name(path)
  case simplifile.create_directory_all(dir) {
    Ok(_) -> Ok(Nil)
    Error(_) -> Error(errors.FileError("Cannot create directory: " <> dir))
  }
}

// ---------------------------------------------------------------------------
// Git operations
// ---------------------------------------------------------------------------

/// Pull from origin with optional flags. Automatically adds --unshallow if needed.
pub fn pull(flags: String) -> Result(Nil, StarlistError) {
  let shallow = case git.is_shallow() {
    Ok(v) -> v
    Error(_) -> False
  }
  git.pull(flags, shallow)
}

/// Stage files, commit, and push. Returns True if a commit was made, False if clean.
pub fn commit_and_push(
  message: String,
  files: List(String),
) -> Result(Bool, StarlistError) {
  use _ <- result.try(git.add(files))
  use commit_result <- result.try(git.commit(message))
  case commit_result {
    git.NothingToCommit -> Ok(False)
    git.Committed -> {
      use branch <- result.try(git.current_branch())
      use _ <- result.try(git.push(branch))
      Ok(True)
    }
  }
}
