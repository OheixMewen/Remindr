import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Priority, Recurrence, Reminder } from "@/src/types";
import { useTasks } from "@/src/store/TaskContext";
import { useSettings } from "@/src/store/SettingsContext";
import { buildOccurrence, recurrenceSummary } from "@/src/lib/recurrence";
import { formatTime, relativeDateLabel, todayISO } from "@/src/lib/dates";
import { PRIORITIES, PRIORITY_LABELS, priorityColor } from "@/src/lib/priority";
import { offsetLabel } from "@/src/lib/notifications";
import { haptic } from "@/src/lib/haptics";
import { uid } from "@/src/lib/seed";
import { FormRow } from "@/src/components/FormRow";
import { Section } from "@/src/components/Section";
import { Button } from "@/src/components/Button";
import { Icon } from "@/src/components/Icon";
import { DatePickerSheet } from "@/src/components/DatePickerSheet";
import { TimePickerSheet } from "@/src/components/TimePickerSheet";
import { RecurrenceSheet } from "@/src/components/RecurrenceSheet";
import { RemindersSheet } from "@/src/components/RemindersSheet";
import { useToast } from "@/src/components/ToastProvider";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function TaskFormScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{
    date?: string;
    editId?: string;
    occDate?: string;
    scope?: string;
  }>();
  const { getTask, addTask, updateSeries, editOccurrence } = useTasks();
  const { settings } = useSettings();

  const editTask = params.editId ? getTask(params.editId) : undefined;
  const isOccurrenceEdit = !!editTask && params.scope === "occurrence" && !!params.occDate;
  const isEdit = !!editTask;

  const initial = useMemo(() => {
    if (editTask && isOccurrenceEdit && params.occDate) {
      const occ = buildOccurrence(editTask, params.occDate);
      return {
        title: occ.title,
        notes: occ.notes ?? "",
        date: occ.date,
        time: occ.time,
        priority: occ.priority,
        recurrence: null as Recurrence | null,
        recurrenceEndDate: null as string | null,
        notifications: occ.notifications,
        notificationsEnabled: occ.notificationsEnabled,
      };
    }
    if (editTask) {
      return {
        title: editTask.title,
        notes: editTask.notes ?? "",
        date: editTask.date,
        time: editTask.time,
        priority: editTask.priority,
        recurrence: editTask.recurrence,
        recurrenceEndDate: editTask.recurrenceEndDate ?? null,
        notifications: editTask.notifications,
        notificationsEnabled: editTask.notificationsEnabled,
      };
    }
    const defaultReminders: Reminder[] =
      settings.defaultReminderOffset != null && settings.defaultTime
        ? [{ id: uid(), offsetMinutes: settings.defaultReminderOffset }]
        : [];
    return {
      title: "",
      notes: "",
      date: params.date || todayISO(),
      time: settings.defaultTime,
      priority: settings.defaultPriority,
      recurrence: null as Recurrence | null,
      recurrenceEndDate: null as string | null,
      notifications: defaultReminders,
      notificationsEnabled: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [title, setTitle] = useState(initial.title);
  const [notes, setNotes] = useState(initial.notes);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState<string | null>(initial.time);
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [recurrence, setRecurrence] = useState<Recurrence | null>(initial.recurrence);
  const [recEnd, setRecEnd] = useState<string | null>(initial.recurrenceEndDate);
  const [reminders, setReminders] = useState<Reminder[]>(initial.notifications);
  const [notifEnabled, setNotifEnabled] = useState(initial.notificationsEnabled);

  const [datePicker, setDatePicker] = useState(false);
  const [timePicker, setTimePicker] = useState(false);
  const [recPicker, setRecPicker] = useState(false);
  const [remPicker, setRemPicker] = useState(false);

  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    haptic.medium();
    if (isOccurrenceEdit && editTask && params.occDate) {
      const occ = buildOccurrence(editTask, params.occDate);
      editOccurrence(occ, {
        title: title.trim(),
        notes,
        date,
        time,
        priority,
        notifications: reminders,
        notificationsEnabled: notifEnabled,
      });
      toast("Occurrence modifiée");
    } else if (isEdit && editTask) {
      updateSeries(editTask.id, {
        title: title.trim(),
        notes,
        date,
        time,
        priority,
        recurrence,
        recurrenceEndDate: recEnd,
        notifications: reminders,
        notificationsEnabled: notifEnabled,
      });
      toast("Tâche modifiée");
    } else {
      addTask({
        title: title.trim(),
        notes,
        date,
        time,
        priority,
        recurrence,
        recurrenceEndDate: recEnd,
        notifications: reminders,
        notificationsEnabled: notifEnabled,
      });
      toast("Tâche ajoutée");
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="form-cancel">
          <Text style={styles.cancel}>Annuler</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {isOccurrenceEdit ? "Cette occurrence" : isEdit ? "Modifier" : "Nouvelle tâche"}
        </Text>
        <Pressable onPress={save} hitSlop={10} disabled={!canSave} testID="form-save">
          <Text style={[styles.save, !canSave && { color: colors.muted }]}>OK</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={20}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleCard}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Que devez-vous faire ?"
            placeholderTextColor={colors.muted}
            style={styles.titleInput}
            testID="input-title"
            autoFocus={!isEdit}
            returnKeyType="done"
          />
          <View style={styles.notesDivider} />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (facultatif)"
            placeholderTextColor={colors.muted}
            style={styles.notesInput}
            multiline
            testID="input-notes"
          />
        </View>

        <Section>
          <FormRow
            icon="calendar-outline"
            label="Date"
            value={relativeDateLabel(date)}
            onPress={() => setDatePicker(true)}
            testID="row-date"
          />
          <FormRow
            icon="time-outline"
            label="Heure"
            value={time ? formatTime(time) : "Aucune"}
            onPress={() => setTimePicker(true)}
            testID="row-time"
          />
        </Section>

        <Section title="Priorité">
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const on = priority === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    haptic.selection();
                    setPriority(p);
                  }}
                  style={[styles.priChip, on && { borderColor: priorityColor(colors, p), backgroundColor: colors.surfaceTertiary }]}
                  testID={`priority-${p}`}
                >
                  <View style={[styles.priDot, { backgroundColor: priorityColor(colors, p) }]} />
                  <Text style={[styles.priText, on && { color: colors.onSurfaceSecondary, fontWeight: "600" }]}>
                    {PRIORITY_LABELS[p]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {!isOccurrenceEdit ? (
          <Section>
            <FormRow
              icon="repeat-outline"
              label="Répétition"
              value={recurrenceSummary(recurrence)}
              onPress={() => setRecPicker(true)}
              testID="row-recurrence"
            />
          </Section>
        ) : null}

        <Section footer={!time ? "Ajoutez une heure pour activer les rappels." : undefined}>
          <FormRow
            icon="notifications-outline"
            label="Rappels"
            value={reminders.length ? reminders.map((r) => offsetLabel(r.offsetMinutes)).join(", ") : "Aucun"}
            onPress={() => setRemPicker(true)}
            testID="row-reminders"
          />
          <FormRow
            icon="notifications-off-outline"
            label="Notifications activées"
            toggle={notifEnabled}
            onToggle={setNotifEnabled}
            testID="row-notif-enabled"
          />
        </Section>

        <View style={styles.saveBtn}>
          <Button label={isEdit ? "Enregistrer" : "Ajouter la tâche"} onPress={save} disabled={!canSave} icon={isEdit ? "checkmark" : "add"} testID="form-save-button" />
        </View>
      </KeyboardAwareScrollView>

      <DatePickerSheet visible={datePicker} value={date} onChange={setDate} onClose={() => setDatePicker(false)} />
      <TimePickerSheet visible={timePicker} value={time} onChange={setTime} onClose={() => setTimePicker(false)} />
      <RecurrenceSheet
        visible={recPicker}
        recurrence={recurrence}
        endDate={recEnd}
        anchorDate={date}
        onClose={() => setRecPicker(false)}
        onSave={(rec, end) => {
          setRecurrence(rec);
          setRecEnd(end);
        }}
      />
      <RemindersSheet
        visible={remPicker}
        reminders={reminders}
        hasTime={!!time}
        onClose={() => setRemPicker(false)}
        onSave={setReminders}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cancel: { fontSize: 16, color: colors.brandPrimary },
  save: { fontSize: 16, fontWeight: "700", color: colors.brandPrimary },
  headerTitle: { fontSize: 17, fontWeight: "600", color: colors.onSurface },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  titleCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  titleInput: { fontSize: 18, color: colors.onSurfaceSecondary, paddingVertical: spacing.md, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  notesDivider: { height: 1, backgroundColor: colors.divider },
  notesInput: { fontSize: 15, color: colors.onSurfaceSecondary, paddingVertical: spacing.md, minHeight: 60, textAlignVertical: "top", ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}) },
  priorityRow: { flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  priChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  priDot: { width: 10, height: 10, borderRadius: 5 },
  priText: { fontSize: 12, color: colors.muted },
  saveBtn: { marginTop: spacing.sm },
}));
