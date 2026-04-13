//// Internal types for starlist.
////
//// Resolve → partition → render pipeline types also live here.

import gleam/dict.{type Dict}
import gleam/option.{type Option}
import starlist/types.{type Language, type Repo, type Timestamp, type Topic}

/// Current data version for StarData serialization.
pub const data_version = 4

//@json_encode
//@json_decode
/// Fetched/loaded star data with metadata.
///
/// This is semi-opaque. Internal modules can construct and destructure it freely, but
/// external modules should use `starlist/star_data` functions to get at the external
/// data. It should only be constructed via the GitHub API client or the JSON loading
/// capabilities in `starlist`.
pub type StarData {
  StarData(
    /// The data version.
    ///
    /// If this does not match the current data version, the data cannot be used for
    /// processing and must be fetched from the API.
    data_version: Int,
    /// The login for whom the data was loaded.
    login: String,
    /// Whether the results are truncated by the GitHub API.
    truncated: Bool,
    /// The total number of stars reported for the user by the GitHub API.
    total: Int,
    /// The actual number of stars fetched.
    fetched: Int,
    /// The list of repos.
    repos: List(Repo),
    /// When this data was updated as an RFC3339 timestamp string.
    updated_at: String,
  )
}

/// A starred repository ready for display in a template.
///
/// All of the templates have been resolved to Timestamp records suitable for display.
pub type DisplayRepo {
  DisplayRepo(
    archived_on: Option(Timestamp),
    description: Option(String),
    forks: Int,
    homepage_url: Option(String),
    is_fork: Bool,
    is_private: Bool,
    is_template: Bool,
    total_languages: Int,
    languages: List(Language),
    latest_release: Option(DisplayRelease),
    licence: String,
    name: String,
    parent_repo: Option(String),
    pushed_on: Timestamp,
    starred_on: Timestamp,
    stars: Int,
    topics: Option(List(Topic)),
    url: String,
  )
}

/// Resolved release info with formatted timestamp.
pub type DisplayRelease {
  DisplayRelease(name: Option(String), published_on: Timestamp)
}

/// A group of starred repos under a topic, with the topic's URL.
pub type TopicGroup {
  TopicGroup(url: String, entries: List(DisplayRepo))
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

/// Fully resolved data passed to the page template (single-file or per-partition).
pub type PageVars {
  PageVars(
    data_version: Int,
    updated_at: Timestamp,
    generated_at: Timestamp,
    login: String,
    truncated: Bool,
    total: Int,
    fetched: Int,
    stars: List(DisplayRepo),
    groups: Dict(String, List(DisplayRepo)),
    group_count: Int,
    group_description: String,
    partition: Option(PartitionContext),
  )
}

/// Fully resolved data passed to the index template (partitioned mode only).
pub type IndexVars {
  IndexVars(
    data_version: Int,
    updated_at: Timestamp,
    generated_at: Timestamp,
    login: String,
    truncated: Bool,
    total: Int,
    fetched: Int,
    partitions: List(PartitionContext),
    partition_count: Int,
    partition_description: String,
  )
}
