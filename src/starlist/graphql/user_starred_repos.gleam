import gleam/dynamic/decode
import gleam/http/request.{type Request}
import gleam/json
import gleam/option.{type Option}
import squall

pub type User {
  User(login: String, starred_repositories: StarredRepositoryConnection)
}

pub fn user_decoder() -> decode.Decoder(User) {
  use login <- decode.field("login", decode.string)
  use starred_repositories <- decode.field(
    "starredRepositories",
    starred_repository_connection_decoder(),
  )
  decode.success(User(login: login, starred_repositories: starred_repositories))
}

pub type StarredRepositoryConnection {
  StarredRepositoryConnection(
    is_over_limit: Bool,
    total_count: Int,
    page_info: PageInfo,
    edges: Option(List(StarredRepositoryEdge)),
  )
}

pub fn starred_repository_connection_decoder() -> decode.Decoder(
  StarredRepositoryConnection,
) {
  use is_over_limit <- decode.field("isOverLimit", decode.bool)
  use total_count <- decode.field("totalCount", decode.int)
  use page_info <- decode.field("pageInfo", page_info_decoder())
  use edges <- decode.field(
    "edges",
    decode.optional(decode.list(starred_repository_edge_decoder())),
  )
  decode.success(StarredRepositoryConnection(
    is_over_limit: is_over_limit,
    total_count: total_count,
    page_info: page_info,
    edges: edges,
  ))
}

pub type PageInfo {
  PageInfo(end_cursor: Option(String), has_next_page: Bool)
}

pub fn page_info_decoder() -> decode.Decoder(PageInfo) {
  use end_cursor <- decode.field("endCursor", decode.optional(decode.string))
  use has_next_page <- decode.field("hasNextPage", decode.bool)
  decode.success(PageInfo(end_cursor: end_cursor, has_next_page: has_next_page))
}

pub type StarredRepositoryEdge {
  StarredRepositoryEdge(starred_at: String, node: Repository)
}

pub fn starred_repository_edge_decoder() -> decode.Decoder(
  StarredRepositoryEdge,
) {
  use starred_at <- decode.field("starredAt", decode.string)
  use node <- decode.field("node", repository_decoder())
  decode.success(StarredRepositoryEdge(starred_at: starred_at, node: node))
}

pub type Repository {
  Repository(
    archived_at: Option(String),
    description: Option(String),
    fork_count: Int,
    homepage_url: Option(String),
    url: String,
    is_fork: Bool,
    is_private: Bool,
    is_template: Bool,
    languages: Option(LanguageConnection),
    latest_release: Option(Release),
    license_info: Option(License),
    name_with_owner: String,
    parent: Option(ParentRepository),
    pushed_at: Option(String),
    repository_topics: RepositoryTopicConnection,
    stargazer_count: Int,
  )
}

pub fn repository_decoder() -> decode.Decoder(Repository) {
  use archived_at <- decode.field("archivedAt", decode.optional(decode.string))
  use description <- decode.field("description", decode.optional(decode.string))
  use fork_count <- decode.field("forkCount", decode.int)
  use homepage_url <- decode.field(
    "homepageUrl",
    decode.optional(decode.string),
  )
  use url <- decode.field("url", decode.string)
  use is_fork <- decode.field("isFork", decode.bool)
  use is_private <- decode.field("isPrivate", decode.bool)
  use is_template <- decode.field("isTemplate", decode.bool)
  use languages <- decode.field(
    "languages",
    decode.optional(language_connection_decoder()),
  )
  use latest_release <- decode.field(
    "latestRelease",
    decode.optional(release_decoder()),
  )
  use license_info <- decode.field(
    "licenseInfo",
    decode.optional(license_decoder()),
  )
  use name_with_owner <- decode.field("nameWithOwner", decode.string)
  use parent <- decode.field(
    "parent",
    decode.optional(parent_repository_decoder()),
  )
  use pushed_at <- decode.field("pushedAt", decode.optional(decode.string))
  use repository_topics <- decode.field(
    "repositoryTopics",
    repository_topic_connection_decoder(),
  )
  use stargazer_count <- decode.field("stargazerCount", decode.int)
  decode.success(Repository(
    archived_at: archived_at,
    description: description,
    fork_count: fork_count,
    homepage_url: homepage_url,
    url: url,
    is_fork: is_fork,
    is_private: is_private,
    is_template: is_template,
    languages: languages,
    latest_release: latest_release,
    license_info: license_info,
    name_with_owner: name_with_owner,
    parent: parent,
    pushed_at: pushed_at,
    repository_topics: repository_topics,
    stargazer_count: stargazer_count,
  ))
}

pub type LanguageConnection {
  LanguageConnection(
    total_count: Int,
    total_size: Int,
    edges: Option(List(LanguageEdge)),
  )
}

