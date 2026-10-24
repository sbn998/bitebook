// Today's date as YYYY-MM-DD in the phone's local time zone.
// SQLite's own "now" is in UTC, which can still be yesterday or already tomorrow here.
export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// The weekday of a YYYY-MM-DD date, numbered like the database: 1 = Monday ... 7 = Sunday.
export function weekdayOf(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const sundayFirst = new Date(year, month - 1, day).getDay(); // 0 = Sunday ... 6 = Saturday
  return ((sundayFirst + 6) % 7) + 1;
}
