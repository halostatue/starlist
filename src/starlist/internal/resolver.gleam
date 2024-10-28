//// Resolver — convert QueryResponse into template-ready TemplateVars.
////
//// Takes DateTimeConfig and Group directly, no config dependency beyond types.

import gleam/dict
import gleam/list
import gleam/option.{None, Some}
import starlist/config
import starlist/internal/star_types.{
  type QueryResponse, type Release, type ResponseRelease, type ResponseRepo,
  type StarredRepo, type TemplateVars,
}
import starlist/internal/timestamp

/// Resolve a QueryResponse into template-ready TemplateVars.
pub fn resolve_response(
  response: QueryResponse,
  date_time: config.DateTimeConfig,
  group: config.Group,
) -> TemplateVars {
  let stars = list.map(response.stars, resolve_repo(_, date_time))

  let #(groups, group_description) = case group {
    config.GroupByLanguage -> #(group_by_language(stars), "languages")
    config.GroupByTopic -> #(group_by_topic(stars), "topics")
    config.GroupByLicence -> #(group_by_licence(stars), "licences")
  }

  star_types.TemplateVars(
    data_version: response.data_version,
    updated_at: timestamp.format(date_time, response.updated_at),
    generated_at: timestamp.now(date_time),
    login: response.login,
    truncated: response.truncated,
    total: list.length(stars),
    fetched: response.fetched,
    stars: stars,
    groups: groups,
    group_count: dict.size(groups),
    group_description: group_description,
    partition: None,
    partitions: [],
    partition_count: 0,
    partition_description: "",
  )
}

fn resolve_repo(repo: ResponseRepo, dt: config.DateTimeConfig) -> StarredRepo {
  star_types.StarredRepo(
    archived_on: option.map(repo.archived_on, timestamp.format(dt, _)),
    description: repo.description,
    forks: repo.forks,
    homepage_url: repo.homepage_url,
    is_fork: repo.is_fork,
    is_private: repo.is_private,
    is_template: repo.is_template,
    language_count: repo.language_count,
    languages: repo.languages,
    latest_release: option.map(repo.latest_release, resolve_release(_, dt)),
    license: repo.license,
    name: repo.name,
    parent_repo: repo.parent_repo,
    pushed_on: timestamp.format(dt, repo.pushed_on),
    starred_on: timestamp.format(dt, repo.starred_on),
    stars: repo.stars,
    topic_count: repo.topic_count,
    topics: repo.topics,
    url: repo.url,
  )
}

fn resolve_release(rel: ResponseRelease, dt: config.DateTimeConfig) -> Release {
  star_types.Release(
    name: rel.name,
    published_on: timestamp.format(dt, rel.published_on),
  )
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

fn group_by_language(
  stars: List(StarredRepo),
) -> dict.Dict(String, List(StarredRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.languages {
      [first, ..] -> first.name
      [] -> ""
    }
    upsert(acc, key, repo)
  })
}

fn group_by_topic(
  stars: List(StarredRepo),
) -> dict.Dict(String, List(StarredRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.topics {
      None | Some([]) -> "no-topics"
      Some([first, ..]) -> first.name
    }
    upsert(acc, key, repo)
  })
}

fn group_by_licence(
  stars: List(StarredRepo),
) -> dict.Dict(String, List(StarredRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.license {
      "" -> "Unknown license"
      l -> l
    }
    upsert(acc, key, repo)
  })
}

fn upsert(
  acc: dict.Dict(String, List(StarredRepo)),
  key: String,
  repo: StarredRepo,
) -> dict.Dict(String, List(StarredRepo)) {
  let existing = case dict.get(acc, key) {
    Ok(repos) -> repos
    Error(_) -> []
  }
  dict.insert(acc, key, list.append(existing, [repo]))
}
