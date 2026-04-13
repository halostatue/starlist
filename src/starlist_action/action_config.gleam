//// Action-specific configuration resolution.
////
//// Reads action inputs (token, config/config_file), parses TOML,
//// applies action defaults, returns a resolved Config.

import gleam/dict
import gleam/option.{None, Some}
import gleam/result
import gleam/string
import pontil
import simplifile
import starlist/config
import starlist/errors.{type StarlistError}
import tom

/// Action-specific default committer identity.
const default_committer = #(
  "github-actions[bot]",
  "41898282+github-actions[bot]@users.noreply.github.com",
)

/// Resolve configuration from action inputs.
pub fn resolve() -> Result(config.Config, StarlistError) {
  use token <- require_token()
  use toml <- read_toml()
  use data <- result.try(config.decode_data(toml))
  use fetch <- result.try(config.decode_fetch(toml))
  use render <- result.try(config.decode_render(toml))
  use git <- result.try(config.decode_git(toml))

  let git = apply_action_git_defaults(git)

  Ok(config.Config(
    token: Some(token),
    data: data,
    fetch: fetch,
    render: render,
    git: git,
  ))
}

fn require_token(
  next: fn(String) -> Result(config.Config, StarlistError),
) -> Result(config.Config, StarlistError) {
  case pontil.get_input_opts("token", [pontil.InputRequired]) {
    Ok(t) -> {
      pontil.set_secret(t)
      next(t)
    }
    Error(msg) ->
      Error(errors.ConfigError("Missing token: " <> pontil.describe_error(msg)))
  }
}

fn read_toml(
  next: fn(dict.Dict(String, tom.Toml)) -> Result(config.Config, StarlistError),
) -> Result(config.Config, StarlistError) {
  let config_input = pontil.get_input("config")
  let config_file = pontil.get_input("config_file")

  case
    string.is_empty(string.trim(config_input)),
    string.is_empty(string.trim(config_file))
  {
    // Both provided
    False, False ->
      Error(errors.ConfigError("Cannot specify both 'config' and 'config_file'"))
    // Inline TOML
    False, True ->
      case config.parse_toml(config_input) {
        Ok(toml) -> next(toml)
        Error(e) -> Error(e)
      }
    // File TOML
    True, False ->
      case simplifile.read(from: config_file) {
        Ok(content) ->
          case config.parse_toml(content) {
            Ok(toml) -> next(toml)
            Error(e) -> Error(e)
          }
        Error(_) ->
          Error(errors.FileError("Cannot read config file: " <> config_file))
      }
    // Neither — use empty config
    True, True -> next(dict.new())
  }
}

/// Apply action-specific git defaults: pull enabled (empty string = default flags),
/// bot committer identity.
fn apply_action_git_defaults(git: config.Git) -> config.Git {
  config.Git(
    ..git,
    pull: case git.pull {
      None -> Some("")
      other -> other
    },
    committer: Some(case git.committer {
      Some(#(name, email)) -> #(
        case name {
          "" -> default_committer.0
          _ -> name
        },
        case email {
          "" -> default_committer.1
          _ -> email
        },
      )
      None -> default_committer
    }),
  )
}
