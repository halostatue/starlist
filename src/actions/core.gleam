//// Just Enough @actions/core to be ~~dangerous~~useful.
////
//// This will be replaced with glazier/core soon.

import envoy
import gleam/dict.{type Dict}
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/string
import simplifile
import youid/uuid

/// Input Options
pub type InputOptions {
  InputOptions(
    /// Whether the input is required. If required and not present, will return an
    /// error. Defaults to false.
    required: Bool,
    /// Whether leading/trailing whitespace will be trimmed for the input. Defaults to
    /// true.
    trim_whitespace: Bool,
  )
}

/// The code to exit an action.
pub type ExitCode {
  /// A code indicating that the action was a failure (1)
  Failure
  /// A code indicating that the action was successful (0)
  Success
}

/// Optional properties that can be sent with annotation commands (notice, error, and
/// warning). See: https://docs.github.com/en/rest/reference/checks#create-a-check-run
/// for more information about annotations.
pub type AnnotationProperties {
  /// A title for the annotation.
  Title(String)
  /// The path of the file for which the annotation should be created.
  File(String)

  /// The start line for the annotation.
  StartLine(Int)

  /// The end line for the annotation. Defaults to `StartLine` when `StartLine` is
  /// provided.
  EndLine(Int)

  /// The start column for the annotation. Cannot be sent when `StartLine` and `EndLine`
  /// are different values.
  StartColumn(Int)

  /// The end column for the annotation. Cannot be sent when `StartLine` and `EndLine`
  /// are different values. Defaults to `StartColumn` when `StartColumn` is provided.
  EndColumn(Int)
}

const default_input_options = InputOptions(
  required: False,
  trim_whitespace: True,
)

/// Gets a GitHub Action input value with default options.
pub fn get_input(name: String) -> String {
  name
  |> get_input_with_options(default_input_options)
  |> result.unwrap(or: "")
}

/// Gets whether Actions Step Debug is on or not
pub fn is_debug() -> Bool {
  case envoy.get("RUNNER_DEBUG") {
    Ok("1") -> True
    _ -> False
  }
}

/// Gets a GitHub Action input value with provided options.
pub fn get_input_with_options(
  name: String,
  opts: InputOptions,
) -> Result(String, String) {
  let value: String = {
    let name_ =
      name
      |> string.replace(" ", "_")
      |> string.uppercase()

    envoy.get("INPUT_" <> name_)
    |> result.unwrap(or: "")
  }

  let trimmed_value: String = case opts.trim_whitespace {
    True -> string.trim(value)
    False -> value
  }

  case opts.required, trimmed_value == "" {
    True, True -> Error("Input required and not supplied: " <> name)
    _, _ -> Ok(trimmed_value)
  }
}

/// Gets the values of a multiline input with default options. Each value is also trimmed.
pub fn get_multiline_input(name: String) -> List(String) {
  name
  |> get_multiline_input_with_options(default_input_options)
  |> result.unwrap(or: [])
}

/// Gets the values of a multiline input with provided options.
pub fn get_multiline_input_with_options(
  name: String,
  opts: InputOptions,
) -> Result(List(String), String) {
  use value <- result.try(get_input_with_options(name, opts))

  let inputs =
    value
    |> string.split("\n")
    |> list.filter(fn(x) { x != "" })

  case opts.trim_whitespace {
    True -> Ok(list.map(inputs, fn(x) { string.trim(x) }))
    False -> Ok(inputs)
  }
}

/// Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
/// Supported boolean input list: `true | True | TRUE | false | False | FALSE`. The
/// return value is also in boolean type.
/// ref: https://yaml.org/spec/1.2/spec.html#id2804923
pub fn get_boolean_input(name: String) -> Result(Bool, String) {
  get_boolean_input_with_options(name, default_input_options)
}

const true_values = ["true", "True", "TRUE"]

const false_values = ["false", "False", "FALSE"]

/// Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
/// Supported boolean input list: `true | True | TRUE | false | False | FALSE`. The
/// return value is also in boolean type.
/// ref: https://yaml.org/spec/1.2/spec.html#id2804923
pub fn get_boolean_input_with_options(
  name: String,
  opts: InputOptions,
) -> Result(Bool, String) {
  use value <- result.try(get_input_with_options(name, opts))

  case list.contains(true_values, value), list.contains(false_values, value) {
    True, False -> Ok(True)
    False, True -> Ok(False)
    _, _ ->
      Error(
        "Input does not meet YAML 1.2 \"Core Schema\" specification: "
        <> name
        <> "\nSupport boolean input list: `true | True | TRUE | false | False | FALSE`",
      )
  }
}

/// Registers a secret which will get masked from logs
///
/// This function instructs the Actions runner to mask the specified value in any
/// logs produced during the workflow run. Once registered, the secret value will
/// be replaced with asterisks (***) whenever it appears in console output, logs,
/// or error messages.
///
/// This is useful for protecting sensitive information such as:
///
/// - API keys
/// - Access tokens
/// - Authentication credentials
/// - URL parameters containing signatures (SAS tokens)
///
/// Note that masking only affects future logs; any previous appearances of the
/// secret in logs before calling this function will remain unmasked.
///
/// ---
///
/// For security purposes, if the environment variable `GITHUB_ACTIONS` is not
/// `"true"`, the actual secret will not be printed because it is likely that the
/// action is being tested outside of GitHub Actions.
pub fn set_secret(secret: String) {
  case envoy.get("GITHUB_ACTIONS") {
    Ok("true") -> issue_command("add-mask", secret, None)
    _else -> issue_command("add-mask", "not-in-github-actions", None)
  }
}

/// Sets the action status to failed.
/// When the action exits it will be with an exit code of 1.
pub fn set_failed(message: String) {
  set_exit_code(Failure)
  error(message)
}

/// Begin an output group.
///
/// Output until the next `groupEnd` will be foldable in this group.
pub fn start_group(name: String) {
  issue("group", name)
}

/// End an output group.
pub fn end_group() {
  issue("endgroup", "")
}

/// Writes info to log
pub fn info(message: String) {
  io.println(message)
}

/// Writes debug message to user log
pub fn debug(message: String) {
  issue("debug", message)
}

/// Adds an error issue
pub fn error(message: String) {
  log_issue_with_properties("error", message, [])
}

/// Adds an error issue
pub fn error_with_properties(message: String, props: List(AnnotationProperties)) {
  log_issue_with_properties("error", message, props)
}

/// Adds a warning issue
pub fn warning(message: String) {
  log_issue_with_properties("warning", message, [])
}

/// Adds a warning issue
pub fn warning_with_properties(
  message: String,
  props: List(AnnotationProperties),
) {
  log_issue_with_properties("warning", message, props)
}

/// Adds a notice issue
pub fn notice(message: String) {
  log_issue_with_properties("notice", message, [])
}

/// Adds a notice issue
pub fn notice_with_properties(
  message: String,
  props: List(AnnotationProperties),
) {
  log_issue_with_properties("notice", message, props)
}

