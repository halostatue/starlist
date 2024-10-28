//// Multi-file output partitioning.
////
//// Partitions resolved star data by a configured key, producing per-partition
//// data slices and an index with partition metadata.

import gleam/dict.{type Dict}
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import starlist/config
import starlist/internal/star_types.{type StarredRepo, type TemplateVars}

/// Metadata for a single partition, used by the index template.
pub type PartitionInfo {
  PartitionInfo(key: String, filename: String, count: Int)
}

/// A single partition's data slice.
pub type PartitionData {
  PartitionData(key: String, filename: String, vars: TemplateVars)
}

/// Result of partitioning: index metadata and per-partition data slices.
pub type PartitionResult {
  PartitionResult(partitions: List(PartitionInfo), data: List(PartitionData))
}

/// Partition the given TemplateVars.
/// Returns Error if partition is Off (caller should use single-file mode).
pub fn partition(
  vars: TemplateVars,
  partition: config.Partition,
  group: config.Group,
  partition_filename: String,
) -> Result(PartitionResult, Nil) {
  case partition {
    config.PartitionOff -> Error(Nil)
    _ -> {
      let buckets = bucket_stars(vars.stars, partition)
      let sorted_keys = dict.keys(buckets) |> list.sort(string.compare)

      let partitions =
        list.map(sorted_keys, fn(key) {
          let stars = dict_get(buckets, key)
          PartitionInfo(
            key: key,
            filename: make_filename(partition_filename, key),
            count: list.length(stars),
          )
        })

      let grouped = !partition_matches_group(partition, group)
      let data =
        list.map(sorted_keys, fn(key) {
          let stars = dict_get(buckets, key)
          let count = list.length(stars)
          let filename = make_filename(partition_filename, key)
          let count_label = case count {
            1 -> "1 repo"
            n -> int.to_string(n) <> " repos"
          }
          let ctx =
            star_types.PartitionContext(
              name: key,
              filename: filename,
              count: count,
              count_label: count_label,
            )
          let scoped = scope_vars(vars, stars, group, grouped, Some(ctx))
          PartitionData(key: key, filename: filename, vars: scoped)
        })

      Ok(PartitionResult(partitions:, data:))
    }
  }
}

// ---------------------------------------------------------------------------
// Bucketing
// ---------------------------------------------------------------------------

fn bucket_stars(
  stars: List(StarredRepo),
  partition: config.Partition,
) -> Dict(String, List(StarredRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let keys = partition_keys(repo, partition)
    list.fold(keys, acc, fn(inner, key) { upsert(inner, key, repo) })
  })
}

fn partition_keys(
  repo: StarredRepo,
  partition: config.Partition,
) -> List(String) {
  case partition {
    config.PartitionOff -> []
    config.PartitionByLanguage ->
      case repo.languages {
        [] -> [""]
        langs -> list.map(langs, fn(l) { l.name })
      }
    config.PartitionByTopic ->
      case repo.topics {
        None | Some([]) -> ["no-topics"]
        Some(topics) -> list.map(topics, fn(t) { t.name })
      }
    config.PartitionByYear -> [year_from_timestamp(repo.starred_on)]
    config.PartitionByYearMonth -> [year_month_from_timestamp(repo.starred_on)]
  }
}

/// Extract "YYYY" from a Timestamp whose date is "YYYY-MM-DD" or similar.
fn year_from_timestamp(ts: star_types.Timestamp) -> String {
  case string.split(ts.date, "-") {
    [year, ..] -> year
    _ -> ts.date
  }
}

/// Extract "YYYY-MM" from a Timestamp whose date is "YYYY-MM-DD" or similar.
fn year_month_from_timestamp(ts: star_types.Timestamp) -> String {
  case string.split(ts.date, "-") {
    [year, month, ..] -> year <> "-" <> month
    _ -> ts.date
  }
}

// ---------------------------------------------------------------------------
// Scoping
// ---------------------------------------------------------------------------

fn scope_vars(
  base: TemplateVars,
  stars: List(StarredRepo),
  group: config.Group,
  grouped: Bool,
  partition_ctx: Option(star_types.PartitionContext),
) -> TemplateVars {
  case grouped {
    False ->
      star_types.TemplateVars(
        ..base,
        stars: stars,
        total: list.length(stars),
        fetched: list.length(stars),
        groups: dict.new(),
        group_count: 0,
        group_description: "",
        partition: partition_ctx,
      )
    True -> {
      let #(groups, description) = group_stars(stars, group)
      star_types.TemplateVars(
        ..base,
        stars: stars,
        total: list.length(stars),
        fetched: list.length(stars),
        groups: groups,
        group_count: dict.size(groups),
        group_description: description,
        partition: partition_ctx,
      )
    }
  }
}

