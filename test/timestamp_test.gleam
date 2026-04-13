/// Property test for Timestamp Formatting (P10).
///
/// Validates: Requirements 15.1, 15.2 — for any valid ISO 8601 string and any
/// DateTimeConfig, formatting produces a Timestamp with non-empty date and time
/// fields. In ISO mode, date matches YYYY-MM-DD and time matches HH:MM:SS.
import gleam/int
import gleam/string
import qcheck
import starlist/config
import starlist/utils

// --- Generators ---

/// Generate a valid ISO 8601 datetime string like "2024-03-15T10:30:45Z".
fn iso_datetime_generator() -> qcheck.Generator(String) {
  use year, month, day, hour, minute, second <- qcheck.map6(
    qcheck.bounded_int(1970, 2099),
    qcheck.bounded_int(1, 12),
    qcheck.bounded_int(1, 28),
    qcheck.bounded_int(0, 23),
    qcheck.bounded_int(0, 59),
    qcheck.bounded_int(0, 59),
  )

  pad4(year)
  <> "-"
  <> pad2(month)
  <> "-"
  <> pad2(day)
  <> "T"
  <> pad2(hour)
  <> ":"
  <> pad2(minute)
  <> ":"
  <> pad2(second)
  <> "Z"
}

/// Generate a random IsoDateTime cfg with a valid IANA time zone.
fn iso_cfg_generator() -> qcheck.Generator(config.DateTimeConfig) {
  use tz <- qcheck.map(timezone_generator())
  config.IsoDateTime(time_zone: tz)
}

/// Generate a random LocaleDateTime cfg.
fn locale_cfg_generator() -> qcheck.Generator(config.DateTimeConfig) {
  use locale, tz, date_style, time_style <- qcheck.map4(
    locale_generator(),
    timezone_generator(),
    date_style_generator(),
    time_style_generator(),
  )
  config.LocaleDateTime(
    locale: locale,
    time_zone: tz,
    date_style: date_style,
    time_style: time_style,
  )
}

/// Generate either an ISO or locale cfg.
fn datetime_cfg_generator() -> qcheck.Generator(config.DateTimeConfig) {
  qcheck.from_generators(iso_cfg_generator(), [locale_cfg_generator()])
}

fn timezone_generator() -> qcheck.Generator(String) {
  qcheck.from_generators(qcheck.return("UTC"), [
    qcheck.return("America/New_York"),
    qcheck.return("Europe/London"),
    qcheck.return("Asia/Tokyo"),
    qcheck.return("Pacific/Auckland"),
  ])
}

fn locale_generator() -> qcheck.Generator(String) {
  qcheck.from_generators(qcheck.return("en-US"), [
    qcheck.return("en-GB"),
    qcheck.return("de-DE"),
    qcheck.return("ja-JP"),
    qcheck.return("fr-FR"),
  ])
}

fn date_style_generator() -> qcheck.Generator(String) {
  qcheck.from_generators(qcheck.return("short"), [
    qcheck.return("medium"),
    qcheck.return("long"),
    qcheck.return("full"),
  ])
}

fn time_style_generator() -> qcheck.Generator(String) {
  qcheck.from_generators(qcheck.return("short"), [
    qcheck.return("medium"),
    qcheck.return("long"),
    qcheck.return("full"),
  ])
}

// --- Helpers ---

fn pad2(n: Int) -> String {
  case n < 10 {
    True -> "0" <> int.to_string(n)
    False -> int.to_string(n)
  }
}

fn pad4(n: Int) -> String {
  case n < 10 {
    True -> "000" <> int.to_string(n)
    False ->
      case n < 100 {
        True -> "00" <> int.to_string(n)
        False ->
          case n < 1000 {
            True -> "0" <> int.to_string(n)
            False -> int.to_string(n)
          }
      }
  }
}

/// Check that a string matches YYYY-MM-DD: 4 digits, dash, 2 digits, dash, 2 digits.
fn is_iso_date(s: String) -> Bool {
  case string.length(s) == 10 {
    False -> False
    True -> {
      let parts = string.split(s, "-")
      case parts {
        [y, m, d] ->
          string.length(y) == 4
          && string.length(m) == 2
          && string.length(d) == 2
          && is_digits(y)
          && is_digits(m)
          && is_digits(d)
        _ -> False
      }
    }
  }
}

/// Check that a string matches HH:MM:SS: 2 digits, colon, 2 digits, colon, 2 digits.
fn is_iso_time(s: String) -> Bool {
  case string.length(s) == 8 {
    False -> False
    True -> {
      let parts = string.split(s, ":")
      case parts {
        [h, m, sec] ->
          string.length(h) == 2
          && string.length(m) == 2
          && string.length(sec) == 2
          && is_digits(h)
          && is_digits(m)
          && is_digits(sec)
        _ -> False
      }
    }
  }
}

fn is_digits(s: String) -> Bool {
  case int.parse(s) {
    Ok(_) -> True
    Error(_) -> False
  }
}

// --- Property Tests ---

/// P10: For any ISO 8601 string and any DateTimeConfig, formatting produces
/// a Timestamp with non-empty date and time fields.
pub fn timestamp_format_produces_nonempty_fields_test() {
  use #(iso_string, cfg) <- qcheck.given(qcheck.tuple2(
    iso_datetime_generator(),
    datetime_cfg_generator(),
  ))
  let ts = utils.format_timestamp(cfg, iso_string)
  assert ts.date != ""
  assert ts.time != ""
}

/// P10 (ISO mode): For any ISO 8601 string and IsoDateTime cfg, the date
/// field matches YYYY-MM-DD and the time field matches HH:MM:SS.
pub fn timestamp_iso_mode_format_test() {
  use #(iso_string, cfg) <- qcheck.given(qcheck.tuple2(
    iso_datetime_generator(),
    iso_cfg_generator(),
  ))
  let ts = utils.format_timestamp(cfg, iso_string)
  assert is_iso_date(ts.date)
  assert is_iso_time(ts.time)
}
