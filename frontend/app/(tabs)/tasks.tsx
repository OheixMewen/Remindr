import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Occurrence } from "@/src/types";
import { useTasks } from "@/src/store/TaskContext";
import { expandOccurrences, completedOccurrences } from "@/src/lib/recurrence";
import { windowRange, sortByTime } from "@/src/lib/selectors";
import { isThisWeekISO, todayISO } from "@/src/lib/dates";
import { haptic } from "@/src/lib/haptics";
import { Chip } from "@/src/components/Chip";
import { Section } from "@/src/components/Section";
import { TaskRow } from "@/src/components/TaskRow";
import { SwipeableRow } from "@/src/components/SwipeableRow";
import { EmptyState } from "@/src/components/EmptyState";
import { Icon } from "@/src/components/Icon";
import { Fab } from "@/src/components/Fab";
import { useToast } from "@/src/components/ToastProvider";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type FilterKey =
  | "todo"
  | "done"
  | "overdue"
  | "today"
  | "week"
  | "urgent"
  | "high"
  | "recurring";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "todo", label: "À faire" },
  { key: "done", label: "Terminées" },
  { key: "overdue", label: "En retard" },
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "urgent", label: "Urgente" },
  { key: "high", label: "Importante" },
  { key: "recurring", label: "Récurrentes" },
];

export default function TasksScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { tasks, toggleComplete, postponeOccurrence, deleteOccurrence } = useTasks();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<FilterKey>>(new Set());

  const pool = useMemo(() => {
    const { start, end } = windowRange();
    const map = new Map<string, Occurrence>();
    for (const o of expandOccurrences(tasks, start, end)) map.set(o.key, o);
    for (const o of completedOccurrences(tasks)) map.set(o.key, o);
    return Array.from(map.values());
  }, [tasks]);

  const results = useMemo(() => {
    const t = todayISO();
    const q = query.trim().toLowerCase();
    let list = pool.filter((o) => {
      if (q && !o.title.toLowerCase().includes(q)) return false;
      for (const f of active) {
        if (f === "todo" && o.completed) return false;
        if (f === "done" && !o.completed) return false;
        if (f === "overdue" && !(!o.completed && o.date < t)) return false;
        if (f === "today" && o.date !== t) return false;
        if (f === "week" && !isThisWeekISO(o.date)) return false;
        if (f === "urgent" && o.priority !== "urgent") return false;
        if (f === "high" && o.priority !== "high") return false;
        if (f === "recurring" && !o.isRecurring) return false;
      }
      return true;
    });
    list = list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.completed) return b.date.localeCompare(a.date);
      return sortByTime(a, b);
    });
    return list;
  }, [pool, query, active]);

  const toggleFilter = (key: FilterKey) => {
    haptic.light();
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
        showDate
        overdue={!o.completed && o.date < todayISO()}
      />
    </SwipeableRow>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Toutes les tâches</Text>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une tâche"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            testID="search-input"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8} testID="search-clear">
              <Icon name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip label="Toutes" selected={active.size === 0} onPress={() => setActive(new Set())} testID="filter-all" />
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              selected={active.has(f.key)}
              onPress={() => toggleFilter(f.key)}
              testID={`filter-${f.key}`}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {results.length > 0 ? (
          <>
            <Text style={styles.count} testID="results-count">
              {results.length} tâche{results.length > 1 ? "s" : ""}
            </Text>
            <Section>{results.map(renderRow)}</Section>
          </>
        ) : (
          <EmptyState
            icon="search-outline"
            title="Aucune tâche trouvée"
            subtitle="Essayez un autre mot-clé ou modifiez les filtres."
            testID="tasks-empty"
          />
        )}
      </ScrollView>

      <Fab onPress={() => router.push({ pathname: "/task/new", params: { date: todayISO() } })} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.onSurface, paddingHorizontal: spacing.lg, letterSpacing: -0.5 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.onSurface,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  chipRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  count: { fontSize: 13, color: colors.muted, marginBottom: spacing.sm, marginLeft: spacing.xs },
}));
