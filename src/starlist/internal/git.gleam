//// Git shell operations — pure wrappers around git commands.

import gleam/list
import gleam/string
import shellout
import starlist/internal/errors

/// Stage files for commit.
pub fn add(paths: List(String)) -> Result(Nil, errors.StarlistError) {
  use _ <- try(git(list.prepend(paths, "add")))
  Ok(Nil)
}

/// Commit staged changes.
pub fn commit(message: String) -> Result(Nil, errors.StarlistError) {
  use _ <- try(git(["commit", "-m", message]))
  Ok(Nil)
}

/// Push to the given branch with --follow-tags. No-op if no remote origin.
pub fn push(branch: String) -> Result(Nil, errors.StarlistError) {
  case remote_url() {
    Error(_) -> Ok(Nil)
    Ok(_) -> {
      use _ <- try(git(["push", "--follow-tags", "origin", branch]))
      Ok(Nil)
    }
  }
}

/// Execute `git pull --tags` with optional flags, adding `--unshallow` when shallow.
/// No-op if no remote origin.
pub fn pull(
  flags: String,
  is_shallow: Bool,
) -> Result(Nil, errors.StarlistError) {
  case remote_url() {
    Error(_) -> Ok(Nil)
    Ok(_) -> {
      let base = ["pull", "--tags"]
      let args = case is_shallow {
        True -> list.append(base, ["--unshallow"])
        False -> base
      }
      let args = case string.is_empty(string.trim(flags)) {
        True -> args
        False ->
          list.append(
            args,
            flags
              |> string.trim
              |> string.split(" ")
              |> list.filter(fn(s) { !string.is_empty(s) }),
          )
      }
      use _ <- try(git(args))
      Ok(Nil)
    }
  }
}

/// Check if the current repo is a shallow clone.
pub fn is_shallow() -> Result(Bool, errors.StarlistError) {
  case git(["rev-parse", "--is-shallow-repository"]) {
    Ok(output) -> Ok(string.trim(output) == "true")
    Error(e) -> Error(e)
  }
}

/// Get the current branch name.
pub fn current_branch() -> Result(String, errors.StarlistError) {
  git(["rev-parse", "--abbrev-ref", "HEAD"])
}

/// Get short git status.
pub fn status() -> Result(String, errors.StarlistError) {
  git(["status", "--short"])
}

/// Configure a git setting.
pub fn config_set(
  key: String,
  value: String,
) -> Result(Nil, errors.StarlistError) {
  use _ <- try(git(["config", key, value]))
  Ok(Nil)
}

/// Get a git config value. Returns Error if not set.
pub fn config_get(key: String) -> Result(String, errors.StarlistError) {
  git(["config", "--get", key])
}

/// Get the remote origin URL.
pub fn remote_url() -> Result(String, errors.StarlistError) {
  git(["remote", "get-url", "origin"])
}

/// Set the remote origin URL.
pub fn set_remote_url(url: String) -> Result(Nil, errors.StarlistError) {
  use _ <- try(git(["remote", "set-url", "origin", url]))
  Ok(Nil)
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

fn git(args: List(String)) -> Result(String, errors.StarlistError) {
  case shellout.command(run: "git", with: args, in: ".", opt: []) {
    Ok(output) -> Ok(string.trim(output))
    Error(#(code, msg)) ->
      Error(errors.GitError(
        command: "git " <> string.join(args, " "),
        exit_code: code,
        message: string.trim(msg),
      ))
  }
}

fn try(
  result: Result(a, errors.StarlistError),
  next: fn(a) -> Result(Nil, errors.StarlistError),
) -> Result(Nil, errors.StarlistError) {
  case result {
    Ok(v) -> next(v)
    Error(e) -> Error(e)
  }
}
