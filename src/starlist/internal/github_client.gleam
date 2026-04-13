/// GitHub API client — paginated star fetching with rate-limit handling.
///
/// Uses squall-generated typed query modules + gleam_fetch for HTTP.
/// Pagination is cursor-based; rate-limit retries use response headers.
import gleam/fetch
import gleam/http/response.{type Response}
import gleam/int
import gleam/javascript/promise.{type Promise}
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/string
import pontil
import squall
import starlist/config
import starlist/errors.{type StarlistError}
import starlist/internal/graphql/identity
import starlist/internal/graphql/user_starred_repos.{
  type Repository, type StarredRepositoryEdge, type User,
  type UserStarredReposResponse,
}
import starlist/types.{type Release, type Repo, Language, Release, Repo, Topic}
import starlist/utils

/// Maximum number of retries on rate-limit (429/403) responses.
const max_retries = 3

/// Default backoff in milliseconds when no retry-after header is present.
const default_backoff_ms = 60_000

/// Raw fetch result: (repos, login, truncated, total).
pub type FetchResult =
  #(List(Repo), String, Bool, Int)

/// Create a squall client configured for the GitHub GraphQL API.
fn make_client(token: String) -> squall.Client {
  squall.new_with_auth("https://api.github.com/graphql", token)
}

/// Fetch all starred repositories for the authenticated user.
/// Handles pagination and rate-limiting.
/// When max_stars is Some(n), stops fetching after accumulating >= n edges.
/// Returns raw (repos, login, truncated, total) — caller constructs StarData.
pub fn fetch_starred_repos(
  token: String,
  login: Option(String),
  max_stars: Option(Int),
  order: config.FetchOrder,
) -> Promise(Result(FetchResult, StarlistError)) {
  let client = make_client(token)
  let order_dir = case order {
    config.Descending -> user_starred_repos.DESC
    config.Ascending -> user_starred_repos.ASC
  }

  resolve_login(client, login)
  |> promise.await(fn(result) {
    case result {
      Error(err) -> promise.resolve(Error(err))
      Ok(login) ->
        fetch_all_pages(client, login, "", [], 0, max_stars, order_dir)
    }
  })
  |> promise.map(fn(result) {
    result
    |> result.map(fn(acc) {
      let #(edges, login, truncated, total) = acc
      let repos = list.map(edges, edge_to_repo)
      #(repos, login, truncated, total)
    })
  })
}

/// Accumulator type: (edges, login, truncated, total)
type PageAcc =
  #(List(StarredRepositoryEdge), String, Bool, Int)

/// Recursively fetch pages of starred repos until pagination is exhausted.
fn fetch_all_pages(
  client: squall.Client,
  login: String,
  cursor: String,
  acc: List(StarredRepositoryEdge),
  retries: Int,
  max_stars: Option(Int),
  order: user_starred_repos.OrderDirection,
) -> Promise(Result(PageAcc, StarlistError)) {
  case user_starred_repos.user_starred_repos(client, login, cursor, order) {
    Error(msg) ->
      promise.resolve(
        Error(errors.GitHubApiError("Failed to build request: " <> msg)),
      )
    Ok(request) -> {
      fetch.send(request)
      |> promise.try_await(fetch.read_text_body)
      |> promise.await(fn(result) {
        case result {
          Error(_fetch_err) ->
            promise.resolve(
              Error(errors.GitHubApiError(
                "Network error during GitHub API request",
              )),
            )
          Ok(resp) ->
            handle_response(
              client,
              login,
              cursor,
              acc,
              retries,
              resp,
              max_stars,
              order,
            )
        }
      })
    }
  }
}

/// Process an HTTP response — handle success, rate-limits, and errors.
fn handle_response(
  client: squall.Client,
  login: String,
  cursor: String,
  acc: List(StarredRepositoryEdge),
  retries: Int,
  resp: Response(String),
  max_stars: Option(Int),
  order: user_starred_repos.OrderDirection,
) -> Promise(Result(PageAcc, StarlistError)) {
  case resp.status {
    200 -> handle_success(client, login, acc, resp.body, max_stars, order)

    429 | 403 ->
      handle_rate_limit(
        client,
        login,
        cursor,
        acc,
        retries,
        resp,
        max_stars,
        order,
      )

    status ->
      promise.resolve(
        Error(errors.GitHubApiError(
          "GitHub API returned status "
          <> int.to_string(status)
          <> ": "
          <> string.slice(resp.body, 0, 200),
        )),
      )
  }
}

