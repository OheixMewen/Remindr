import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import type { Occurrence } from "@/src/types";
import { useTasks } from "@/src/store/TaskContext";
import { buildTodayGroups } from "@/src/lib/selectors";
import { capitalize, todayISO } from "@/src/lib/dates";
import { haptic } from "@/src/lib/haptics";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { Section } from "@/src/components/Section";
import { TaskRow } from "@/src/components/TaskRow";
import { SwipeableRow } from "@/src/components/SwipeableRow";
import { EmptyState } from "@/src/components/EmptyState";
import { Fab } from "@/src/components/Fab";
import { useToast } from "@/src/components/ToastProvider";
import { makeStyles, spacing, useTheme } from "@/src/theme";

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { tasks, toggleComplete, postponeOccurrence, deleteOccurrence } = useTasks();

  const groups = useMemo(() => buildTodayGroups(tasks), [tasks]);

  const dateTitle = capitalize(format(new Date(), "EEEE d MMMM", { locale: fr }));
  const activeToday = groups.todayCount;
  const summary =
    activeToday === 0
      ? groups.overdue.length > 0
        ? `${groups.overdue.length} en retard`
        : "Rien de prévu aujourd'hui"
      : `${activeToday} tâche${activeToday > 1 ? "s" : ""} aujourd'hui` +
        (groups.overdue.length ? ` · ${groups.overdue.length} en retard` : "");

  const openTask = (o: Occurrence) =>
    router.push({ pathname: "/task/[id]", params: { id: o.taskId, d: o.originalDate } });

  const onToggle = (o: Occurrence) => {
    haptic.success();
    toggleComplete(o);
  };

  const onPostpone = (o: Occurrence) => {
    haptic.light();
    postponeOccurrence(o);
    toast("Reporté à demain");
  };

  const onDelete = (o: Occurrence) => {
    haptic.warning();
    deleteOccurrence(o);
    toast("Tâche supprimée", "info");
  };

  const isEmpty =
    groups.overdue.length === 0 &&
    groups.today.length === 0 &&
    groups.later.length === 0 &&
    groups.completedToday.length === 0;

  const renderRow = (o: Occurrence, opts: { showDate?: boolean; overdue?: boolean }) => (
    <SwipeableRow
      key={o.key}
      rightActions={[
        { label: "Demain", icon: "arrow-forward", color: colors.warning, onPress: () => onPostpone(o) },
        { label: "Suppr.", icon: "trash", color: colors.error, onPress: () => onDelete(o) },
      ]}
    >
      <TaskRow
        occ={o}
        onToggle={() => onToggle(o)}
        onPress={() => openTask(o)}
        showDate={opts.showDate}
        overdue={opts.overdue}
      />
    </SwipeableRow>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title={dateTitle} subtitle={summary} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID="home-scroll"
      >
        {isEmpty ? (
          <EmptyState
            icon="sparkles-outline"
            title="Rien à faire pour l'instant"
            subtitle="Ajoutez votre première tâche pour commencer à vous organiser."
            ctaLabel="Ajouter une tâche"
            onCta={() => router.push({ pathname: "/task/new", params: { date: todayISO() } })}
            testID="home-empty"
          />
        ) : (
          <>
            {groups.overdue.length > 0 ? (
              <Section title={`En retard · ${groups.overdue.length}`} testID="section-overdue">
                {groups.overdue.map((o) => renderRow(o, { showDate: true, overdue: true }))}
              </Section>
            ) : null}

            <Section title="Aujourd'hui" testID="section-today">
              {groups.today.length > 0 ? (
                groups.today.map((o) => renderRow(o, {}))
              ) : (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyRowText}>Aucune tâche aujourd&apos;hui</Text>
                </View>
              )}
            </Section>

            {groups.later.length > 0 ? (
              <Section title="Plus tard" testID="section-later">
                {groups.later.map((o) => renderRow(o, { showDate: true }))}
              </Section>
            ) : null}

            {groups.completedToday.length > 0 ? (
              <Section title={`Terminées aujourd'hui · ${groups.completedToday.length}`} testID="section-done">
                {groups.completedToday.map((o) => (
                  <TaskRow key={o.key} occ={o} onToggle={() => onToggle(o)} onPress={() => openTask(o)} />
                ))}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
      <Fab onPress={() => router.push({ pathname: "/task/new", params: { date: todayISO() } })} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  emptyRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  emptyRowText: { color: colors.muted, fontSize: 15 },
}));
