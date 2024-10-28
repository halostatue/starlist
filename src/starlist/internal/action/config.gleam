//// Action-specific configuration resolution.
////
//// Reads action inputs (token, config/config_file), parses TOML,
//// applies action defaults, returns a resolved Config.

import actions/core
import gleam/dict
import gleam/option.{None, Some}
import gleam/string
import simplifile
import starlist/config
import starlist/internal/errors
import tom

/// Action-specific default committer identity.
const bot_name = "github-actions[bot]"

const bot_email = "41898282+github-actions[bot]@users.noreply.github.com"

/// Resolve configuration from action inputs.
pub fn resolve() -> Result(config.Config, errors.StarlistError) {
  use token <- require_token()
  use toml <- read_toml()

  let fetch = config.decode_fetch(toml)
  let render = config.decode_render(toml)
  let git = apply_action_git_defaults(config.decode_git(toml))

  Ok(config.Config(token: Some(token), fetch: fetch, render: render, git: git))
}

fn require_token(
  next: fn(String) -> Result(config.Config, errors.StarlistError),
) -> Result(config.Config, errors.StarlistError) {
  case
    core.get_input_with_options(
      "token",
      core.InputOptions(required: True, trim_whitespace: True),
    )
  {
    Ok(t) -> {
      core.set_secret(t)
      next(t)
    }
    Error(msg) -> Error(errors.ConfigError("Missing token: " <> msg))
  }
}

fn read_toml(
  next: fn(dict.Dict(String, tom.Toml)) ->
    Result(config.Config, errors.StarlistError),
) -> Result(config.Config, errors.StarlistError) {
  let config_input = core.get_input("config")
  let config_file = core.get_input("config_file")

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
      case simplifile.read(config_file) {
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
    committer: case git.committer {
      None -> Some(#(bot_name, bot_email))
      other -> other
    },
  )
}