pub fn language_connection_decoder() -> decode.Decoder(LanguageConnection) {
  use total_count <- decode.field("totalCount", decode.int)
  use total_size <- decode.field("totalSize", decode.int)
  use edges <- decode.field(
    "edges",
    decode.optional(decode.list(language_edge_decoder())),
  )
  decode.success(LanguageConnection(
    total_count: total_count,
    total_size: total_size,
    edges: edges,
  ))
}

pub type Release {
  Release(name: Option(String), published_at: Option(String))
}

pub fn release_decoder() -> decode.Decoder(Release) {
  use name <- decode.field("name", decode.optional(decode.string))
  use published_at <- decode.field(
    "publishedAt",
    decode.optional(decode.string),
  )
  decode.success(Release(name: name, published_at: published_at))
}

pub type License {
  License(nickname: Option(String), spdx_id: Option(String))
}

pub fn license_decoder() -> decode.Decoder(License) {
  use nickname <- decode.field("nickname", decode.optional(decode.string))
  use spdx_id <- decode.field("spdxId", decode.optional(decode.string))
  decode.success(License(nickname: nickname, spdx_id: spdx_id))
}

pub type ParentRepository {
  ParentRepository(name_with_owner: String)
}

pub fn parent_repository_decoder() -> decode.Decoder(ParentRepository) {
  use name_with_owner <- decode.field("nameWithOwner", decode.string)
  decode.success(ParentRepository(name_with_owner: name_with_owner))
}

pub type RepositoryTopicConnection {
  RepositoryTopicConnection(
    total_count: Int,
    nodes: Option(List(RepositoryTopic)),
  )
}

pub fn repository_topic_connection_decoder() -> decode.Decoder(
  RepositoryTopicConnection,
) {
  use total_count <- decode.field("totalCount", decode.int)
  use nodes <- decode.field(
    "nodes",
    decode.optional(decode.list(repository_topic_decoder())),
  )
  decode.success(RepositoryTopicConnection(
    total_count: total_count,
    nodes: nodes,
  ))
}

pub type LanguageEdge {
  LanguageEdge(node: Language, size: Int)
}

pub fn language_edge_decoder() -> decode.Decoder(LanguageEdge) {
  use node <- decode.field("node", language_decoder())
  use size <- decode.field("size", decode.int)
  decode.success(LanguageEdge(node: node, size: size))
}

pub type RepositoryTopic {
  RepositoryTopic(topic: Topic, url: String)
}

pub fn repository_topic_decoder() -> decode.Decoder(RepositoryTopic) {
  use topic <- decode.field("topic", topic_decoder())
  use url <- decode.field("url", decode.string)
  decode.success(RepositoryTopic(topic: topic, url: url))
}

pub type Language {
  Language(name: String)
}

pub fn language_decoder() -> decode.Decoder(Language) {
  use name <- decode.field("name", decode.string)
  decode.success(Language(name: name))
}

pub type Topic {
  Topic(name: String)
}

pub fn topic_decoder() -> decode.Decoder(Topic) {
  use name <- decode.field("name", decode.string)
  decode.success(Topic(name: name))
}

pub fn user_to_json(input: User) -> json.Json {
  json.object([
    #("login", json.string(input.login)),
    #(
      "starredRepositories",
      starred_repository_connection_to_json(input.starred_repositories),
    ),
  ])
}

pub fn starred_repository_connection_to_json(
  input: StarredRepositoryConnection,
) -> json.Json {
  json.object([
    #("isOverLimit", json.bool(input.is_over_limit)),
    #("totalCount", json.int(input.total_count)),
    #("pageInfo", page_info_to_json(input.page_info)),
    #(
      "edges",
      json.nullable(input.edges, fn(list) {
        json.array(from: list, of: starred_repository_edge_to_json)
      }),
    ),
  ])
}

pub fn page_info_to_json(input: PageInfo) -> json.Json {
  json.object([
    #("endCursor", json.nullable(input.end_cursor, json.string)),
    #("hasNextPage", json.bool(input.has_next_page)),
  ])
}

pub fn starred_repository_edge_to_json(
  input: StarredRepositoryEdge,
) -> json.Json {
  json.object([
    #("starredAt", json.string(input.starred_at)),
    #("node", repository_to_json(input.node)),
  ])
}

