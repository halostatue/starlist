//// Star data — JSON serialization/deserialization for data.json.

import gleam/dynamic/decode
import gleam/json
import gleam/string
import simplifile
import starlist/errors.{type StarlistError}
import starlist/internal/star_types.{type StarData, StarData}
import starlist/types.{
  type Language, type Release, type Repo, type Topic, Language, Release, Repo,
  Topic,
}

/// Serialize StarData to JSON and write to the given filename.
pub fn write_data_file(
  data: StarData,
  filename: String,
) -> Result(Nil, StarlistError) {
  let json_string =
    star_data_to_json(data)
    |> json.to_string
  simplifile.write(to: filename, contents: json_string)
  |> map_file_error("writing " <> filename)
}

/// Read and parse a data file, validating the dataVersion field.
pub fn load_data_file(filename: String) -> Result(StarData, StarlistError) {
  case simplifile.read(from: filename) {
    Error(_) ->
      Error(errors.FileError(
        "Cannot read " <> filename <> ": file not found or unreadable",
      ))
    Ok(contents) ->
      case json.parse(from: contents, using: star_data_decoder()) {
        Error(_) ->
          Error(errors.FileError(
            "Failed to decode " <> filename <> " as valid StarData JSON",
          ))
        Ok(data) -> validate_data_version(data)
      }
  }
}

// ---------------------------------------------------------------------------
// JSON encoding
// ---------------------------------------------------------------------------

fn star_data_to_json(data: StarData) -> json.Json {
  json.object([
    #("dataVersion", json.int(data.data_version)),
    #("login", json.string(data.login)),
    #("truncated", json.bool(data.truncated)),
    #("total", json.int(data.total)),
    #("fetched", json.int(data.fetched)),
    #("updatedAt", json.string(data.updated_at)),
    #("repos", json.array(data.repos, repo_to_json)),
  ])
}

fn repo_to_json(repo: Repo) -> json.Json {
  json.object([
    #("archivedOn", json.nullable(repo.archived_on, json.string)),
    #("description", json.nullable(repo.description, json.string)),
    #("forks", json.int(repo.forks)),
    #("homepageUrl", json.nullable(repo.homepage_url, json.string)),
    #("isFork", json.bool(repo.is_fork)),
    #("isPrivate", json.bool(repo.is_private)),
    #("isTemplate", json.bool(repo.is_template)),
    #("languageCount", json.int(repo.total_languages)),
    #("languages", json.array(repo.languages, language_to_json)),
    #("latestRelease", json.nullable(repo.latest_release, release_to_json)),
    #("licence", json.string(repo.licence)),
    #("name", json.string(repo.name)),
    #("parentRepo", json.nullable(repo.parent_repo, json.string)),
    #("pushedOn", json.string(repo.pushed_on)),
    #("starredOn", json.string(repo.starred_on)),
    #("stars", json.int(repo.stars)),
    #(
      "topics",
      json.nullable(repo.topics, fn(ts) { json.array(ts, topic_to_json) }),
    ),
    #("url", json.string(repo.url)),
  ])
}

fn language_to_json(lang: Language) -> json.Json {
  json.object([
    #("name", json.string(lang.name)),
    #("percent", json.int(lang.percent)),
  ])
}

fn topic_to_json(topic: Topic) -> json.Json {
  json.object([
    #("name", json.string(topic.name)),
    #("url", json.string(topic.url)),
  ])
}

fn release_to_json(rel: Release) -> json.Json {
  json.object([
    #("name", json.nullable(rel.name, json.string)),
    #("publishedOn", json.string(rel.published_on)),
  ])
}

// ---------------------------------------------------------------------------
// JSON decoding
// ---------------------------------------------------------------------------

fn validate_data_version(data: StarData) -> Result(StarData, StarlistError) {
  case data.data_version == star_types.data_version {
    True -> Ok(data)
    False ->
      Error(errors.VersionMismatchError(
        expected: star_types.data_version,
        found: data.data_version,
      ))
  }
}

fn star_data_decoder() -> decode.Decoder(StarData) {
  use data_version <- decode.field("dataVersion", decode.int)
  use login <- decode.field("login", decode.string)
  use truncated <- decode.field("truncated", decode.bool)
  use total <- decode.field("total", decode.int)
  use fetched <- decode.field("fetched", decode.int)
  use updated_at <- decode.field("updatedAt", decode.string)
  use repos <- decode.field("repos", decode.list(repo_decoder()))
  decode.success(StarData(
    data_version: data_version,
    login: login,
    truncated: truncated,
    total: total,
    fetched: fetched,
    repos: repos,
    updated_at: updated_at,
  ))
}

fn repo_decoder() -> decode.Decoder(Repo) {
  use archived_on <- decode.field("archivedOn", decode.optional(decode.string))
  use description <- decode.field("description", decode.optional(decode.string))
  use forks <- decode.field("forks", decode.int)
  use homepage_url <- decode.field(
    "homepageUrl",
    decode.optional(decode.string),
  )
  use is_fork <- decode.field("isFork", decode.bool)
  use is_private <- decode.field("isPrivate", decode.bool)
  use is_template <- decode.field("isTemplate", decode.bool)
  use total_languages <- decode.field("languageCount", decode.int)
  use languages <- decode.field("languages", decode.list(language_decoder()))
  use latest_release <- decode.field(
    "latestRelease",
    decode.optional(release_decoder()),
  )
  use licence <- decode.field("licence", decode.string)
  use name <- decode.field("name", decode.string)
  use parent_repo <- decode.field("parentRepo", decode.optional(decode.string))
  use pushed_on <- decode.field("pushedOn", decode.string)
  use starred_on <- decode.field("starredOn", decode.string)
  use stars <- decode.field("stars", decode.int)
  use topics <- decode.field(
    "topics",
    decode.optional(decode.list(topic_decoder())),
  )
  use url <- decode.field("url", decode.string)
  decode.success(Repo(
    archived_on:,
    description:,
    forks:,
    homepage_url:,
    is_fork:,
    is_private:,
    is_template:,
    total_languages:,
    languages:,
    latest_release:,
    licence:,
    name:,
    parent_repo:,
    pushed_on:,
    starred_on:,
    stars:,
    topics:,
    url:,
  ))
}

fn language_decoder() -> decode.Decoder(Language) {
  use name <- decode.field("name", decode.string)
  use percent <- decode.field("percent", decode.int)
  decode.success(Language(name:, percent:))
}

fn topic_decoder() -> decode.Decoder(Topic) {
  use name <- decode.field("name", decode.string)
  use url <- decode.field("url", decode.string)
  decode.success(Topic(name:, url:))
}

fn release_decoder() -> decode.Decoder(Release) {
  use name <- decode.field("name", decode.optional(decode.string))
  use published_on <- decode.field("publishedOn", decode.string)
  decode.success(Release(name:, published_on:))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn map_file_error(
  result: Result(a, simplifile.FileError),
  context: String,
) -> Result(a, StarlistError) {
  case result {
    Ok(v) -> Ok(v)
    Error(err) ->
      Error(errors.FileError(
        "File error " <> context <> ": " <> string.inspect(err),
      ))
  }
}
