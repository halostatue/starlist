//// CLI entrypoint for starlist.
////
//// Usage: gleam run -m starlist <subcommand> [options]
////
//// Subcommands: fetch, generate, run, commit

import argv
import clip
import gleam/int
import gleam/io
import gleam/javascript/promise
import gleam/list
import gleam/string
import starlist
import starlist/errors
import starlist/git
import starlist/star_data
import starlist/types.{type OutputFile}
import starlist_js/cli_commands.{
  type Command, type CommitArgs, type FetchArgs, type GenerateArgs,
}
import starlist_js/cli_config

pub fn main() -> Nil {
  case cli_commands.cli() |> clip.run(argv.load().arguments) {
    Error(msg) -> io.println_error(msg)
    Ok(cmd) -> dispatch(cmd)
  }
}

fn dispatch(cmd: Command) -> Nil {
  case cmd {
    cli_commands.Fetch(args) -> dispatch_fetch(args)
    cli_commands.Generate(args) -> dispatch_generate(args)
    cli_commands.Run(fetch:, generate:) -> {
      dispatch_fetch(fetch)
      dispatch_generate(generate)
    }
    cli_commands.Commit(args) -> dispatch_commit(args)
  }
}

fn dispatch_fetch(args: FetchArgs) -> Nil {
  case cli_config.resolve_token(args.credentials_command) {
    Error(msg) -> io.println_error(msg)
    Ok(token) -> {
      let fetch = cli_config.fetch_config(args)
      starlist.fetch_star_data(token, fetch.login, fetch.max_stars, fetch.order)
      |> promise.map(fn(res) {
        case res {
          Error(err) -> io.println_error("Fetch error: " <> string.inspect(err))
          Ok(data) -> {
            io.println(
              "Fetched " <> int.to_string(star_data.fetched(data)) <> " stars",
            )
            case starlist.save_star_data(args.output, data) {
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
  case starlist.load_star_data(args.input) {
    Error(err) -> io.println_error("Load error: " <> string.inspect(err))
    Ok(data) -> {
      let render = cli_config.render_config(args)
      case starlist.render(render, data) {
        Error(err) -> io.println_error(errors.to_string(err))
        Ok(files) -> write_files(files, render.output_dir)
      }
    }
  }
}

fn dispatch_commit(args: CommitArgs) -> Nil {
  case args.push {
    True ->
      case starlist.commit_and_push(args.message, ["."]) {
        Error(err) -> io.println_error(errors.to_string(err))
        Ok(False) -> io.println("Nothing to commit.")
        Ok(True) -> io.println("Committed and pushed: " <> args.message)
      }
    False ->
      case git.add(["."]) {
        Error(err) -> io.println_error(errors.to_string(err))
        Ok(_) ->
          case git.commit(args.message) {
            Error(err) -> io.println_error(errors.to_string(err))
            Ok(git.NothingToCommit) -> io.println("Nothing to commit.")
            Ok(git.Committed) -> io.println("Committed: " <> args.message)
          }
      }
  }
}

// ---------------------------------------------------------------------------
// File output
// ---------------------------------------------------------------------------

fn write_files(files: List(OutputFile), dir: String) -> Nil {
  case starlist.write_files(files, dir) {
    Ok(written) -> list.each(written, fn(f) { io.println("Wrote " <> f) })
    Error(err) -> io.println_error(errors.to_string(err))
  }
}
