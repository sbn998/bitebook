// Weekday numbers as stored in the database: 1 = Monday ... 7 = Sunday.
// English only for now, until translations are added.
export const WEEKDAYS = [
  { number: 1, label: "Monday" },
  { number: 2, label: "Tuesday" },
  { number: 3, label: "Wednesday" },
  { number: 4, label: "Thursday" },
  { number: 5, label: "Friday" },
  { number: 6, label: "Saturday" },
  { number: 7, label: "Sunday" },
];

export function weekdayLabel(number: number) {
  return WEEKDAYS.find((weekday) => weekday.number === number)?.label ?? String(number);
}