/// Sets env variable for this action and future actions in the job
pub fn export_variable(name: String, value: String) -> Result(Nil, String) {
  envoy.set(name, value)

  case get_nonempty_env_var("GITHUB_ENV") {
    Ok(_) -> issue_file_command("ENV", prepare_key_value_message(name, value))

    Error(Nil) -> {
      let props =
        [#("name", name)]
        |> dict.from_list()
        |> Some()

      issue_command("set-env", value, props)
      Ok(Nil)
    }
  }
}

/// Prepends input_path to the PATH (for this action and future actions).
pub fn add_path(input_path: String) -> Result(Nil, String) {
  use _ <- result.try(case get_nonempty_env_var("GITHUB_PATH") {
    Ok(_) -> issue_file_command("PATH", input_path)
    Error(Nil) -> {
      issue_command("add-path", input_path, None)
      Ok(Nil)
    }
  })

  let new_path = case get_nonempty_env_var("PATH") {
    Ok(path) -> input_path <> ":" <> path
    Error(Nil) -> input_path
  }

  "PATH"
  |> envoy.set(new_path)
  |> Ok()
}

/// Sets the value of an output.
pub fn set_output(name: String, value: String) -> Result(Nil, String) {
  case get_nonempty_env_var("GITHUB_OUTPUT") {
    Ok(_) ->
      issue_file_command("OUTPUT", prepare_key_value_message(name, value))
    Error(Nil) -> {
      io.print("\n")
      let props =
        [#("name", name)]
        |> dict.from_list()
        |> Some()

      issue_command("set-output", value, props)
      Ok(Nil)
    }
  }
}

/// Saves state for current action, the state can only be retrieved by this action's post
/// job execution.
pub fn save_state(name: String, value: String) -> Result(Nil, String) {
  case get_nonempty_env_var("GITHUB_STATE") {
    Ok(_) -> issue_file_command("STATE", prepare_key_value_message(name, value))
    Error(Nil) -> {
      let props =
        [#("name", name)]
        |> dict.from_list()
        |> Some()

      issue_command("save-state", value, props)
      Ok(Nil)
    }
  }
}

/// Gets the value of an state set by this action's main execution.
pub fn get_state(name: String) -> String {
  case envoy.get("STATE_" <> name) {
    Ok(value) -> value
    Error(Nil) -> ""
  }
}

fn get_nonempty_env_var(name) -> Result(String, Nil) {
  case envoy.get(name) {
    Ok(value) if value != "" -> Ok(value)
    _ -> Error(Nil)
  }
}

type CommandProperties =
  Dict(String, String)

fn log_issue_with_properties(
  command: String,
  message: String,
  props: List(AnnotationProperties),
) {
  issue_command(command, message, annotation_to_command_properties(props))
}

fn annotation_to_command_properties(
  props: List(AnnotationProperties),
) -> Option(CommandProperties) {
  case list.is_empty(props) {
    True -> None
    False -> {
      props
      |> list.fold(dict.new(), fn(acc, property) {
        case property {
          Title(value) -> dict.insert(acc, "title", value)
          File(value) -> dict.insert(acc, "file", value)
          StartLine(value) ->
            dict.insert(acc, "startLine", int.to_string(value))
          EndLine(value) -> dict.insert(acc, "endLine", int.to_string(value))
          StartColumn(value) ->
            dict.insert(acc, "startColumn", int.to_string(value))
          EndColumn(value) ->
            dict.insert(acc, "endColumn", int.to_string(value))
        }
      })
      |> Some()
    }
  }
}

fn issue(command: String, message: String) {
  issue_command(command, message, None)
}

fn issue_command(
  command: String,
  message: String,
  props: Option(CommandProperties),
) {
  let properties =
    props
    |> option.unwrap(or: dict.new())
    |> command_properties_to_string()

  io.println("::" <> command <> "::" <> properties <> escape_data(message))
}

fn issue_file_command(command: String, message: String) -> Result(Nil, String) {
  case envoy.get("GITHUB_" <> command) {
    Ok(file_path) -> {
      case simplifile.is_file(file_path) {
        Ok(True) -> {
          case simplifile.append(to: file_path, contents: message <> "\n") {
            Ok(Nil) -> Ok(Nil)
            Error(error) -> Error(simplifile.describe_error(error))
          }
        }
        Ok(False) -> Error("Missing file at path: " <> file_path)
        Error(error) -> Error(simplifile.describe_error(error))
      }
    }

    Error(Nil) ->
      Error("Unable to find environment variable for file command " <> command)
  }
}

fn command_properties_to_string(props: CommandProperties) -> String {
  case dict.is_empty(props) {
    True -> ""
    False -> {
      let values =
        props
        |> dict.fold([], fn(acc, k, v) {
          [k <> "=" <> escape_property(v), ..acc]
        })
        |> string.join(",")

      " " <> values
    }
  }
}

fn prepare_key_value_message(key: String, value: String) -> String {
  let delimiter = "ghadelimiter_" <> uuid.v7_string()

  key <> "<<" <> delimiter <> "\n" <> value <> "\n" <> delimiter
}

fn escape_data(value: String) -> String {
  value
  |> string.replace("%", "%25")
  |> string.replace("\r", "%0D")
  |> string.replace("\n", "%0A")
}

fn escape_property(value: String) -> String {
  value
  |> escape_data()
  |> string.replace(":", "%3A")
  |> string.replace(",", "%2C")
}

@external(javascript, "./core_ffi.mjs", "setExitCode")
fn set_exit_code(value: ExitCode) -> Nil
