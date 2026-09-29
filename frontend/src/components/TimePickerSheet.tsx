import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { makeStyles, radius, spacing } from "@/src/theme";
import { Sheet } from "@/src/components/Sheet";
import { Button } from "@/src/components/Button";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const ITEM_H = 44;

export function TimePickerSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: string | null;
  onChange: (time: string | null) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const [h, setH] = useState(9);
  const [m, setM] = useState(0);

  useEffect(() => {
    if (visible) {
      if (value) {
        const [hh, mm] = value.split(":").map((n) => parseInt(n, 10));
        setH(hh);
        setM(mm);
      } else {
        setH(9);
        setM(0);
      }
    }
  }, [visible, value]);

  const confirm = () => {
    onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Choisir une heure" scroll={false} testID="time-picker-sheet">
      <View style={styles.columns}>
        <Column data={HOURS} selected={h} onSelect={setH} label="Heure" />
        <Text style={styles.colon}>:</Text>
        <Column data={MINUTES} selected={m} onSelect={setM} label="Minute" pad />
      </View>
      <View style={styles.actions}>
        <Button
          label="Pas d'heure"
          variant="secondary"
          onPress={() => {
            onChange(null);
            onClose();
          }}
          testID="time-none"
          style={{ flex: 1 }}
        />
        <Button label="Valider" onPress={confirm} testID="time-confirm" style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

function Column({
  data,
  selected,
  onSelect,
  label,
  pad,
}: {
  data: number[];
  selected: number;
  onSelect: (n: number) => void;
  label: string;
  pad?: boolean;
}) {
  const styles = useStyles();
  const ref = React.useRef<ScrollView>(null);
  useEffect(() => {
    const idx = data.indexOf(selected);
    if (idx >= 0) ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.column}>
      <Text style={styles.colLabel}>{label}</Text>
      <ScrollView
        ref={ref}
        style={styles.colScroll}
        contentContainerStyle={styles.colContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
      >
        {data.map((n) => {
          const on = n === selected;
          return (
            <Pressable
              key={n}
              onPress={() => onSelect(n)}
              style={[styles.item, on && styles.itemOn]}
              testID={`${label}-${n}`}
            >
              <Text style={[styles.itemText, on && styles.itemTextOn]}>
                {pad ? String(n).padStart(2, "0") : n}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  columns: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.md },
  colon: { fontSize: 28, fontWeight: "300", color: colors.muted, marginTop: 20 },
  column: { alignItems: "center", width: 90 },
  colLabel: { fontSize: 12, color: colors.muted, marginBottom: spacing.xs, textTransform: "uppercase" },
  colScroll: { height: ITEM_H * 5, width: 84 },
  colContent: { paddingVertical: ITEM_H * 2 },
  item: { height: ITEM_H, alignItems: "center", justifyContent: "center", borderRadius: radius.md },
  itemOn: { backgroundColor: colors.brandTertiary },
  itemText: { fontSize: 22, color: colors.muted, fontWeight: "400" },
  itemTextOn: { color: colors.brandPrimary, fontWeight: "700" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
}));
