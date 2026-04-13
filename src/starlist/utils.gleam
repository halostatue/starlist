//// Starlist utilities functionality.

import gleam/list
import gleam/string
import starlist/config.{type DateTimeConfig}
import starlist/errors.{type StarlistError}
import starlist/types.{type Timestamp}

/// Validate that a path stays within the repo root.
pub fn validate_path(
  path: String,
  repo_root: String,
  label: String,
) -> Result(String, StarlistError) {
  let resolved = case is_absolute(path) {
    True -> path
    False -> repo_root <> "/" <> path
  }
  case normalize(resolved) {
    Ok(expanded) ->
      case string.starts_with(expanded, repo_root) {
        True -> Ok(expanded)
        False ->
          Error(errors.SecurityError(
            label <> " path '" <> path <> "' resolves outside repository root",
          ))
      }
    Error(Nil) ->
      Error(errors.SecurityError(
        label <> " path '" <> path <> "' contains invalid traversal",
      ))
  }
}

/// Return the current timestamp as an ISO formatted string.
pub fn now_iso() -> String {
  ffi_now_iso()
}

/// Return the current timestamp as Unix epoch seconds.
@external(javascript, "../starlist_ffi.mjs", "nowEpochSeconds")
pub fn now_epoch_seconds() -> Int

/// Format an ISO 8601 string into a Timestamp using the given DateTimeConfig.
///
/// ISO mode splits into YYYY-MM-DD / HH:MM:SS adjusted to the configured time zone.
/// Locale mode delegates to Intl.DateTimeFormat via FFI.
pub fn format_timestamp(cfg: DateTimeConfig, iso_string: String) -> Timestamp {
  case cfg {
    config.IsoDateTime(time_zone) ->
      types.Timestamp(
        date: ffi_format_date_iso(time_zone, iso_string),
        time: ffi_format_time_iso(time_zone, iso_string),
      )
    config.LocaleDateTime(locale, time_zone, date_style, time_style) ->
      types.Timestamp(
        date: ffi_format_date_locale(locale, time_zone, date_style, iso_string),
        time: ffi_format_time_locale(locale, time_zone, time_style, iso_string),
      )
  }
}

/// Get the current timestamp formatted using the given DateTimeConfig.
pub fn now(cfg: DateTimeConfig) -> Timestamp {
  format_timestamp(cfg, ffi_now_iso())
}

// ---------------------------------------------------------------------------
// Path validation
// ---------------------------------------------------------------------------

fn is_absolute(path: String) -> Bool {
  string.starts_with(path, "/")
}

/// Normalize a path by resolving `.` and `..` segments.
fn normalize(path: String) -> Result(String, Nil) {
  let #(prefix, to_split) = case string.starts_with(path, "/") {
    True -> #("/", string.drop_start(path, 1))
    False -> #("", path)
  }
  let segments = string.split(to_split, "/") |> collapse_segments([], _)
  case segments {
    Error(Nil) -> Error(Nil)
    Ok(parts) -> Ok(prefix <> string.join(parts, "/"))
  }
}

fn collapse_segments(
  acc: List(String),
  segments: List(String),
) -> Result(List(String), Nil) {
  case segments {
    [] -> Ok(list.reverse(acc))
    [".", ..rest] -> collapse_segments(acc, rest)
    ["", ..rest] -> collapse_segments(acc, rest)
    ["..", ..rest] ->
      case acc {
        [_, ..tail] -> collapse_segments(tail, rest)
        [] -> Error(Nil)
      }
    [seg, ..rest] -> collapse_segments([seg, ..acc], rest)
  }
}

@external(javascript, "../starlist_ffi.mjs", "formatDateIso")
fn ffi_format_date_iso(time_zone: String, iso_string: String) -> String

@external(javascript, "../starlist_ffi.mjs", "formatTimeIso")
fn ffi_format_time_iso(time_zone: String, iso_string: String) -> String

@external(javascript, "../starlist_ffi.mjs", "formatDateLocale")
fn ffi_format_date_locale(
  locale: String,
  time_zone: String,
  date_style: String,
  iso_string: String,
) -> String

@external(javascript, "../starlist_ffi.mjs", "formatTimeLocale")
fn ffi_format_time_locale(
  locale: String,
  time_zone: String,
  time_style: String,
  iso_string: String,
) -> String

@external(javascript, "../starlist_ffi.mjs", "nowIso")
fn ffi_now_iso() -> String
