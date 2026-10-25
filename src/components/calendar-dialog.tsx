import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { LayoutAnimationConfig, SlideInLeft, SlideInRight } from "react-native-reanimated";

import { Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { fontSize, fonts, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { parseDateString, toDateString, weekdayOf } from "@/utils/date";

// A popup with one month of days, Monday first, to jump to any date. Tapping a day picks it and closes.
// The arrows change the month, and the new month slides in from the side it came from.
// Open it only while needed (it isn't kept around hidden), so it always starts at `date`'s month.
export function CalendarDialog({
  date,
  today,
  onPick,
  onClose,
}: {
  date: string;
  today: string;
  onPick: (date: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { t, locale } = useTranslation();
  const picked = parseDateString(date);
  // The first day of the month on screen.
  const [month, setMonth] = useState(new Date(picked.getFullYear(), picked.getMonth(), 1));
  // 1 when the last arrow tapped was "next", -1 for "previous", so the slide goes the right way.
  const [direction, setDirection] = useState(1);

  function changeMonth(by: number) {
    setDirection(by);
    setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));
  }

  // Empty cells before day 1 so it sits under its weekday, then every day of the month.
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = Array(weekdayOf(toDateString(month)) - 1).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateString(new Date(month.getFullYear(), month.getMonth(), day)));
  }
  // Always 6 weeks (the most a month can span), so the popup keeps the same height every month.
  while (cells.length < 42) cells.push(null);

  const title = month.toLocaleDateString(locale, { month: "long", year: "numeric" });
  // January 1, 2024 was a Monday, so these are Monday ... Sunday in the app's language.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "narrow" })
  );

  return (
    <Dialog visible title={t.main.pickDate} onClose={onClose}>
      <View style={styles.monthRow}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={spacing.sm} accessibilityLabel={t.calendar.previousMonth}>
          <Icon name="chevronLeft" size={24} color={colors.text} />
        </Pressable>
        {/* Some languages write month names in lowercase ("octubre de 2026"); as a title it starts with a capital. */}
        <Text style={styles.monthTitle}>{title.charAt(0).toUpperCase() + title.slice(1)}</Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={spacing.sm} accessibilityLabel={t.calendar.nextMonth}>
          <Icon name="chevronRight" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View>
        <View style={styles.week}>
          {weekdays.map((weekday, i) => (
            <Text key={i} style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>

        {/* No slide when the popup opens, only when the month changes. */}
        <LayoutAnimationConfig skipEntering>
          <View style={styles.clip}>
            <Animated.View
              key={toDateString(month)}
              entering={(direction > 0 ? SlideInRight : SlideInLeft).duration(220)}
              style={styles.grid}
            >
              {cells.map((day, i) => {
                if (day === null) return <View key={i} style={styles.cell} />;
                const isPicked = day === date;
                return (
                  <Pressable
                    key={day}
                    style={styles.cell}
                    onPress={() => onPick(day)}
                    accessibilityLabel={parseDateString(day).toLocaleDateString(locale, { dateStyle: "long" })}
                  >
                    <View style={[styles.day, day === today && styles.today, isPicked && styles.picked]}>
                      <Text style={[styles.dayText, day === today && styles.todayText, isPicked && styles.pickedText]}>
                        {parseDateString(day).getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          </View>
        </LayoutAnimationConfig>
      </View>
    </Dialog>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthTitle: {
    fontSize: fontSize.medium,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  week: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: fontSize.small,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  // Hides the next month while it slides in from outside the popup.
  clip: {
    overflow: "hidden",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  day: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.pill,
  },
  today: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  picked: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.large,
    fontFamily: fonts.numberMedium,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  todayText: {
    color: colors.primaryText,
  },
  pickedText: {
    fontFamily: fonts.number,
    color: colors.onPrimary,
  },
});
