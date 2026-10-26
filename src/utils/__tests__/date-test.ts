import { addDays, dayTitle, parseDateString, toDateString, weekdayOf } from "@/utils/date";

describe("toDateString and parseDateString", () => {
  test("write a date as YYYY-MM-DD, with leading zeros", () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("read YYYY-MM-DD as local midnight of that day", () => {
    const date = parseDateString("2026-10-26");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9); // Months count from 0, so 9 = October
    expect(date.getDate()).toBe(26);
    expect(date.getHours()).toBe(0);
  });

  test("give back the same date when converted there and back", () => {
    expect(toDateString(parseDateString("2028-02-29"))).toBe("2028-02-29");
  });
});

describe("addDays", () => {
  test("moves forwards and backwards", () => {
    expect(addDays("2026-10-26", 1)).toBe("2026-10-27");
    expect(addDays("2026-10-26", -7)).toBe("2026-10-19");
  });

  test("crosses the end of a month and of a year", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  test("knows about leap years", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  test("isn't thrown off by the clocks changing", () => {
    // In Spain the clocks went back on 25 October 2026, so that day had 25 hours.
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });
});

describe("weekdayOf", () => {
  test("numbers weekdays from 1 = Monday to 7 = Sunday", () => {
    expect(weekdayOf("2026-10-26")).toBe(1); // Monday
    expect(weekdayOf("2026-11-01")).toBe(7); // Sunday
    expect(weekdayOf("2028-02-29")).toBe(2); // Tuesday
  });
});

describe("dayTitle", () => {
  const words = { today: "Today", yesterday: "Yesterday", tomorrow: "Tomorrow" };
  const today = "2026-10-26";

  test("uses words for today, yesterday and tomorrow", () => {
    expect(dayTitle("2026-10-26", today, words, "en-US")).toBe("Today");
    expect(dayTitle("2026-10-25", today, words, "en-US")).toBe("Yesterday");
    expect(dayTitle("2026-10-27", today, words, "en-US")).toBe("Tomorrow");
  });

  test("uses words across the end of a month", () => {
    expect(dayTitle("2026-11-01", "2026-10-31", words, "en-US")).toBe("Tomorrow");
  });
});
