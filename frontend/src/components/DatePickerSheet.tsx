import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { addMonths } from "date-fns";

import { makeStyles, radius, spacing } from "@/src/theme";
import { Sheet } from "@/src/components/Sheet";
import { MonthGrid } from "@/src/components/MonthGrid";
import { parseISODate, todayISO, tomorrowISO } from "@/src/lib/dates";

export function DatePickerSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: string;
  onChange: (iso: string) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const [month, setMonth] = useState<Date>(parseISODate(value || todayISO()));

  useEffect(() => {
    if (visible) setMonth(parseISODate(value || todayISO()));
  }, [visible, value]);

  const quick = [
    { label: "Aujourd'hui", iso: todayISO() },
    { label: "Demain", iso: tomorrowISO() },
  ];

  const select = (iso: string) => {
    onChange(iso);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Choisir une date" testID="date-picker-sheet">
      <View style={styles.quickRow}>
        {quick.map((q) => (
          <Pressable
            key={q.iso}
            onPress={() => select(q.iso)}
            style={[styles.quick, value === q.iso && styles.quickOn]}
            testID={`date-quick-${q.label}`}
          >
            <Text style={[styles.quickText, value === q.iso && styles.quickTextOn]}>{q.label}</Text>
          </Pressable>
        ))}
      </View>
      <MonthGrid
        month={month}
        onPrev={() => setMonth((m) => addMonths(m, -1))}
        onNext={() => setMonth((m) => addMonths(m, 1))}
        selectedISO={value}
        onSelect={select}
      />
    </Sheet>
  );
}

const useStyles = makeStyles((colors) => ({
  quickRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  quick: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickOn: { backgroundColor: colors.brandPrimary },
  quickText: { fontSize: 15, fontWeight: "600", color: colors.onSurfaceSecondary },
  quickTextOn: { color: colors.onBrandPrimary },
}));
