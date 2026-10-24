// Dates are stored as YYYY-MM-DD strings, always in the phone's local time zone.
// SQLite's own "now" is in UTC, which can still be yesterday or already tomorrow here.

// A Date as YYYY-MM-DD, using its local date.
export function toDateString(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// A YYYY-MM-DD string as a Date at local midnight.
export function parseDateString(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Today's date as YYYY-MM-DD.
export function todayString() {
  return toDateString(new Date());
}

// The date `days` days after (or before, if negative) a YYYY-MM-DD date.
export function addDays(date: string, days: number) {
  const result = parseDateString(date);
  result.setDate(result.getDate() + days);
  return toDateString(result);
}

// The weekday of a YYYY-MM-DD date, numbered like the database: 1 = Monday ... 7 = Sunday.
export function weekdayOf(date: string) {
  const sundayFirst = parseDateString(date).getDay(); // 0 = Sunday ... 6 = Saturday
  return ((sundayFirst + 6) % 7) + 1;
}

// "Today", "Yesterday", "Tomorrow" (in `words`, the app's language), or the short date in `locale`'s format.
export function dayTitle(
  date: string,
  today: string,
  words: { today: string; yesterday: string; tomorrow: string },
  locale: string
) {
  if (date === today) return words.today;
  if (date === addDays(today, -1)) return words.yesterday;
  if (date === addDays(today, 1)) return words.tomorrow;
  return parseDateString(date).toLocaleDateString(locale);
}

// The weekday and date in `locale`'s language, e.g. "Saturday, October 24" or "sábado, 24 de octubre".
export function longDate(date: string, locale: string) {
  return parseDateString(date).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
}
