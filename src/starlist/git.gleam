//// Git shell operations — pure wrappers around git commands.

import gleam/list
import gleam/string
import shellout
import starlist/errors.{type StarlistError}

/// Stage files for commit.
pub fn add(paths: List(String)) -> Result(Nil, StarlistError) {
  try_git(list.prepend(paths, "add"))
}

/// Result of a commit attempt.
pub type CommitResult {
  /// Commit was created.
  Committed
  /// Nothing to commit (clean working tree).
  NothingToCommit
}

/// Commit staged changes. Returns NothingToCommit if nothing is staged.
pub fn commit(message: String) -> Result(CommitResult, StarlistError) {
  case has_staged_changes() {
    False -> Ok(NothingToCommit)
    True -> {
      case git(["commit", "-m", message]) {
        Ok(_) -> Ok(Committed)
        Error(e) -> Error(e)
      }
    }
  }
}

/// Check whether the index has staged changes.
fn has_staged_changes() -> Bool {
  case
    shellout.command(
      run: "git",
      with: ["diff", "--cached", "--quiet"],
      in: ".",
      opt: [],
    )
  {
    Ok(_) -> False
    Error(_) -> True
  }
}

/// Push to the given branch with --follow-tags. No-op if no remote origin.
pub fn push(branch: String) -> Result(Nil, StarlistError) {
  case remote_url() {
    Error(_) -> Ok(Nil)
    Ok(_) -> try_git(["push", "--follow-tags", "origin", branch])
  }
}

/// Execute `git pull --tags` with optional flags, adding `--unshallow` when shallow.
/// No-op if no remote origin.
pub fn pull(flags: String, is_shallow: Bool) -> Result(Nil, StarlistError) {
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
      try_git(args)
    }
  }
}

/// Check if the current repo is a shallow clone.
pub fn is_shallow() -> Result(Bool, StarlistError) {
  case git(["rev-parse", "--is-shallow-repository"]) {
    Ok(output) -> Ok(string.trim(output) == "true")
    Error(e) -> Error(e)
  }
}

/// Get the current branch name.
pub fn current_branch() -> Result(String, StarlistError) {
  git(["rev-parse", "--abbrev-ref", "HEAD"])
}

/// Get short git status.
pub fn status() -> Result(String, StarlistError) {
  git(["status", "--short"])
}

/// Configure a git setting.
pub fn config_set(key: String, value: String) -> Result(Nil, StarlistError) {
  try_git(["config", key, value])
}

/// Get a git config value. Returns Error if not set.
pub fn config_get(key: String) -> Result(String, StarlistError) {
  git(["config", "--get", key])
}

/// Get the remote origin URL.
pub fn remote_url() -> Result(String, StarlistError) {
  git(["remote", "get-url", "origin"])
}

/// Set the remote origin URL.
pub fn set_remote_url(url: String) -> Result(Nil, StarlistError) {
  try_git(["remote", "set-url", "origin", url])
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

fn try_git(args: List(String)) -> Result(Nil, StarlistError) {
  use _ <- try(git(args))
  Ok(Nil)
}

fn git(args: List(String)) -> Result(String, StarlistError) {
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
  result: Result(a, StarlistError),
  next: fn(a) -> Result(Nil, StarlistError),
) -> Result(Nil, StarlistError) {
  case result {
    Ok(v) -> next(v)
    Error(e) -> Error(e)
  }
}
