//// Star data — JSON serialization/deserialization for stars.json.

import gleam/dynamic/decode
import gleam/json
import gleam/string
import simplifile
import starlist/internal/errors.{type StarlistError}
import starlist/internal/star_types.{
  type Language, type QueryResponse, type ResponseRelease, type ResponseRepo,
  type Topic,
}

/// Serialize a QueryResponse to JSON and write to the given filename.
pub fn write_data_file(
  response: QueryResponse,
  filename: String,
) -> Result(Nil, StarlistError) {
  let json_string =
    query_response_to_json(response)
    |> json.to_string
  simplifile.write(to: filename, contents: json_string)
  |> map_file_error("writing " <> filename)
}

/// Read and parse a data file, validating the dataVersion field.
pub fn load_data_file(filename: String) -> Result(QueryResponse, StarlistError) {
  case simplifile.read(from: filename) {
    Error(_) ->
      Error(errors.FileError(
        "Cannot read " <> filename <> ": file not found or unreadable",
      ))
    Ok(contents) ->
      case json.parse(from: contents, using: query_response_decoder()) {
        Error(_) ->
          Error(errors.FileError(
            "Failed to decode " <> filename <> " as valid QueryResponse JSON",
          ))
        Ok(response) -> validate_data_version(response)
      }
  }
}

// ---------------------------------------------------------------------------
// JSON encoding
// ---------------------------------------------------------------------------

pub fn query_response_to_json(response: QueryResponse) -> json.Json {
  json.object([
    #("dataVersion", json.int(response.data_version)),
    #("login", json.string(response.login)),
    #("truncated", json.bool(response.truncated)),
    #("total", json.int(response.total)),
    #("fetched", json.int(response.fetched)),
    #("updatedAt", json.string(response.updated_at)),
    #("stars", json.array(response.stars, response_repo_to_json)),
  ])
}

fn response_repo_to_json(repo: ResponseRepo) -> json.Json {
  json.object([
    #("archivedOn", json.nullable(repo.archived_on, json.string)),
    #("description", json.nullable(repo.description, json.string)),
    #("forks", json.int(repo.forks)),
    #("homepageUrl", json.nullable(repo.homepage_url, json.string)),
    #("isFork", json.bool(repo.is_fork)),
    #("isPrivate", json.bool(repo.is_private)),
    #("isTemplate", json.bool(repo.is_template)),
    #("languageCount", json.int(repo.language_count)),
    #("languages", json.array(repo.languages, language_to_json)),
    #(
      "latestRelease",
      json.nullable(repo.latest_release, response_release_to_json),
    ),
    #("license", json.string(repo.license)),
    #("name", json.string(repo.name)),
    #("parentRepo", json.nullable(repo.parent_repo, json.string)),
    #("pushedOn", json.string(repo.pushed_on)),
    #("starredOn", json.string(repo.starred_on)),
    #("stars", json.int(repo.stars)),
    #("topicCount", json.int(repo.topic_count)),
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

fn response_release_to_json(rel: ResponseRelease) -> json.Json {
  json.object([
    #("name", json.nullable(rel.name, json.string)),
    #("publishedOn", json.string(rel.published_on)),
  ])
}

// ---------------------------------------------------------------------------
// JSON decoding
// ---------------------------------------------------------------------------

fn validate_data_version(
  response: QueryResponse,
) -> Result(QueryResponse, StarlistError) {
  case response.data_version == star_types.data_version {
    True -> Ok(response)
    False ->
      Error(errors.VersionMismatchError(
        expected: star_types.data_version,
        found: response.data_version,
      ))
  }
}

pub fn query_response_decoder() -> decode.Decoder(QueryResponse) {
  use data_version <- decode.field("dataVersion", decode.int)
  use login <- decode.field("login", decode.string)
  use truncated <- decode.field("truncated", decode.bool)
  use total <- decode.field("total", decode.int)
  use fetched <- decode.field("fetched", decode.int)
  use updated_at <- decode.field("updatedAt", decode.string)
  use stars <- decode.field("stars", decode.list(response_repo_decoder()))
  decode.success(star_types.QueryResponse(
    data_version:,
    login:,
    truncated:,
    total:,
    fetched:,
    stars:,
    updated_at:,
  ))
}

fn response_repo_decoder() -> decode.Decoder(ResponseRepo) {
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
  use language_count <- decode.field("languageCount", decode.int)
  use languages <- decode.field("languages", decode.list(language_decoder()))
  use latest_release <- decode.field(
    "latestRelease",
    decode.optional(response_release_decoder()),
  )
  use license <- decode.field("license", decode.string)
  use name <- decode.field("name", decode.string)
  use parent_repo <- decode.field("parentRepo", decode.optional(decode.string))
  use pushed_on <- decode.field("pushedOn", decode.string)
  use starred_on <- decode.field("starredOn", decode.string)
  use stars <- decode.field("stars", decode.int)
  use topic_count <- decode.field("topicCount", decode.int)
  use topics <- decode.field(
    "topics",
    decode.optional(decode.list(topic_decoder())),
  )
  use url <- decode.field("url", decode.string)
  decode.success(star_types.ResponseRepo(
    archived_on:,
    description:,
    forks:,
    homepage_url:,
    is_fork:,
    is_private:,
    is_template:,
    language_count:,
    languages:,
    latest_release:,
    license:,
    name:,
    parent_repo:,
    pushed_on:,
    starred_on:,
    stars:,
    topic_count:,
    topics:,
    url:,
  ))
}

fn language_decoder() -> decode.Decoder(Language) {
  use name <- decode.field("name", decode.string)
  use percent <- decode.field("percent", decode.int)
  decode.success(star_types.Language(name:, percent:))
}

fn topic_decoder() -> decode.Decoder(Topic) {
  use name <- decode.field("name", decode.string)
  use url <- decode.field("url", decode.string)
  decode.success(star_types.Topic(name:, url:))
}

fn response_release_decoder() -> decode.Decoder(ResponseRelease) {
  use name <- decode.field("name", decode.optional(decode.string))
  use published_on <- decode.field("publishedOn", decode.string)
  decode.success(star_types.ResponseRelease(name:, published_on:))
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
