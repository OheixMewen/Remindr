import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Reminder } from "@/src/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Sheet } from "@/src/components/Sheet";
import { Button } from "@/src/components/Button";
import { Icon } from "@/src/components/Icon";
import { REMINDER_PRESETS, offsetLabel } from "@/src/lib/notifications";
import { uid } from "@/src/lib/seed";

export function RemindersSheet({
  visible,
  reminders,
  hasTime,
  onClose,
  onSave,
}: {
  visible: boolean;
  reminders: Reminder[];
  hasTime: boolean;
  onClose: () => void;
  onSave: (reminders: Reminder[]) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [offsets, setOffsets] = useState<number[]>([]);
  const [custom, setCustom] = useState(45);

  useEffect(() => {
    if (visible) setOffsets(reminders.map((r) => r.offsetMinutes));
  }, [visible, reminders]);

  const toggle = (o: number) => {
    setOffsets((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  };

  const save = () => {
    const uniq = Array.from(new Set(offsets)).sort((a, b) => a - b);
    onSave(uniq.map((o) => ({ id: uid(), offsetMinutes: o } as Reminder)));
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Rappels" testID="reminders-sheet">
      {!hasTime ? (
        <Text style={styles.warn}>Définissez d&apos;abord une heure pour ajouter des rappels.</Text>
      ) : null}
      <View style={styles.group}>
        {REMINDER_PRESETS.map((p, i) => {
          const on = offsets.includes(p.offsetMinutes);
          return (
            <View key={p.offsetMinutes}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={styles.row}
                onPress={() => toggle(p.offsetMinutes)}
                disabled={!hasTime}
                testID={`reminder-${p.offsetMinutes}`}
              >
                <Text style={[styles.label, !hasTime && { color: colors.muted }]}>{p.label}</Text>
                <View style={[styles.check, on && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}>
                  {on ? <Icon name="checkmark" size={14} color={colors.onBrandPrimary} /> : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={styles.customTitle}>Personnalisé</Text>
      <View style={styles.customRow}>
        <Pressable onPress={() => setCustom((v) => Math.max(5, v - 5))} style={styles.stepBtn} testID="custom-minus">
          <Icon name="remove" size={18} color={colors.onSurfaceSecondary} />
        </Pressable>
        <Text style={styles.customVal}>{offsetLabel(custom)}</Text>
        <Pressable onPress={() => setCustom((v) => v + 5)} style={styles.stepBtn} testID="custom-plus">
          <Icon name="add" size={18} color={colors.onSurfaceSecondary} />
        </Pressable>
        <Button
          label="Ajouter"
          variant="secondary"
          onPress={() => hasTime && toggle(custom)}
          disabled={!hasTime}
          testID="custom-add"
          style={{ flex: 1 }}
        />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Enregistrer" onPress={save} testID="reminders-save" />
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((colors) => ({
  warn: { color: colors.warning, fontSize: 14, marginBottom: spacing.md },
  group: { backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, overflow: "hidden" },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, minHeight: 48 },
  label: { fontSize: 16, color: colors.onSurfaceSecondary },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  customTitle: { fontSize: 13, fontWeight: "600", color: colors.muted, textTransform: "uppercase", marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  customRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  customVal: { fontSize: 15, color: colors.onSurfaceSecondary, minWidth: 96, textAlign: "center" },
}));
