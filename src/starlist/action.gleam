//// GitHub Actions entrypoint that executes the full workflow.
////
//// 1. Resolve configuration
//// 2. Git setup and pull
//// 3. Fetch (or load) stars
//// 4. Write star data and stage
//// 5. Resolve template variables
//// 6. Compile and render templates
//// 7. Write output files and stage
//// 8. Commit and push

import actions/core
import envoy
import filepath
import gleam/int
import gleam/javascript/promise.{type Promise}
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import simplifile
import starlist/config
import starlist/internal/action/config as action_config
import starlist/internal/action/setup as action_setup
import starlist/internal/errors.{type StarlistError}
import starlist/internal/git
import starlist/internal/github_client
import starlist/internal/partitioner
import starlist/internal/renderer.{type Template}
import starlist/internal/resolver
import starlist/internal/star_data
import starlist/internal/star_types.{
  type GeneratedFile, type TemplateVars, GeneratedFile,
}

const package_name = "halostatue/starlist"

const package_version = "2.0.2"

const auto_partition_threshold = 2000

pub fn main() -> Nil {
  register_process_handlers(core.error, core.set_failed)
  boot_info()

  promise.map(run(), fn(res) {
    case res {
      Ok(Nil) -> core.info("Done.")
      Error(err) -> core.set_failed(error_to_string(err))
    }
    Nil
  })

  Nil
}

fn boot_info() -> Nil {
  core.info(package_name <> " v" <> package_version)
  log_env_vars([
    "GITHUB_ACTION_REPOSITORY",
    "GITHUB_REPOSITORY",
  ])
}

