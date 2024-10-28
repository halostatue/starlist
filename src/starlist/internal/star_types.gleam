/// Resolved star data types — the domain types used after API/file data
/// is transformed into template-ready form. These complement the squall-generated
/// response types in `starlist/graphql/`.
import gleam/dict.{type Dict}
import gleam/option.{type Option}

/// Current data version for QueryResponse serialization.
pub const data_version = 2

/// Formatted timestamp with separate date and time components.
pub type Timestamp {
  Timestamp(date: String, time: String)
}

/// Language with name and percentage of repo code.
pub type Language {
  Language(name: String, percent: Int)
}

/// Topic with name and URL.
pub type Topic {
  Topic(name: String, url: String)
}

/// Resolved release info with formatted timestamp.
pub type Release {
  Release(name: Option(String), published_on: Timestamp)
}

/// A starred repo with all timestamps resolved to Timestamp records.
pub type StarredRepo {
  StarredRepo(
    archived_on: Option(Timestamp),
    description: Option(String),
    forks: Int,
    homepage_url: Option(String),
    is_fork: Bool,
    is_private: Bool,
    is_template: Bool,
    language_count: Int,
    languages: List(Language),
    latest_release: Option(Release),
    license: String,
    name: String,
    parent_repo: Option(String),
    pushed_on: Timestamp,
    starred_on: Timestamp,
    stars: Int,
    topic_count: Int,
    topics: Option(List(Topic)),
    url: String,
  )
}

/// A group of starred repos under a topic, with the topic's URL.
pub type TopicGroup {
  TopicGroup(url: String, entries: List(StarredRepo))
}

/// Partition context for a template — None when single-file mode.
pub type PartitionContext {
  PartitionContext(
    name: String,
    filename: String,
    count: Int,
    count_label: String,
  )
}

/// Fully resolved data passed to the template engine.
pub type TemplateVars {
  TemplateVars(
    data_version: Int,
    updated_at: Timestamp,
    generated_at: Timestamp,
    login: String,
    truncated: Bool,
    total: Int,
    fetched: Int,
    stars: List(StarredRepo),
    groups: Dict(String, List(StarredRepo)),
    group_count: Int,
    group_description: String,
    partition: Option(PartitionContext),
    partitions: List(PartitionContext),
    partition_count: Int,
    partition_description: String,
  )
}

/// Raw API/file response wrapper, serialized to/from data.json.
/// Wraps the accumulated response data with metadata fields.
pub type QueryResponse {
  QueryResponse(
    data_version: Int,
    login: String,
    truncated: Bool,
    total: Int,
    fetched: Int,
    stars: List(ResponseRepo),
    updated_at: String,
  )
}

/// A repository as stored in data.json — flattened from the GraphQL response
/// into a simpler structure for serialization.
pub type ResponseRepo {
  ResponseRepo(
    archived_on: Option(String),
    description: Option(String),
    forks: Int,
    homepage_url: Option(String),
    is_fork: Bool,
    is_private: Bool,
    is_template: Bool,
    language_count: Int,
    languages: List(Language),
    latest_release: Option(ResponseRelease),
    license: String,
    name: String,
    parent_repo: Option(String),
    pushed_on: String,
    starred_on: String,
    stars: Int,
    topic_count: Int,
    topics: Option(List(Topic)),
    url: String,
  )
}

/// Release info as stored in data.json (raw ISO string, not yet formatted).
pub type ResponseRelease {
  ResponseRelease(name: Option(String), published_on: String)
}

/// A generated output file ready to be written and staged.
pub type GeneratedFile {
  GeneratedFile(filename: String, data: String)
}
