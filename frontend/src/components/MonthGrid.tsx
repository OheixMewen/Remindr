import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";

import type { Priority } from "@/src/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { priorityColor } from "@/src/lib/priority";
import { capitalize, toISODate, todayISO } from "@/src/lib/dates";
import { Icon } from "@/src/components/Icon";

const WD = ["L", "M", "M", "J", "V", "S", "D"];

// Convert JS getDay (0=Sun) into Monday-first column index (0=Mon..6=Sun).
function monIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function MonthGrid({
  month,
  onPrev,
  onNext,
  selectedISO,
  onSelect,
  markers,
  compact = false,
}: {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  selectedISO?: string;
  onSelect: (iso: string) => void;
  markers?: Record<string, Priority[]>;
  compact?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const today = todayISO();

  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const leadingBlanks = monIndex(getDay(start));

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={onPrev} hitSlop={12} style={styles.navBtn} testID="month-prev">
          <Icon name="chevron-back" size={20} color={colors.brandPrimary} />
        </Pressable>
        <Text style={styles.monthLabel} testID="month-label">
          {capitalize(format(month, "MMMM yyyy", { locale: fr }))}
        </Text>
        <Pressable onPress={onNext} hitSlop={12} style={styles.navBtn} testID="month-next">
          <Icon name="chevron-forward" size={20} color={colors.brandPrimary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WD.map((d, i) => (
          <Text key={i} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const iso = toISODate(d);
          const selected = iso === selectedISO;
          const isToday = iso === today;
          const inMonth = isSameMonth(d, month);
          const dots = (markers?.[iso] ?? []).slice(0, 3);
          return (
            <Pressable
              key={i}
              style={styles.cell}
              onPress={() => onSelect(iso)}
              testID={`day-${iso}`}
            >
              <View
                style={[
                  styles.dayCircle,
                  compact && styles.dayCircleCompact,
                  selected && { backgroundColor: colors.brandPrimary },
                  !selected && isToday && { backgroundColor: colors.surfaceTertiary },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !inMonth && { color: colors.muted },
                    isToday && !selected && { color: colors.brandPrimary, fontWeight: "700" },
                    selected && { color: colors.onBrandPrimary, fontWeight: "700" },
                  ]}
                >
                  {format(d, "d")}
                </Text>
              </View>
              <View style={styles.dotRow}>
                {dots.map((p, di) => (
                  <View
                    key={di}
                    style={[styles.dot, { backgroundColor: priorityColor(colors, p) }]}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export { addMonths };

const useStyles = makeStyles((colors) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.xs },
  monthLabel: { fontSize: 17, fontWeight: "600", color: colors.onSurface },
  weekRow: { flexDirection: "row", marginBottom: spacing.xs },
  weekDay: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleCompact: { width: 34, height: 34 },
  dayText: { fontSize: 16, color: colors.onSurface },
  dotRow: { flexDirection: "row", gap: 2, height: 6, marginTop: 1 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
}));