fn log_env_vars(vars: List(String)) {
  list.each(vars, fn(name) {
    let value =
      name
      |> envoy.get
      |> result.unwrap(or: "<unset>")

    core.info(name <> ": " <> value)
  })
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

fn run() -> Promise(Result(Nil, StarlistError)) {
  // 1. Resolve configuration
  use cfg <- try_promise(action_config.resolve())
  log_config(cfg)
  let assert Some(token) = cfg.token

  // 2. Git setup and pull
  core.start_group("Git setup")
  use _ <- try_promise(setup_git(cfg.git, token))
  core.end_group()

  // 3. Fetch (or load) stars
  core.start_group("Fetch stars")
  use response <- promise.try_await(fetch_stars(cfg.fetch, token))
  core.end_group()

  // 4. Write star data and stage
  let public = filter_private(response)
  core.info(
    "Writing data.json (" <> int.to_string(public.fetched) <> " public)...",
  )
  use _ <- try_promise(star_data.write_data_file(public, "data.json"))
  use _ <- try_promise(git.add(["data.json"]))

  // 5. Resolve template variables
  let render = auto_partition(cfg.render, public.fetched)
  let vars = resolver.resolve_response(public, render.date_time, render.group)

  // 6. Compile and render templates
  core.start_group("Render")
  use templates <- try_promise(compile_templates(render))
  use files <- try_promise(render_files(render, templates, vars))
  core.end_group()

  // 7. Write output files and stage
  core.info(
    "Writing " <> int.to_string(list.length(files)) <> " output file(s)...",
  )
  use written <- try_promise(write_output_files(files))
  use _ <- try_promise(git.add(written))

  // 8. Commit and push
  core.start_group("Commit")
  let message = cfg.git.commit_message
  use commit_result <- try_promise(git.commit(message))
  case commit_result {
    git.NothingToCommit -> {
      core.info("Nothing to commit, skipping push.")
      core.end_group()
      promise.resolve(Ok(Nil))
    }
    git.Committed -> {
      let branch = case git.current_branch() {
        Ok(b) -> b
        Error(_) -> "HEAD"
      }
      use _ <- promise.try_await(promise.resolve(git.push(branch)))
      core.end_group()
      promise.resolve(Ok(Nil))
    }
  }
}

// ---------------------------------------------------------------------------
// Step helpers
// ---------------------------------------------------------------------------

fn setup_git(git_cfg: config.Git, token: String) -> Result(Nil, StarlistError) {
  use _ <- result.try(case git_cfg.committer {
    Some(committer) -> action_setup.setup(committer, token)
    None -> Ok(Nil)
  })
  case git_cfg.pull {
    Some(flags) -> {
      let shallow = case git.is_shallow() {
        Ok(v) -> v
        Error(_) -> False
      }
      git.pull(flags, shallow)
    }
    None -> Ok(Nil)
  }
}

fn fetch_stars(
  fetch: config.Fetch,
  token: String,
) -> Promise(Result(star_types.QueryResponse, StarlistError)) {
  case fetch.source {
    config.Api -> {
      core.info("Fetching stars from API...")
      promise.map(
        github_client.fetch_starred_repos(token, fetch.max_stars),
        fn(res) {
          result.map(res, fn(response) {
            core.info(
              "Fetched "
              <> int.to_string(response.fetched)
              <> "/"
              <> int.to_string(response.total)
              <> " stars",
            )
            response
          })
        },
      )
    }
    config.File -> {
      core.info("Loading stars from data.json...")
      promise.resolve(
        result.map(star_data.load_data_file("data.json"), fn(response) {
          core.info(
            "Loaded "
            <> int.to_string(response.fetched)
            <> "/"
            <> int.to_string(response.total)
            <> " stars",
          )
          response
        }),
      )
    }
  }
}

fn filter_private(
  response: star_types.QueryResponse,
) -> star_types.QueryResponse {
  let public = list.filter(response.stars, fn(r) { !r.is_private })
  star_types.QueryResponse(
    ..response,
    stars: public,
    fetched: list.length(public),
  )
}

fn auto_partition(render: config.Render, star_count: Int) -> config.Render {
  case render.partition {
    config.PartitionOff if star_count >= auto_partition_threshold -> {
      core.info(
        "Auto-partitioning by year ("
        <> int.to_string(star_count)
        <> " stars >= "
        <> int.to_string(auto_partition_threshold)
        <> ")",
      )
      config.Render(..render, partition: config.PartitionByYear)
    }
    _ -> render
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

type Templates {
  SingleTemplate(data: Template)
  MultiTemplate(data: Template, index: Template)
}

fn compile_templates(render: config.Render) -> Result(Templates, StarlistError) {
  use data_tpl <- result.try(compile_template(render.template))
  case render.partition {
    config.PartitionOff -> Ok(SingleTemplate(data: data_tpl))
    _ -> {
      use index_tpl <- result.try(compile_template(render.index_template))
      Ok(MultiTemplate(data: data_tpl, index: index_tpl))
    }
  }
}

fn compile_template(path: String) -> Result(Template, StarlistError) {
  renderer.compile_file(path)
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

fn render_files(
  render: config.Render,
  templates: Templates,
  vars: TemplateVars,
) -> Result(List(GeneratedFile), StarlistError) {
  case templates {
    SingleTemplate(data: tpl) -> {
      use rendered <- result.try(renderer.render(tpl, vars))
      Ok([GeneratedFile(filename: render.filename, data: rendered)])
    }
    MultiTemplate(data: data_tpl, index: index_tpl) -> {
      use pr <- try_partition(partitioner.partition(
        vars,
        render.partition,
        render.group,
        render.partition_filename,
      ))
      let index_vars = enrich_index_vars(vars, pr, render.partition)
      use index_rendered <- result.try(renderer.render(index_tpl, index_vars))
      let index_file =
        GeneratedFile(filename: render.filename, data: index_rendered)
      use data_files <- result.try(
        list.try_map(pr.data, fn(part) {
          use rendered <- result.try(renderer.render(data_tpl, part.vars))
          Ok(GeneratedFile(filename: part.filename, data: rendered))
        }),
      )
      Ok([index_file, ..data_files])
    }
  }
}

fn try_partition(
  result: Result(partitioner.PartitionResult, Nil),
  next: fn(partitioner.PartitionResult) ->
    Result(List(GeneratedFile), StarlistError),
) -> Result(List(GeneratedFile), StarlistError) {
  case result {
    Error(Nil) ->
      Error(errors.ConfigError("Partition returned Off in multi-file mode"))
    Ok(pr) -> next(pr)
  }
}

fn enrich_index_vars(
  vars: TemplateVars,
  pr: partitioner.PartitionResult,
  partition: config.Partition,
) -> TemplateVars {
  let contexts =
    list.map(pr.partitions, fn(p) {
      star_types.PartitionContext(
        name: p.key,
        filename: p.filename,
        count: p.count,
        count_label: case p.count {
          1 -> "1 repo"
          n -> int.to_string(n) <> " repos"
        },
      )
    })
  star_types.TemplateVars(
    ..vars,
    partitions: contexts,
    partition_count: list.length(contexts),
    partition_description: partition_description(partition),
  )
}

fn partition_description(p: config.Partition) -> String {
  case p {
    config.PartitionOff -> ""
    config.PartitionByLanguage -> "languages"
    config.PartitionByTopic -> "topics"
    config.PartitionByYear -> "years"
    config.PartitionByYearMonth -> "months"
  }
}

// ---------------------------------------------------------------------------
// File output
// ---------------------------------------------------------------------------

fn write_output_files(
  files: List(GeneratedFile),
) -> Result(List(String), StarlistError) {
  let repo_root = case simplifile.current_directory() {
    Ok(dir) -> dir
    Error(_) -> "."
  }
  list.try_map(files, fn(file) {
    use resolved <- result.try(config.validate_path(
      file.filename,
      repo_root,
      "output",
    ))
    use _ <- result.try(ensure_parent(resolved))
    case simplifile.write(to: resolved, contents: file.data) {
      Ok(Nil) -> Ok(file.filename)
      Error(_) -> Error(errors.FileError("Failed to write: " <> file.filename))
    }
  })
}

fn ensure_parent(path: String) -> Result(Nil, StarlistError) {
  let dir = filepath.directory_name(path)
  case simplifile.create_directory_all(dir) {
    Ok(_) -> Ok(Nil)
    Error(_) -> Error(errors.FileError("Cannot create directory: " <> dir))
  }
}

// ---------------------------------------------------------------------------
// Config logging
// ---------------------------------------------------------------------------

fn log_config(cfg: config.Config) -> Nil {
  core.start_group("Configuration")
  let fetch = cfg.fetch
  core.info(
    "fetch.source: "
    <> case fetch.source {
      config.Api -> "api"
      config.File -> "file"
    },
  )
  core.info(
    "fetch.max_stars: "
    <> case fetch.max_stars {
      Some(n) -> int.to_string(n)
      None -> "unlimited"
    },
  )
  let render = cfg.render
  core.info("render.filename: " <> render.filename)
  core.info("render.template: " <> render.template)
  core.info("render.index_template: " <> render.index_template)
  core.info("render.partition: " <> partition_to_string(render.partition))
  core.info("render.group: " <> group_to_string(render.group))
  core.info("render.partition_filename: " <> render.partition_filename)
  core.info("render.date_time: " <> date_time_to_string(render.date_time))
  let git_cfg = cfg.git
  core.info("git.commit_message: " <> git_cfg.commit_message)
  core.info(
    "git.pull: "
    <> case git_cfg.pull {
      Some("") -> "\"\""
      Some(f) -> "\"" <> f <> "\""
      None -> "disabled"
    },
  )
  core.info(
    "git.committer: "
    <> case git_cfg.committer {
      Some(#(name, email)) -> name <> " <" <> email <> ">"
      None -> "not set"
    },
  )
  core.end_group()
}

fn partition_to_string(p: config.Partition) -> String {
  case p {
    config.PartitionOff -> "off"
    config.PartitionByLanguage -> "language"
    config.PartitionByTopic -> "topic"
    config.PartitionByYear -> "year"
    config.PartitionByYearMonth -> "year-month"
  }
}

fn group_to_string(g: config.Group) -> String {
  case g {
    config.GroupByLanguage -> "language"
    config.GroupByTopic -> "topic"
    config.GroupByLicence -> "licence"
  }
}

fn date_time_to_string(dt: config.DateTimeConfig) -> String {
  case dt {
    config.IsoDateTime(tz) -> "iso (tz: " <> tz <> ")"
    config.LocaleDateTime(locale, tz, ds, ts) ->
      "locale=" <> locale <> " tz=" <> tz <> " date=" <> ds <> " time=" <> ts
  }
}

// ---------------------------------------------------------------------------
// Error formatting
// ---------------------------------------------------------------------------

fn error_to_string(err: StarlistError) -> String {
  case err {
    errors.ConfigError(msg) -> "Configuration error: " <> msg
    errors.GitHubApiError(msg) -> "GitHub API error: " <> msg
    errors.FileError(msg) -> "File error: " <> msg
    errors.TemplateError(msg) -> "Template error: " <> msg
    errors.MarkdownError(msg) -> "Markdown error: " <> msg
    errors.GitError(command:, exit_code:, message:) ->
      "Git error (exit "
      <> int.to_string(exit_code)
      <> ") running '"
      <> command
      <> "': "
      <> message
    errors.SecurityError(msg) -> "Security error: " <> msg
    errors.VersionMismatchError(expected:, found:) ->
      "Data version mismatch: expected "
      <> int.to_string(expected)
      <> ", found "
      <> int.to_string(found)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Lift a synchronous Result into the promise.try_await chain.
fn try_promise(
  result: Result(a, StarlistError),
  next: fn(a) -> Promise(Result(b, StarlistError)),
) -> Promise(Result(b, StarlistError)) {
  case result {
    Ok(v) -> next(v)
    Error(e) -> promise.resolve(Error(e))
  }
}

@external(javascript, "./process_handlers_ffi.mjs", "registerProcessHandlers")
fn register_process_handlers(
  error_fn: fn(String) -> Nil,
  set_failed_fn: fn(String) -> Nil,
) -> Nil
