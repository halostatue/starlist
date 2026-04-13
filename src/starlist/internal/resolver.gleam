//// Resolver — convert StarData into template-ready TemplateVars.
////
//// Takes DateTimeConfig and Group directly, no config dependency beyond star_data.

import gleam/dict
import gleam/list
import gleam/option.{None, Some}
import starlist/config
import starlist/internal/star_types.{type PageVars, type StarData}
import starlist/types.{type Repo}
import starlist/utils

/// Resolve a StarData into template-ready PageVars.
pub fn resolve_response(
  data: StarData,
  date_time: config.DateTimeConfig,
  group: config.Group,
) -> PageVars {
  let stars = list.map(data.repos, resolve_repo(_, date_time))

  let #(groups, group_description) = case group {
    config.GroupByLanguage -> #(group_by_language(stars), "languages")
    config.GroupByTopic -> #(group_by_topic(stars), "topics")
    config.GroupByLicence -> #(group_by_licence(stars), "licences")
  }

  star_types.PageVars(
    data_version: data.data_version,
    updated_at: utils.format_timestamp(date_time, data.updated_at),
    generated_at: utils.now(date_time),
    login: data.login,
    truncated: data.truncated,
    total: list.length(stars),
    fetched: data.fetched,
    stars: stars,
    groups: groups,
    group_count: dict.size(groups),
    group_description: group_description,
    partition: None,
  )
}

fn resolve_repo(repo: Repo, dt: config.DateTimeConfig) -> star_types.DisplayRepo {
  star_types.DisplayRepo(
    archived_on: option.map(repo.archived_on, utils.format_timestamp(dt, _)),
    description: repo.description,
    forks: repo.forks,
    homepage_url: repo.homepage_url,
    is_fork: repo.is_fork,
    is_private: repo.is_private,
    is_template: repo.is_template,
    total_languages: repo.total_languages,
    languages: repo.languages,
    latest_release: option.map(repo.latest_release, resolve_release(_, dt)),
    licence: repo.licence,
    name: repo.name,
    parent_repo: repo.parent_repo,
    pushed_on: utils.format_timestamp(dt, repo.pushed_on),
    starred_on: utils.format_timestamp(dt, repo.starred_on),
    stars: repo.stars,
    topics: repo.topics,
    url: repo.url,
  )
}

fn resolve_release(
  rel: types.Release,
  dt: config.DateTimeConfig,
) -> star_types.DisplayRelease {
  star_types.DisplayRelease(
    name: rel.name,
    published_on: utils.format_timestamp(dt, rel.published_on),
  )
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

fn group_by_language(
  stars: List(star_types.DisplayRepo),
) -> dict.Dict(String, List(star_types.DisplayRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.languages {
      [first, ..] -> first.name
      [] -> ""
    }
    upsert(acc, key, repo)
  })
}

fn group_by_topic(
  stars: List(star_types.DisplayRepo),
) -> dict.Dict(String, List(star_types.DisplayRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.topics {
      None | Some([]) -> "no-topics"
      Some([first, ..]) -> first.name
    }
    upsert(acc, key, repo)
  })
}

fn group_by_licence(
  stars: List(star_types.DisplayRepo),
) -> dict.Dict(String, List(star_types.DisplayRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.licence {
      "" -> "Unknown license"
      l -> l
    }
    upsert(acc, key, repo)
  })
}

fn upsert(
  acc: dict.Dict(String, List(star_types.DisplayRepo)),
  key: String,
  repo: star_types.DisplayRepo,
) -> dict.Dict(String, List(star_types.DisplayRepo)) {
  let existing = case dict.get(acc, key) {
    Ok(repos) -> repos
    Error(_) -> []
  }
  dict.insert(acc, key, list.append(existing, [repo]))
}
