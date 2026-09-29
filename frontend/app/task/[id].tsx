import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { useTasks } from "@/src/store/TaskContext";
import { buildOccurrence, recurrenceSummary } from "@/src/lib/recurrence";
import { formatDateLong, formatTime, relativeDateLabel } from "@/src/lib/dates";
import { PRIORITY_LABELS, priorityColor } from "@/src/lib/priority";
import { offsetLabel } from "@/src/lib/notifications";
import { haptic } from "@/src/lib/haptics";
import { Icon } from "@/src/components/Icon";
import { Section } from "@/src/components/Section";
import { FormRow } from "@/src/components/FormRow";
import { Sheet } from "@/src/components/Sheet";
import { Button } from "@/src/components/Button";
import { useToast } from "@/src/components/ToastProvider";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function TaskDetailScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id: string; d?: string }>();
  const { getTask, toggleComplete, deleteTask, deleteOccurrence, duplicateTask, postponeOccurrence } =
    useTasks();

  const [editScope, setEditScope] = useState(false);
  const [deleteScope, setDeleteScope] = useState(false);

  const task = getTask(params.id);
  if (!task) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.missing}>Tâche introuvable</Text>
        <Button label="Fermer" variant="secondary" onPress={() => router.back()} testID="detail-close-missing" />
      </View>
    );
  }

  const originalDate = params.d ?? task.date;
  const occ = buildOccurrence(task, originalDate);

  const goEdit = (scope: "series" | "occurrence") => {
    setEditScope(false);
    router.push({
      pathname: "/task/new",
      params:
        scope === "occurrence"
          ? { editId: task.id, occDate: originalDate, scope: "occurrence" }
          : { editId: task.id, scope: "series" },
    });
  };

  const onModify = () => {
    if (task.recurrence) setEditScope(true);
    else goEdit("series");
  };

  const onDelete = () => {
    setDeleteScope(true);
  };

  const performDelete = (scope: "series" | "occurrence") => {
    setDeleteScope(false);
    haptic.warning();
    if (scope === "occurrence") deleteOccurrence(occ);
    else deleteTask(task.id);
    toast("Tâche supprimée", "info");
    router.back();
  };

  const onToggle = () => {
    haptic.success();
    toggleComplete(occ);
    toast(occ.completed ? "Marquée à faire" : "Tâche terminée");
  };

  const onPostpone = () => {
    haptic.light();
    postponeOccurrence(occ);
    toast("Reporté à demain");
    router.back();
  };

  const onDuplicate = () => {
    haptic.light();
    duplicateTask(task.id);
    toast("Tâche dupliquée");
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="detail-close">
          <Icon name="chevron-down" size={26} color={colors.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>Détails</Text>
        <Pressable onPress={onModify} hitSlop={10} testID="detail-edit">
          <Text style={styles.edit}>Modifier</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={[styles.bigDot, { backgroundColor: priorityColor(colors, occ.priority) }]} />
          <Text style={[styles.title, occ.completed && styles.done]} testID="detail-title">
            {occ.title}
          </Text>
        </View>
        {occ.isRecurring ? (
          <View style={styles.seriesBadge}>
            <Icon name="repeat" size={13} color={colors.brandPrimary} />
            <Text style={styles.seriesText}>Fait partie d&apos;une série récurrente</Text>
          </View>
        ) : null}

        <Section>
          <FormRow icon="calendar-outline" label="Date" value={relativeDateLabel(occ.date)} showChevron={false} />
          <FormRow icon="time-outline" label="Heure" value={occ.time ? formatTime(occ.time) : "Aucune"} showChevron={false} />
          <FormRow
            icon="flag-outline"
            iconColor={priorityColor(colors, occ.priority)}
            label="Priorité"
            value={PRIORITY_LABELS[occ.priority]}
            showChevron={false}
          />
          <FormRow icon="repeat-outline" label="Répétition" value={recurrenceSummary(task.recurrence)} showChevron={false} />
          <FormRow
            icon="notifications-outline"
            label="Rappels"
            value={
              !occ.notificationsEnabled
                ? "Désactivés"
                : occ.notifications.length
                  ? occ.notifications.map((r) => offsetLabel(r.offsetMinutes)).join(", ")
                  : "Aucun"
            }
            showChevron={false}
          />
        </Section>

        {occ.notes ? (
          <Section title="Notes">
            <View style={styles.notes}>
              <Text style={styles.notesText}>{occ.notes}</Text>
            </View>
          </Section>
        ) : null}

        <Section title="Informations">
          <FormRow
            icon="information-circle-outline"
            label="Statut"
            value={occ.completed ? "Terminée" : "À faire"}
            showChevron={false}
          />
          <FormRow
            icon="add-circle-outline"
            label="Créée le"
            value={format(new Date(task.createdAt), "d MMM yyyy", { locale: fr })}
            showChevron={false}
          />
          {occ.completed && occ.completedAt ? (
            <FormRow
              icon="checkmark-circle-outline"
              label="Terminée le"
              value={format(new Date(occ.completedAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
              showChevron={false}
            />
          ) : null}
        </Section>

        <View style={styles.actions}>
          <Button
            label={occ.completed ? "Marquer à faire" : "Marquer terminée"}
            icon={occ.completed ? "arrow-undo" : "checkmark-circle"}
            onPress={onToggle}
            testID="detail-toggle"
          />
          <View style={styles.actionRow}>
            <Button label="Reporter" icon="arrow-forward" variant="secondary" onPress={onPostpone} testID="detail-postpone" style={{ flex: 1 }} />
            <Button label="Dupliquer" icon="copy-outline" variant="secondary" onPress={onDuplicate} testID="detail-duplicate" style={{ flex: 1 }} />
          </View>
          <Button label="Supprimer" icon="trash-outline" variant="danger" onPress={onDelete} testID="detail-delete" />
        </View>

        <Text style={styles.subtitle}>{formatDateLong(occ.date)}</Text>
      </ScrollView>

      <Sheet visible={editScope} onClose={() => setEditScope(false)} title="Modifier la tâche récurrente">
        <Text style={styles.sheetHint}>Cette tâche se répète. Que souhaitez-vous modifier ?</Text>
        <View style={styles.sheetActions}>
          <Button label="Cette occurrence" icon="today-outline" onPress={() => goEdit("occurrence")} testID="edit-occurrence" />
          <Button label="Toute la série" variant="secondary" icon="repeat" onPress={() => goEdit("series")} testID="edit-series" />
        </View>
      </Sheet>

      <Sheet visible={deleteScope} onClose={() => setDeleteScope(false)} title="Supprimer la tâche">
        {task.recurrence ? (
          <>
            <Text style={styles.sheetHint}>Cette tâche se répète. Que souhaitez-vous supprimer ?</Text>
            <View style={styles.sheetActions}>
              <Button label="Cette occurrence" variant="danger" onPress={() => performDelete("occurrence")} testID="delete-occurrence" />
              <Button label="Toute la série" variant="danger" onPress={() => performDelete("series")} testID="delete-series" />
            </View>
          </>
        ) : (
          <View style={styles.sheetActions}>
            <Text style={styles.sheetHint}>Cette action est définitive.</Text>
            <Button label="Supprimer" variant="danger" icon="trash" onPress={() => performDelete("series")} testID="delete-confirm" />
            <Button label="Annuler" variant="ghost" onPress={() => setDeleteScope(false)} testID="delete-cancel" />
          </View>
        )}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.xl },
  missing: { fontSize: 17, color: colors.onSurface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: colors.onSurface },
  edit: { fontSize: 16, color: colors.brandPrimary, fontWeight: "600" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  bigDot: { width: 14, height: 14, borderRadius: 7 },
  title: { flex: 1, fontSize: 26, fontWeight: "700", color: colors.onSurface, letterSpacing: -0.4 },
  done: { color: colors.muted, textDecorationLine: "line-through" },
  seriesBadge: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.lg },
  seriesText: { fontSize: 13, color: colors.brandPrimary, fontWeight: "500" },
  notes: { padding: spacing.lg },
  notesText: { fontSize: 15, color: colors.onSurfaceSecondary, lineHeight: 22 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  subtitle: { textAlign: "center", color: colors.muted, fontSize: 13, marginTop: spacing.xl },
  sheetHint: { fontSize: 15, color: colors.muted, marginBottom: spacing.lg, lineHeight: 21 },
  sheetActions: { gap: spacing.sm },
}));
