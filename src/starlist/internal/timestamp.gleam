//// Timestamp formatting — ISO and locale modes.
//// ISO mode splits into YYYY-MM-DD / HH:MM:SS adjusted to the configured time zone.
//// Locale mode delegates to Intl.DateTimeFormat via FFI.

import starlist/config
import starlist/internal/star_types.{type Timestamp, Timestamp}

@external(javascript, "../timestamp_ffi.mjs", "formatDateIso")
fn ffi_format_date_iso(time_zone: String, iso_string: String) -> String

@external(javascript, "../timestamp_ffi.mjs", "formatTimeIso")
fn ffi_format_time_iso(time_zone: String, iso_string: String) -> String

@external(javascript, "../timestamp_ffi.mjs", "formatDateLocale")
fn ffi_format_date_locale(
  locale: String,
  time_zone: String,
  date_style: String,
  iso_string: String,
) -> String

@external(javascript, "../timestamp_ffi.mjs", "formatTimeLocale")
fn ffi_format_time_locale(
  locale: String,
  time_zone: String,
  time_style: String,
  iso_string: String,
) -> String

@external(javascript, "../timestamp_ffi.mjs", "nowIso")
fn ffi_now_iso() -> String

@external(javascript, "../timestamp_ffi.mjs", "nowEpochSeconds")
pub fn now_epoch_seconds() -> Int

pub fn now_iso() -> String {
  ffi_now_iso()
}

/// Format an ISO 8601 string into a Timestamp using the given DateTimeConfig.
pub fn format(cfg: config.DateTimeConfig, iso_string: String) -> Timestamp {
  case cfg {
    config.IsoDateTime(time_zone) ->
      Timestamp(
        date: ffi_format_date_iso(time_zone, iso_string),
        time: ffi_format_time_iso(time_zone, iso_string),
      )
    config.LocaleDateTime(locale, time_zone, date_style, time_style) ->
      Timestamp(
        date: ffi_format_date_locale(locale, time_zone, date_style, iso_string),
        time: ffi_format_time_locale(locale, time_zone, time_style, iso_string),
      )
  }
}

/// Get the current timestamp formatted using the given DateTimeConfig.
pub fn now(cfg: config.DateTimeConfig) -> Timestamp {
  format(cfg, ffi_now_iso())
}