fn group_stars(
  stars: List(StarredRepo),
  group: config.Group,
) -> #(Dict(String, List(StarredRepo)), String) {
  case group {
    config.GroupByLanguage -> #(group_by_language(stars), "languages")
    config.GroupByTopic -> #(group_by_topic(stars), "topics")
    config.GroupByLicence -> #(group_by_licence(stars), "licences")
  }
}

fn group_by_language(
  stars: List(StarredRepo),
) -> Dict(String, List(StarredRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.languages {
      [first, ..] -> first.name
      [] -> ""
    }
    upsert(acc, key, repo)
  })
}

fn group_by_topic(stars: List(StarredRepo)) -> Dict(String, List(StarredRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.topics {
      None | Some([]) -> "no-topics"
      Some([first, ..]) -> first.name
    }
    upsert(acc, key, repo)
  })
}

fn group_by_licence(stars: List(StarredRepo)) -> Dict(String, List(StarredRepo)) {
  list.fold(stars, dict.new(), fn(acc, repo) {
    let key = case repo.license {
      "" -> "Unknown license"
      l -> l
    }
    upsert(acc, key, repo)
  })
}

// ---------------------------------------------------------------------------
// Filename generation
// ---------------------------------------------------------------------------

pub fn make_filename(pattern: String, key: String) -> String {
  string.replace(pattern, "{key}", sanitize_key(key))
}

pub fn sanitize_key(key: String) -> String {
  key
  |> string.lowercase
  |> apply_shorthands
  |> replace_non_word
  |> collapse_hyphens
  |> drop_leading("-")
  |> drop_trailing("-")
}

fn apply_shorthands(s: String) -> String {
  s
  |> string.replace("c++", "cpp")
  |> string.replace("c#", "csharp")
  |> string.replace("f#", "fsharp")
  |> string.replace("f*", "fstar")
  |> string.replace("q#", "qsharp")
  |> string.replace(".net", "dotnet")
}

fn replace_non_word(s: String) -> String {
  s
  |> string.replace("'", "")
  |> string.to_graphemes
  |> list.map(fn(c) {
    case is_alnum(c) || c == "-" {
      True -> c
      False -> "-"
    }
  })
  |> string.join("")
}

fn collapse_hyphens(s: String) -> String {
  case string.contains(s, "--") {
    True -> collapse_hyphens(string.replace(s, "--", "-"))
    False -> s
  }
}

fn drop_leading(s: String, char: String) -> String {
  case string.starts_with(s, char) {
    True -> drop_leading(string.drop_start(s, 1), char)
    False -> s
  }
}

fn drop_trailing(s: String, char: String) -> String {
  case string.ends_with(s, char) {
    True -> drop_trailing(string.drop_end(s, 1), char)
    False -> s
  }
}

fn is_alnum(c: String) -> Bool {
  case c {
    "a"
    | "b"
    | "c"
    | "d"
    | "e"
    | "f"
    | "g"
    | "h"
    | "i"
    | "j"
    | "k"
    | "l"
    | "m"
    | "n"
    | "o"
    | "p"
    | "q"
    | "r"
    | "s"
    | "t"
    | "u"
    | "v"
    | "w"
    | "x"
    | "y"
    | "z"
    | "0"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9" -> True
    _ -> False
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn partition_matches_group(
  partition: config.Partition,
  group: config.Group,
) -> Bool {
  case partition, group {
    config.PartitionByLanguage, config.GroupByLanguage -> True
    config.PartitionByTopic, config.GroupByTopic -> True
    _, _ -> False
  }
}

fn upsert(
  acc: Dict(String, List(StarredRepo)),
  key: String,
  repo: StarredRepo,
) -> Dict(String, List(StarredRepo)) {
  let existing = case dict.get(acc, key) {
    Ok(repos) -> repos
    Error(_) -> []
  }
  dict.insert(acc, key, list.append(existing, [repo]))
}

fn dict_get(
  d: Dict(String, List(StarredRepo)),
  key: String,
) -> List(StarredRepo) {
  case dict.get(d, key) {
    Ok(v) -> v
    Error(_) -> []
  }
}
