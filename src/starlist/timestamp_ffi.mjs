export function formatDateLocale(locale, timeZone, dateStyle, isoString) {
  const formatter = new Intl.DateTimeFormat(locale, { timeZone, dateStyle });
  return formatter.format(new Date(isoString));
}

export function formatTimeLocale(locale, timeZone, timeStyle, isoString) {
  const formatter = new Intl.DateTimeFormat(locale, { timeZone, timeStyle });
  return formatter.format(new Date(isoString));
}

export function formatDateIso(timeZone, isoString) {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function formatTimeIso(timeZone, isoString) {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}:${get("second")}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function nowEpochSeconds() {
  return Math.floor(Date.now() / 1000);
}