/// Parse a successful response and continue pagination if needed.
fn handle_success(
  client: squall.Client,
  login: String,
  acc: List(StarredRepositoryEdge),
  body: String,
  max_stars: Option(Int),
  order: user_starred_repos.OrderDirection,
) -> Promise(Result(PageAcc, StarlistError)) {
  case user_starred_repos.parse_user_starred_repos_response(body) {
    Error(msg) ->
      promise.resolve(
        Error(errors.GitHubApiError("Failed to decode response: " <> msg)),
      )
    Ok(parsed) -> {
      use viewer <- try_parse_viewer(login, parsed)

      let conn = viewer.starred_repositories
      let new_edges = case conn.edges {
        Some(edges) -> list.append(acc, edges)
        None -> acc
      }
      let login = viewer.login
      let truncated = conn.is_over_limit
      let total = conn.total_count

      let reached_limit = case max_stars {
        Some(n) -> list.length(new_edges) >= n
        None -> False
      }

      pontil.info(
        "Fetched page "
        <> int.to_string(list.length(new_edges))
        <> "/"
        <> int.to_string(total)
        <> " stars so far",
      )

      case reached_limit {
        True -> promise.resolve(Ok(#(new_edges, login, truncated, total)))
        False ->
          case conn.page_info.has_next_page, conn.page_info.end_cursor {
            True, Some(next_cursor) ->
              promise.wait(jitter(200, 500))
              |> promise.await(fn(_) {
                fetch_all_pages(
                  client,
                  login,
                  next_cursor,
                  new_edges,
                  0,
                  max_stars,
                  order,
                )
              })
            _, _ -> promise.resolve(Ok(#(new_edges, login, truncated, total)))
          }
      }
    }
  }
}

/// Handle 429/403 rate-limit responses with retry + backoff.
fn handle_rate_limit(
  client: squall.Client,
  login: String,
  cursor: String,
  acc: List(StarredRepositoryEdge),
  retries: Int,
  resp: Response(String),
  max_stars: Option(Int),
  order: user_starred_repos.OrderDirection,
) -> Promise(Result(PageAcc, StarlistError)) {
  case retries >= max_retries {
    True ->
      promise.resolve(
        Error(errors.GitHubApiError(
          "Rate limit exceeded after "
          <> int.to_string(max_retries)
          <> " retries",
        )),
      )
    False -> {
      let wait_ms = get_backoff_ms(resp.headers)
      pontil.warning(
        "Rate limited (status "
        <> int.to_string(resp.status)
        <> "), waiting "
        <> int.to_string(wait_ms / 1000)
        <> "s before retry "
        <> int.to_string(retries + 1)
        <> "/"
        <> int.to_string(max_retries),
      )
      promise.wait(wait_ms)
      |> promise.await(fn(_) {
        fetch_all_pages(
          client,
          login,
          cursor,
          acc,
          retries + 1,
          max_stars,
          order,
        )
      })
    }
  }
}

/// Determine backoff duration from response headers.
/// Checks `retry-after` first, then `x-ratelimit-reset`.
/// Falls back to default_backoff_ms.
fn get_backoff_ms(headers: List(#(String, String))) -> Int {
  case get_header(headers, "retry-after") {
    Some(value) ->
      case int.parse(value) {
        Ok(seconds) -> seconds * 1000
        Error(_) -> default_backoff_ms
      }
    None ->
      case get_header(headers, "x-ratelimit-reset") {
        Some(value) ->
          case int.parse(value) {
            Ok(reset_epoch) -> {
              let now = utils.now_epoch_seconds()
              let delta = reset_epoch - now
              case delta > 0 {
                True -> delta * 1000
                False -> default_backoff_ms
              }
            }
            Error(_) -> default_backoff_ms
          }
        None -> default_backoff_ms
      }
  }
}

/// Case-insensitive header lookup.
fn get_header(headers: List(#(String, String)), name: String) -> Option(String) {
  let lower_name = string.lowercase(name)
  headers
  |> list.find(fn(h) { string.lowercase(h.0) == lower_name })
  |> result.map(fn(h) { h.1 })
  |> option.from_result
}

/// Convert a squall-generated StarredRepositoryEdge to our Repo type.
fn edge_to_repo(edge: StarredRepositoryEdge) -> Repo {
  let repo = edge.node
  Repo(
    archived_on: repo.archived_at,
    description: repo.description,
    forks: repo.fork_count,
    homepage_url: repo.homepage_url,
    is_fork: repo.is_fork,
    is_private: repo.is_private,
    is_template: repo.is_template,
    total_languages: language_count(repo),
    languages: extract_languages(repo),
    latest_release: extract_release(repo),
    licence: extract_licence(repo),
    name: repo.name_with_owner,
    parent_repo: extract_parent(repo),
    pushed_on: option.unwrap(repo.pushed_at, ""),
    starred_on: edge.starred_at,
    stars: repo.stargazer_count,
    topics: extract_topics(repo),
    url: repo.url,
  )
}

fn language_count(repo: Repository) -> Int {
  case repo.languages {
    Some(conn) -> conn.total_count
    None -> 0
  }
}

fn extract_languages(repo: Repository) -> List(types.Language) {
  case repo.languages {
    None -> []
    Some(conn) ->
      case conn.edges {
        None -> []
        Some(edges) -> {
          let total_size = conn.total_size
          list.map(edges, fn(edge) {
            let percent = case total_size > 0 {
              True -> { edge.size * 100 } / total_size
              False -> 0
            }
            Language(name: edge.node.name, percent: percent)
          })
        }
      }
  }
}

fn extract_release(repo: Repository) -> Option(Release) {
  case repo.latest_release {
    None -> None
    Some(rel) ->
      case rel.published_at {
        None -> None
        Some(published) ->
          Some(Release(name: rel.name, published_on: published))
      }
  }
}

fn extract_licence(repo: Repository) -> String {
  case repo.license_info {
    None -> ""
    Some(licence) ->
      option.lazy_unwrap(licence.spdx_id, or: fn() {
        option.unwrap(licence.nickname, or: licence.name)
      })
  }
}

fn extract_parent(repo: Repository) -> Option(String) {
  case repo.parent {
    None -> None
    Some(p) -> Some(p.name_with_owner)
  }
}

fn extract_topics(repo: Repository) -> Option(List(types.Topic)) {
  case repo.repository_topics.nodes {
    None -> None
    Some(nodes) ->
      Some(list.map(nodes, fn(rt) { Topic(name: rt.topic.name, url: rt.url) }))
  }
}

/// Random delay between min_ms and max_ms (inclusive).
fn jitter(min_ms: Int, max_ms: Int) -> Int {
  min_ms + int.random(max_ms - min_ms + 1)
}

/// Resolve the login: use the provided value or fetch via viewer identity query.
fn resolve_login(
  client: squall.Client,
  login: Option(String),
) -> Promise(Result(String, StarlistError)) {
  case login {
    Some(login) -> promise.resolve(Ok(login))
    None -> {
      case identity.identity(client) {
        Error(msg) ->
          promise.resolve(
            Error(errors.GitHubApiError(
              "Failed to build identity query: " <> msg,
            )),
          )

        Ok(request) -> {
          fetch.send(request)
          |> promise.try_await(fetch.read_text_body)
          |> promise.await(fn(response) {
            case response {
              Error(_) ->
                promise.resolve(
                  Error(errors.GitHubApiError(
                    "Network error during GitHub API request",
                  )),
                )
              Ok(response) -> {
                case response.status {
                  200 ->
                    case identity.parse_identity_response(response.body) {
                      Error(msg) ->
                        promise.resolve(
                          Error(errors.GitHubApiError(
                            "Failed to decode response: " <> msg,
                          )),
                        )
                      Ok(parsed) -> {
                        promise.resolve(Ok(parsed.viewer.login))
                      }
                    }
                  status ->
                    promise.resolve(
                      Error(errors.GitHubApiError(
                        "GitHub API returned status "
                        <> int.to_string(status)
                        <> ": "
                        <> string.slice(response.body, 0, 200),
                      )),
                    )
                }
              }
            }
          })
        }
      }
    }
  }
}

fn try_parse_viewer(
  login: String,
  response: UserStarredReposResponse,
  callback: fn(User) -> Promise(Result(PageAcc, StarlistError)),
) -> Promise(Result(PageAcc, StarlistError)) {
  case response.user {
    Some(viewer) -> callback(viewer)
    None ->
      promise.resolve(
        Error(errors.GitHubApiError("Could not find login: " <> login)),
      )
  }
}
