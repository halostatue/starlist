//// Action-specific git setup — identity configuration and remote URL injection.

import actions/core
import envoy
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

  use _ <- try(case envoy.get("GITHUB_REPOSITORY") {
    Ok(repo) -> {
      let server = case envoy.get("GITHUB_SERVER_URL") {
        Ok(url) -> url
        Error(_) -> "https://github.com"
      }
      let url = inject_token(server, token) <> "/" <> repo <> ".git"
      core.info("Set token")
      git.set_remote_url(url)
    }
    Error(_) ->
      case git.remote_url() {
        Ok(url) -> {
          let injected = inject_token(url, token)
          case string.is_empty(injected) {
            True -> Ok(Nil)
            False -> {
              core.info("Set token")
              git.set_remote_url(injected)
            }
          }
        }
        Error(_) -> Ok(Nil)
      }
  })

  case git.remote_url() {
    Ok(url) -> {
      core.info("URL: " <> string.replace(url, each: token, with: "TOKEN"))
      core.info(
        "Origin URL contains token: "
        <> case string.contains(url, token) {
          True -> "yes"
          False -> "no"
        },
      )
    }
    Error(_) -> core.info("No origin URL configured")
  }
  Ok(Nil)
}

fn inject_token(url: String, token: String) -> String {
  case string.starts_with(url, "https://") {
    True -> {
      core.info("fixing https: " <> url)
      let rest = string.drop_start(url, string.length("https://"))
      "https://x-access-token:" <> token <> "@" <> rest
    }
    False -> {
      core.info("ignoring because not of https")
      url
    }
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
