//// Star data — the primary data container for fetched/loaded star information.
////
//// `StarData` is defined internally and re-exported here. External consumers
//// should use the accessor functions; internal modules can use the constructor
//// directly via `starlist/internal/star_types`.

import gleam/list
import starlist/internal/star_types
import starlist/types.{type Repo}

/// Current data version for StarData serialization.
pub const data_version = star_types.data_version

/// Fetched/loaded star data with metadata.
pub type StarData =
  star_types.StarData

pub fn login(data: StarData) -> String {
  data.login
}

pub fn truncated(data: StarData) -> Bool {
  data.truncated
}

pub fn total(data: StarData) -> Int {
  data.total
}

pub fn fetched(data: StarData) -> Int {
  data.fetched
}

pub fn repos(data: StarData) -> List(Repo) {
  data.repos
}

pub fn updated_at(data: StarData) -> String {
  data.updated_at
}

pub fn version(data: StarData) -> Int {
  data.data_version
}

/// Filter repos, returning a new StarData with updated count.
pub fn filter_repos(data: StarData, keep: fn(Repo) -> Bool) -> StarData {
  let kept = list.filter(data.repos, keep)
  star_types.StarData(..data, repos: kept, fetched: list.length(kept))
}