pub fn repository_to_json(input: Repository) -> json.Json {
  json.object([
    #("archivedAt", json.nullable(input.archived_at, json.string)),
    #("description", json.nullable(input.description, json.string)),
    #("forkCount", json.int(input.fork_count)),
    #("homepageUrl", json.nullable(input.homepage_url, json.string)),
    #("url", json.string(input.url)),
    #("isFork", json.bool(input.is_fork)),
    #("isPrivate", json.bool(input.is_private)),
    #("isTemplate", json.bool(input.is_template)),
    #("languages", json.nullable(input.languages, language_connection_to_json)),
    #("latestRelease", json.nullable(input.latest_release, release_to_json)),
    #("licenseInfo", json.nullable(input.license_info, license_to_json)),
    #("nameWithOwner", json.string(input.name_with_owner)),
    #("parent", json.nullable(input.parent, parent_repository_to_json)),
    #("pushedAt", json.nullable(input.pushed_at, json.string)),
    #(
      "repositoryTopics",
      repository_topic_connection_to_json(input.repository_topics),
    ),
    #("stargazerCount", json.int(input.stargazer_count)),
  ])
}

pub fn language_connection_to_json(input: LanguageConnection) -> json.Json {
  json.object([
    #("totalCount", json.int(input.total_count)),
    #("totalSize", json.int(input.total_size)),
    #(
      "edges",
      json.nullable(input.edges, fn(list) {
        json.array(from: list, of: language_edge_to_json)
      }),
    ),
  ])
}

pub fn release_to_json(input: Release) -> json.Json {
  json.object([
    #("name", json.nullable(input.name, json.string)),
    #("publishedAt", json.nullable(input.published_at, json.string)),
  ])
}

pub fn license_to_json(input: License) -> json.Json {
  json.object([
    #("nickname", json.nullable(input.nickname, json.string)),
    #("spdxId", json.nullable(input.spdx_id, json.string)),
  ])
}

pub fn parent_repository_to_json(input: ParentRepository) -> json.Json {
  json.object([#("nameWithOwner", json.string(input.name_with_owner))])
}

pub fn repository_topic_connection_to_json(
  input: RepositoryTopicConnection,
) -> json.Json {
  json.object([
    #("totalCount", json.int(input.total_count)),
    #(
      "nodes",
      json.nullable(input.nodes, fn(list) {
        json.array(from: list, of: repository_topic_to_json)
      }),
    ),
  ])
}

pub fn language_edge_to_json(input: LanguageEdge) -> json.Json {
  json.object([
    #("node", language_to_json(input.node)),
    #("size", json.int(input.size)),
  ])
}

pub fn repository_topic_to_json(input: RepositoryTopic) -> json.Json {
  json.object([
    #("topic", topic_to_json(input.topic)),
    #("url", json.string(input.url)),
  ])
}

pub fn language_to_json(input: Language) -> json.Json {
  json.object([#("name", json.string(input.name))])
}

pub fn topic_to_json(input: Topic) -> json.Json {
  json.object([#("name", json.string(input.name))])
}

pub type UserStarredReposResponse {
  UserStarredReposResponse(user: Option(User))
}

pub fn user_starred_repos_response_decoder() -> decode.Decoder(
  UserStarredReposResponse,
) {
  use user <- decode.field("user", decode.optional(user_decoder()))
  decode.success(UserStarredReposResponse(user: user))
}

pub fn user_starred_repos_response_to_json(
  input: UserStarredReposResponse,
) -> json.Json {
  json.object([#("user", json.nullable(input.user, user_to_json))])
}

pub fn user_starred_repos(
  client: squall.Client,
  login: String,
  cursor: String,
) -> Result(Request(String), String) {
  squall.prepare_request(
    client,
    "query GetUserStarredRepos($login: String!, $cursor: String) {\n  viewer: user(login: $login) {\n    login\n\n    starredRepositories(first: 40, after: $cursor) {\n      isOverLimit\n      totalCount\n\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n\n      edges {\n        starredAt\n\n        node {\n          archivedAt\n          description\n          forkCount\n          homepageUrl\n          url\n          isFork\n          isPrivate\n          isTemplate\n\n          languages(first: 5, orderBy: { direction: DESC, field: SIZE }) {\n            totalCount\n            totalSize\n            edges {\n              node {\n                name\n              }\n              size\n            }\n          }\n\n          latestRelease {\n            name\n            publishedAt\n          }\n\n          licenseInfo {\n            nickname\n            spdxId\n          }\n\n          nameWithOwner\n          parent {\n            nameWithOwner\n          }\n          pushedAt\n\n          repositoryTopics(first: 20) {\n            totalCount\n            nodes {\n              topic {\n                name\n              }\n              url\n            }\n          }\n\n          stargazerCount\n        }\n      }\n    }\n  }\n}\n",
    json.object([
      #("login", json.string(login)),
      #("cursor", json.string(cursor)),
    ]),
  )
}

pub fn parse_user_starred_repos_response(
  body: String,
) -> Result(UserStarredReposResponse, String) {
  squall.parse_response(body, user_starred_repos_response_decoder())
}
