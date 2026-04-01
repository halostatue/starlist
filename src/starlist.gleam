//// CLI entrypoint for starlist.
////
//// Usage: gleam run -m starlist <subcommand> [options]
////
//// Subcommands: fetch, generate, run, commit

import argv
import clip
import filepath
import gleam/int
import gleam/io
import gleam/javascript/promise
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import simplifile
import starlist/config
import starlist/internal/cli/commands.{
  type Command, type CommitArgs, type FetchArgs, type GenerateArgs, Commit,
  Fetch, Generate, Run,
}
import starlist/internal/cli/config as cli_config
import starlist/internal/git
import starlist/internal/github_client
import starlist/internal/partitioner
import starlist/internal/renderer.{type Template}
import starlist/internal/resolver
import starlist/internal/star_data
import starlist/internal/star_types.{type TemplateVars, GeneratedFile}

pub fn main() -> Nil {
  case commands.cli() |> clip.run(argv.load().arguments) {
    Error(msg) -> io.println_error(msg)
    Ok(cmd) -> dispatch(cmd)
  }
}

fn dispatch(cmd: Command) -> Nil {
  case cmd {
    Fetch(args) -> dispatch_fetch(args)
    Generate(args) -> dispatch_generate(args)
    Run(fetch:, generate:) -> {
      dispatch_fetch(fetch)
      dispatch_generate(generate)
    }
    Commit(args) -> dispatch_commit(args)
  }
}

fn dispatch_fetch(args: FetchArgs) -> Nil {
  case cli_config.resolve_token(args.credentials_command) {
    Error(msg) -> io.println_error(msg)
    Ok(token) -> {
      let max_stars = option.from_result(args.max_stars)
      github_client.fetch_starred_repos(token, max_stars)
      |> promise.map(fn(res) {
        case res {
          Error(err) -> io.println_error("Fetch error: " <> string.inspect(err))
          Ok(response) -> {
            io.println(
              "Fetched "
              <> int.to_string(list.length(response.stars))
              <> " stars",
            )
            case star_data.write_data_file(response, args.output) {
              Ok(_) -> io.println("Wrote " <> args.output)
              Error(err) ->
                io.println_error("Write error: " <> string.inspect(err))
            }
          }
        }
      })
      Nil
    }
  }
}

fn dispatch_generate(args: GenerateArgs) -> Nil {
  case star_data.load_data_file(args.input) {
    Error(err) -> io.println_error("Load error: " <> string.inspect(err))
    Ok(response) -> {
      let render = cli_config.render_config(args)
      let vars =
        resolver.resolve_response(response, render.date_time, render.group)
      case generate_files(render, vars) {
        Error(msg) -> io.println_error(msg)
        Ok(files) -> write_files(files, args.dir)
      }
    }
  }
}

fn dispatch_commit(args: CommitArgs) -> Nil {
  case git.add(["."]) {
    Error(err) -> io.println_error("git add: " <> string.inspect(err))
    Ok(_) ->
      case git.commit(args.message) {
        Error(err) -> io.println_error("git commit: " <> string.inspect(err))
        Ok(git.NothingToCommit) -> io.println("Nothing to commit.")
        Ok(git.Committed) -> {
          io.println("Committed: " <> args.message)
          case args.push {
            False -> Nil
            True ->
              case git.current_branch() {
                Error(err) ->
                  io.println_error("git branch: " <> string.inspect(err))
                Ok(branch) ->
                  case git.push(branch) {
                    Error(err) ->
                      io.println_error("git push: " <> string.inspect(err))
                    Ok(_) -> io.println("Pushed to " <> branch)
                  }
              }
          }
        }
      }
  }
}

// ---------------------------------------------------------------------------
// Generate helpers
// ---------------------------------------------------------------------------

fn generate_files(
  render: config.Render,
  vars: TemplateVars,
) -> Result(List(star_types.GeneratedFile), String) {
  case render.partition {
    config.PartitionOff -> {
      use tpl <- result.try(compile_template(render.template))
      use rendered <- result.try(render_template(tpl, vars))
      Ok([GeneratedFile(filename: render.filename, data: rendered)])
    }
    _ -> {
      use data_tpl <- result.try(compile_template(render.template))
      use index_tpl <- result.try(compile_template(render.index_template))
      case
        partitioner.partition(
          vars,
          render.partition,
          render.group,
          render.partition_filename,
        )
      {
        Error(Nil) -> Error("Partition returned Off in multi-file mode")
        Ok(pr) -> {
          let index_vars = enrich_index_vars(vars, pr, render.partition)
          use index_rendered <- result.try(render_template(
            index_tpl,
            index_vars,
          ))
          let index_file =
            GeneratedFile(filename: render.filename, data: index_rendered)
          use data_files <- result.try(
            list.try_map(pr.data, fn(part) {
              use rendered <- result.try(render_template(data_tpl, part.vars))
              Ok(GeneratedFile(filename: part.filename, data: rendered))
            }),
          )
          Ok([index_file, ..data_files])
        }
      }
    }
  }
}

fn compile_template(path: String) -> Result(Template, String) {
  case renderer.compile_file(path) {
    Ok(tpl) -> Ok(tpl)
    Error(err) -> Error(string.inspect(err))
  }
}

fn render_template(tpl: Template, vars: TemplateVars) -> Result(String, String) {
  case renderer.render(tpl, vars) {
    Ok(s) -> Ok(s)
    Error(err) -> Error("Render error: " <> string.inspect(err))
  }
}

fn write_files(files: List(star_types.GeneratedFile), dir: String) -> Nil {
  let root = case simplifile.current_directory() {
    Ok(d) -> d
    Error(_) -> "."
  }
  list.each(files, fn(file) {
    let path = filepath.join(dir, file.filename)
    case config.validate_path(path, root, "output") {
      Error(err) -> io.println_error("Security: " <> string.inspect(err))
      Ok(validated) ->
        case ensure_parent(validated) {
          Error(msg) -> io.println_error(msg)
          Ok(_) ->
            case simplifile.write(to: validated, contents: file.data) {
              Ok(_) -> io.println("Wrote " <> path)
              Error(err) ->
                io.println_error(
                  "Write error " <> path <> ": " <> string.inspect(err),
                )
            }
        }
    }
  })
}

fn enrich_index_vars(
  vars: star_types.TemplateVars,
  pr: partitioner.PartitionResult,
  partition: config.Partition,
) -> star_types.TemplateVars {
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
    partition_description: case partition {
      config.PartitionOff -> ""
      config.PartitionByLanguage -> "languages"
      config.PartitionByTopic -> "topics"
      config.PartitionByYear -> "years"
      config.PartitionByYearMonth -> "months"
    },
  )
}

fn ensure_parent(path: String) -> Result(Nil, String) {
  let dir = filepath.directory_name(path)
  case simplifile.create_directory_all(dir) {
    Ok(_) -> Ok(Nil)
    Error(err) ->
      Error("Cannot create directory " <> dir <> ": " <> string.inspect(err))
  }
}
