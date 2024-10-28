//// Action-specific git setup — identity configuration and remote URL injection.

import gleam/string
import starlist/internal/errors
import starlist/internal/git

/// Configure git identity and inject token into remote URL for authenticated push.
pub fn setup(
  committer: #(String, String),
  token: String,
) -> Result(Nil, errors.StarlistError) {
  let #(name, email) = committer
  use _ <- try(git.config_set("user.name", name))
  use _ <- try(git.config_set("user.email", email))
  use _ <- try(git.config_set("pull.rebase", "false"))

  case git.remote_url() {
    Ok(url) -> {
      let injected = inject_token(url, token)
      case string.is_empty(injected) {
        True -> Ok(Nil)
        False -> git.set_remote_url(injected)
      }
    }
    Error(_) -> Ok(Nil)
  }
}

fn inject_token(url: String, token: String) -> String {
  case string.starts_with(url, "https://") {
    True -> {
      let rest = string.drop_start(url, string.length("https://"))
      "https://x-access-token:" <> token <> "@" <> rest
    }
    False -> url
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
