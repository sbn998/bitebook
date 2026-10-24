// Today's date as YYYY-MM-DD in the phone's local time zone.
// SQLite's own "now" is in UTC, which can still be yesterday or already tomorrow here.
export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
