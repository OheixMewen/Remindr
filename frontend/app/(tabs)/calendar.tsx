import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

import type { Occurrence, Priority } from "@/src/types";
import { useTasks } from "@/src/store/TaskContext";
import { expandOccurrences } from "@/src/lib/recurrence";
import { capitalize, parseISODate, relativeDateLabel, toISODate, todayISO } from "@/src/lib/dates";
import { PRIORITY_RANK } from "@/src/lib/priority";
import { sortByTime } from "@/src/lib/selectors";
import { haptic } from "@/src/lib/haptics";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { SegmentedControl } from "@/src/components/SegmentedControl";
import { MonthGrid } from "@/src/components/MonthGrid";
import { Section } from "@/src/components/Section";
import { TaskRow } from "@/src/components/TaskRow";
import { SwipeableRow } from "@/src/components/SwipeableRow";
import { Icon } from "@/src/components/Icon";
import { Fab } from "@/src/components/Fab";
import { useToast } from "@/src/components/ToastProvider";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type ViewMode = "month" | "week" | "day";

export default function CalendarScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { tasks, toggleComplete, postponeOccurrence, deleteOccurrence } = useTasks();

  const [mode, setMode] = useState<ViewMode>("month");
  const [selected, setSelected] = useState<string>(todayISO());
  const [visibleMonth, setVisibleMonth] = useState<Date>(parseISODate(todayISO()));

  // Markers for the visible month (priority dots per day).
  const markers = useMemo(() => {
    const start = startOfMonth(visibleMonth);
    const end = endOfMonth(visibleMonth);
    const occs = expandOccurrences(tasks, start, end);
    const map: Record<string, Priority[]> = {};
    for (const o of occs) {
      if (!map[o.date]) map[o.date] = [];
      if (!map[o.date].includes(o.priority)) map[o.date].push(o.priority);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => PRIORITY_RANK[a] - PRIORITY_RANK[b]);
    return map;
  }, [tasks, visibleMonth]);

  const dayOccurrences = useMemo(() => {
    const d = parseISODate(selected);
    return expandOccurrences(tasks, d, d)
      .filter((o) => o.date === selected)
      .sort(sortByTime);
  }, [tasks, selected]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(parseISODate(selected), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  const openTask = (o: Occurrence) =>
    router.push({ pathname: "/task/[id]", params: { id: o.taskId, d: o.originalDate } });

  const renderRow = (o: Occurrence) => (
    <SwipeableRow
      key={o.key}
      rightActions={[
        {
          label: "Demain",
          icon: "arrow-forward",
          color: colors.warning,
          onPress: () => {
            haptic.light();
            postponeOccurrence(o);
            toast("Reporté à demain");
          },
        },
        {
          label: "Suppr.",
          icon: "trash",
          color: colors.error,
          onPress: () => {
            haptic.warning();
            deleteOccurrence(o);
            toast("Tâche supprimée", "info");
          },
        },
      ]}
    >
      <TaskRow
        occ={o}
        onToggle={() => {
          haptic.success();
          toggleComplete(o);
        }}
        onPress={() => openTask(o)}
      />
    </SwipeableRow>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Calendrier" large={false} />
      <View style={styles.segmentWrap}>
        <SegmentedControl<ViewMode>
          options={[
            { label: "Mois", value: "month" },
            { label: "Semaine", value: "week" },
            { label: "Jour", value: "day" },
          ]}
          value={mode}
          onChange={setMode}
          testID="calendar-mode"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mode === "month" ? (
          <View style={styles.calCard}>
            <MonthGrid
              month={visibleMonth}
              onPrev={() => setVisibleMonth((m) => addMonths(m, -1))}
              onNext={() => setVisibleMonth((m) => addMonths(m, 1))}
              selectedISO={selected}
              onSelect={(iso) => {
                haptic.selection();
                setSelected(iso);
                setVisibleMonth(parseISODate(iso));
              }}
              markers={markers}
            />
          </View>
        ) : null}

        {mode === "week" ? (
          <View style={styles.weekStrip}>
            {weekDays.map((d) => {
              const iso = toISODate(d);
              const on = iso === selected;
              const isToday = iso === todayISO();
              const dots = (markers[iso] ?? []).length;
              return (
                <Pressable
                  key={iso}
                  style={[styles.weekDay, on && styles.weekDayOn]}
                  onPress={() => {
                    haptic.selection();
                    setSelected(iso);
                  }}
                  testID={`week-day-${iso}`}
                >
                  <Text style={[styles.weekDayName, on && styles.weekTextOn]}>
                    {capitalize(format(d, "EEE", { locale: fr })).slice(0, 3)}
                  </Text>
                  <Text style={[styles.weekDayNum, on && styles.weekTextOn, isToday && !on && { color: colors.brandPrimary }]}>
                    {format(d, "d")}
                  </Text>
                  <View style={[styles.weekDot, dots > 0 && { backgroundColor: on ? colors.onBrandPrimary : colors.brandPrimary }]} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {mode === "week" ? (
          <View style={styles.weekNav}>
            <Pressable onPress={() => setSelected(toISODate(addWeeks(parseISODate(selected), -1)))} hitSlop={8} testID="week-prev">
              <Icon name="chevron-back" size={20} color={colors.brandPrimary} />
            </Pressable>
            <Text style={styles.navLabel}>Semaine</Text>
            <Pressable onPress={() => setSelected(toISODate(addWeeks(parseISODate(selected), 1)))} hitSlop={8} testID="week-next">
              <Icon name="chevron-forward" size={20} color={colors.brandPrimary} />
            </Pressable>
          </View>
        ) : null}

        {mode === "day" ? (
          <View style={styles.dayNav}>
            <Pressable onPress={() => setSelected(toISODate(addDays(parseISODate(selected), -1)))} hitSlop={10} testID="day-prev">
              <Icon name="chevron-back" size={22} color={colors.brandPrimary} />
            </Pressable>
            <Text style={styles.dayNavLabel}>{capitalize(format(parseISODate(selected), "EEEE d MMMM", { locale: fr }))}</Text>
            <Pressable onPress={() => setSelected(toISODate(addDays(parseISODate(selected), 1)))} hitSlop={10} testID="day-next">
              <Icon name="chevron-forward" size={22} color={colors.brandPrimary} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{relativeDateLabel(selected)}</Text>
          <Pressable
            style={styles.addForDay}
            onPress={() => router.push({ pathname: "/task/new", params: { date: selected } })}
            testID="calendar-add-day"
          >
            <Icon name="add" size={16} color={colors.brandPrimary} />
            <Text style={styles.addForDayText}>Ajouter</Text>
          </Pressable>
        </View>

        {dayOccurrences.length > 0 ? (
          <Section>{dayOccurrences.map(renderRow)}</Section>
        ) : (
          <View style={styles.emptyDay}>
            <Icon name="calendar-clear-outline" size={28} color={colors.muted} />
            <Text style={styles.emptyDayText}>Aucune tâche ce jour</Text>
          </View>
        )}
      </ScrollView>

      <Fab onPress={() => router.push({ pathname: "/task/new", params: { date: selected } })} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  segmentWrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxxl },
  calCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  weekStrip: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  weekDay: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.md, gap: 2 },
  weekDayOn: { backgroundColor: colors.brandPrimary },
  weekDayName: { fontSize: 11, color: colors.muted, textTransform: "uppercase" },
  weekDayNum: { fontSize: 17, fontWeight: "600", color: colors.onSurface },
  weekTextOn: { color: colors.onBrandPrimary },
  weekDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "transparent", marginTop: 1 },
  weekNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg, marginBottom: spacing.md },
  navLabel: { fontSize: 14, color: colors.muted },
  dayNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  dayNavLabel: { fontSize: 16, fontWeight: "600", color: colors.onSurface },
  dayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  dayHeaderText: { fontSize: 15, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.3 },
  addForDay: { flexDirection: "row", alignItems: "center", gap: 2 },
  addForDayText: { fontSize: 15, color: colors.brandPrimary, fontWeight: "500" },
  emptyDay: { alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyDayText: { fontSize: 15, color: colors.muted },
}));
