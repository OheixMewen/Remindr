import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Priority, ThemeMode } from "@/src/types";
import { useSettings } from "@/src/store/SettingsContext";
import { useTasks } from "@/src/store/TaskContext";
import { PRIORITIES, PRIORITY_LABELS, priorityColor } from "@/src/lib/priority";
import { REMINDER_PRESETS, offsetLabel, prepareNotifications } from "@/src/lib/notifications";
import { formatTime } from "@/src/lib/dates";
import { haptic } from "@/src/lib/haptics";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { Section } from "@/src/components/Section";
import { FormRow } from "@/src/components/FormRow";
import { SegmentedControl } from "@/src/components/SegmentedControl";
import { Sheet } from "@/src/components/Sheet";
import { Button } from "@/src/components/Button";
import { Icon } from "@/src/components/Icon";
import { TimePickerSheet } from "@/src/components/TimePickerSheet";
import { useToast } from "@/src/components/ToastProvider";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function SettingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const { settings, updateSettings } = useSettings();
  const { exportTasks, importTasks, clearAllData, resyncAllNotifications } = useTasks();

  const [reminderSheet, setReminderSheet] = useState(false);
  const [prioritySheet, setPrioritySheet] = useState(false);
  const [timeSheet, setTimeSheet] = useState(false);
  const [exportSheet, setExportSheet] = useState(false);
  const [importSheet, setImportSheet] = useState(false);
  const [clearSheet, setClearSheet] = useState(false);
  const [importText, setImportText] = useState("");

  const toggleNotifications = async (value: boolean) => {
    updateSettings({ notificationsEnabled: value });
    if (value) {
      const state = await prepareNotifications();
      if (state === "granted") {
        resyncAllNotifications();
        toast("Notifications activées");
      } else if (state === "unsupported") {
        toast("Non disponible sur le web", "info");
      } else {
        toast("Autorisez les notifications dans les réglages", "info");
      }
    }
  };

  const defaultReminderLabel =
    settings.defaultReminderOffset == null ? "Aucun" : offsetLabel(settings.defaultReminderOffset);

  const doExport = async () => {
    const json = exportTasks();
    if (Platform.OS === "web") {
      setExportSheet(true);
    } else {
      try {
        await Share.share({ message: json });
      } catch {
        setExportSheet(true);
      }
    }
  };

  const doImport = () => {
    if (importTasks(importText)) {
      setImportSheet(false);
      setImportText("");
      resyncAllNotifications();
      toast("Tâches importées");
    } else {
      toast("Format invalide", "error");
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Réglages" large={false} />
      <View style={styles.scrollWrap}>
        <ScrollBody>
          <Section title="Notifications" footer="Les rappels s'affichent à l'heure prévue de chaque tâche.">
            <FormRow
              icon="notifications"
              iconColor={colors.brandPrimary}
              label="Notifications"
              toggle={settings.notificationsEnabled}
              onToggle={toggleNotifications}
              testID="set-notifications"
            />
            <FormRow
              icon="alarm-outline"
              label="Rappel par défaut"
              value={defaultReminderLabel}
              onPress={() => setReminderSheet(true)}
              testID="set-default-reminder"
            />
            <FormRow
              icon="volume-high-outline"
              label="Son"
              toggle={settings.soundEnabled}
              onToggle={(v) => updateSettings({ soundEnabled: v })}
              testID="set-sound"
            />
            <FormRow
              icon="warning-outline"
              label="Rappels des tâches en retard"
              toggle={settings.overdueNotifications}
              onToggle={(v) => updateSettings({ overdueNotifications: v })}
              testID="set-overdue"
            />
          </Section>

          <Section title="Apparence">
            <View style={styles.themeRow}>
              <SegmentedControl<ThemeMode>
                options={[
                  { label: "Clair", value: "light" },
                  { label: "Sombre", value: "dark" },
                  { label: "Auto", value: "auto" },
                ]}
                value={settings.theme}
                onChange={(v) => {
                  haptic.selection();
                  updateSettings({ theme: v });
                }}
                testID="set-theme"
              />
            </View>
          </Section>

          <Section title="Tâches">
            <FormRow
              icon="flag-outline"
              iconColor={priorityColor(colors, settings.defaultPriority)}
              label="Priorité par défaut"
              value={PRIORITY_LABELS[settings.defaultPriority]}
              onPress={() => setPrioritySheet(true)}
              testID="set-default-priority"
            />
            <FormRow
              icon="time-outline"
              label="Heure par défaut"
              value={settings.defaultTime ? formatTime(settings.defaultTime) : "Aucune"}
              onPress={() => setTimeSheet(true)}
              testID="set-default-time"
            />
          </Section>

          <Section title="Données">
            <FormRow icon="download-outline" label="Exporter mes tâches" onPress={doExport} testID="set-export" />
            <FormRow icon="cloud-upload-outline" label="Importer des tâches" onPress={() => setImportSheet(true)} testID="set-import" />
            <FormRow icon="trash-outline" label="Supprimer toutes les données" destructive onPress={() => setClearSheet(true)} testID="set-clear" />
          </Section>

          <Text style={styles.version}>Rappels · Vos tâches, en toute simplicité</Text>
        </ScrollBody>
      </View>

      {/* Default reminder */}
      <Sheet visible={reminderSheet} onClose={() => setReminderSheet(false)} title="Rappel par défaut">
        <View style={styles.optGroup}>
          <OptionRow
            label="Aucun"
            selected={settings.defaultReminderOffset == null}
            onPress={() => {
              updateSettings({ defaultReminderOffset: null });
              setReminderSheet(false);
            }}
          />
          {REMINDER_PRESETS.map((p) => (
            <OptionRow
              key={p.offsetMinutes}
              label={p.label}
              selected={settings.defaultReminderOffset === p.offsetMinutes}
              onPress={() => {
                updateSettings({ defaultReminderOffset: p.offsetMinutes });
                setReminderSheet(false);
              }}
            />
          ))}
        </View>
      </Sheet>

      {/* Default priority */}
      <Sheet visible={prioritySheet} onClose={() => setPrioritySheet(false)} title="Priorité par défaut">
        <View style={styles.optGroup}>
          {PRIORITIES.map((p) => (
            <OptionRow
              key={p}
              label={PRIORITY_LABELS[p]}
              dotColor={priorityColor(colors, p)}
              selected={settings.defaultPriority === p}
              onPress={() => {
                updateSettings({ defaultPriority: p });
                setPrioritySheet(false);
              }}
            />
          ))}
        </View>
      </Sheet>

      <TimePickerSheet
        visible={timeSheet}
        value={settings.defaultTime}
        onChange={(t) => updateSettings({ defaultTime: t })}
        onClose={() => setTimeSheet(false)}
      />

      {/* Export */}
      <Sheet visible={exportSheet} onClose={() => setExportSheet(false)} title="Exporter">
        <Text style={styles.hint}>Copiez ce texte pour sauvegarder vos tâches.</Text>
        <TextInput value={exportTasks()} multiline editable={false} style={styles.jsonBox} testID="export-json" />
      </Sheet>

      {/* Import */}
      <Sheet visible={importSheet} onClose={() => setImportSheet(false)} title="Importer">
        <Text style={styles.hint}>Collez ci-dessous un export de tâches (JSON).</Text>
        <TextInput
          value={importText}
          onChangeText={setImportText}
          multiline
          placeholder="[ ... ]"
          placeholderTextColor={colors.muted}
          style={styles.jsonBox}
          testID="import-json"
        />
        <View style={{ marginTop: spacing.md }}>
          <Button label="Importer" onPress={doImport} disabled={!importText.trim()} testID="import-confirm" />
        </View>
      </Sheet>

      {/* Clear all */}
      <Sheet visible={clearSheet} onClose={() => setClearSheet(false)} title="Tout supprimer">
        <Text style={styles.hint}>Toutes vos tâches seront définitivement supprimées. Cette action est irréversible.</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            label="Supprimer toutes les données"
            variant="danger"
            icon="trash"
            onPress={() => {
              clearAllData();
              setClearSheet(false);
              toast("Toutes les données supprimées", "info");
            }}
            testID="clear-confirm"
          />
          <Button label="Annuler" variant="ghost" onPress={() => setClearSheet(false)} testID="clear-cancel" />
        </View>
      </Sheet>
    </View>
  );
}

function ScrollBody({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.bodyInner, { paddingBottom: insets.bottom + spacing.xxl }]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
  dotColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  dotColor?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable style={styles.optRow} onPress={onPress} testID={`opt-${label}`}>
      {dotColor ? <View style={[styles.optDot, { backgroundColor: dotColor }]} /> : null}
      <Text style={styles.optLabel}>{label}</Text>
      {selected ? <Icon name="checkmark" size={20} color={colors.brandPrimary} /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollWrap: { flex: 1 },
  body: { flex: 1 },
  bodyInner: { padding: spacing.lg },
  themeRow: { padding: spacing.md },
  version: { textAlign: "center", color: colors.muted, fontSize: 13, marginTop: spacing.sm },
  optGroup: { backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, overflow: "hidden" },
  optRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, minHeight: 50 },
  optDot: { width: 10, height: 10, borderRadius: 5 },
  optLabel: { flex: 1, fontSize: 16, color: colors.onSurfaceSecondary },
  hint: { fontSize: 15, color: colors.muted, marginBottom: spacing.md, lineHeight: 21 },
  jsonBox: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 160,
    maxHeight: 300,
    color: colors.onSurfaceSecondary,
    fontSize: 12,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    textAlignVertical: "top",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
}));
