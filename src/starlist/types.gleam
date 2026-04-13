//// Public domain types for starlist.
////
//// These types are documented and stable — they appear in the public API
//// surface of `starlist` and `starlist/star_data`.

import gleam/option.{type Option}

/// Formatted timestamp with separate date and time components.
pub type Timestamp {
  Timestamp(date: String, time: String)
}

/// A starred repository.
pub type Repo {
  Repo(
    /// If the repository was archived, when it was archived as an RFC3339 timestamp.
    archived_on: Option(String),
    /// The description of the repository, if present.
    description: Option(String),
    /// The number of forks of the repository.
    forks: Int,
    /// The homepage URL for the repository.
    homepage_url: Option(String),
    /// Whether this repository is a fork of another repository.
    is_fork: Bool,
    /// Whether this repository is private.
    is_private: Bool,
    /// Whether the repository is a template repository.
    is_template: Bool,
    /// The total number of languages used in the repository.
    total_languages: Int,
    /// The list of languages used in the repository.
    languages: List(Language),
    /// The latest release.
    latest_release: Option(Release),
    /// The licence of the repo. This may be an empty string.
    licence: String,
    /// The name of the repo.
    name: String,
    /// The optional parent repo.
    parent_repo: Option(String),
    /// The RFC3339 timestamp when there was last activity on the repo.
    pushed_on: String,
    /// The RFC3339 timestamp when the user starred the repo.
    starred_on: String,
    /// The number of stars on the repo.
    stars: Int,
    /// An optional list of topics on the repo.
    topics: Option(List(Topic)),
    /// The URL to the repo.
    url: String,
  )
}

/// Latest repo release information.
pub type Release {
  Release(
    /// The optional name of the release.
    name: Option(String),
    /// The RFC3339 timestamp of the release.
    published_on: String,
  )
}

/// Language with name and percentage of repo code.
pub type Language {
  Language(
    /// The name of a language used in the repo.
    name: String,
    /// The percentage (by lines of code) of this language in the repo.
    percent: Int,
  )
}

/// Topic with name and URL.
pub type Topic {
  Topic(
    /// The topic name.
    name: String,
    /// The URL to the topic.
    url: String,
  )
}

/// A generated output file ready to be written to disk.
pub type OutputFile {
  OutputFile(filename: String, data: String)
}
