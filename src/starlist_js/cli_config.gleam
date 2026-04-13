//// CLI-specific configuration resolution.
////
//// Builds a Config from parsed CLI args, optionally layering a TOML file underneath.

import envoy
import gleam/option
import gleam/string
import shellout
import starlist/config
import starlist_js/cli_commands

/// Resolve a token from environment or credentials command.
pub fn resolve_token(
  credentials_command: Result(String, Nil),
) -> Result(String, String) {
  case envoy.get("GITHUB_TOKEN") {
    Ok(t) if t != "" -> Ok(t)
    _ ->
      case envoy.get("GH_TOKEN") {
        Ok(t) if t != "" -> Ok(t)
        _ ->
          case credentials_command {
            Ok(cmd) -> run_credentials_command(cmd)
            Error(_) ->
              Error(
                "No token: set $GITHUB_TOKEN, $GH_TOKEN, or use --github-credentials-command",
              )
          }
      }
  }
}

fn run_credentials_command(cmd: String) -> Result(String, String) {
  case shellout.command(run: "sh", with: ["-c", cmd], in: ".", opt: []) {
    Ok(output) -> {
      let trimmed = string.trim(output)
      case string.is_empty(trimmed) {
        True -> Error("Credentials command returned empty output")
        False -> Ok(trimmed)
      }
    }
    Error(#(_, msg)) ->
      Error("Credentials command failed: " <> string.trim(msg))
  }
}

/// Build a Fetch config from CLI args.
pub fn fetch_config(args: cli_commands.FetchArgs) -> config.Fetch {
  config.Fetch(
    source: config.Api,
    login: option.from_result(args.login),
    max_stars: option.from_result(args.max_stars),
    order: config.Ascending,
  )
}

/// Build a Render config from CLI generate args.
pub fn render_config(args: cli_commands.GenerateArgs) -> config.Render {
  config.Render(
    date_time: resolve_date_time(args),
    filename: args.output,
    output_dir: args.dir,
    partition_filename: args.partition_output,
    group: resolve_group(args.group),
    partition: resolve_partition(args.partition),
    template: args.template,
    index_template: args.index_template,
  )
}

// ---------------------------------------------------------------------------
// Internal resolvers
// ---------------------------------------------------------------------------

fn resolve_date_time(args: cli_commands.GenerateArgs) -> config.DateTimeConfig {
  let time_zone = result_unwrap(args.time_zone, "UTC")
  case args.locale {
    Ok(locale) ->
      config.LocaleDateTime(
        locale: locale,
        time_zone: time_zone,
        date_style: result_unwrap(args.date_style, "short"),
        time_style: result_unwrap(args.time_style, "short"),
      )
    Error(_) -> config.IsoDateTime(time_zone: time_zone)
  }
}

fn resolve_group(group: Result(String, Nil)) -> config.Group {
  case group {
    Ok("topic") -> config.GroupByTopic
    Ok("licence") | Ok("license") -> config.GroupByLicence
    _ -> config.GroupByLanguage
  }
}

fn resolve_partition(partition: Result(String, Nil)) -> config.Partition {
  case partition {
    Ok("language") -> config.PartitionByLanguage
    Ok("topic") -> config.PartitionByTopic
    Ok("year") -> config.PartitionByYear
    Ok("year-month") -> config.PartitionByYearMonth
    Ok("off") -> config.PartitionOff
    _ -> config.PartitionOff
  }
}

fn result_unwrap(r: Result(String, Nil), default: String) -> String {
  case r {
    Ok(v) -> v
    Error(_) -> default
  }
}
