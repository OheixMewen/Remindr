import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Recurrence, RecurrenceFreq } from "@/src/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Sheet } from "@/src/components/Sheet";
import { Button } from "@/src/components/Button";
import { Icon } from "@/src/components/Icon";
import { DatePickerSheet } from "@/src/components/DatePickerSheet";
import { parseISODate, relativeDateLabel, WEEKDAY_SHORT } from "@/src/lib/dates";

type Kind = "none" | "daily" | "weekly" | "monthly";

const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

export function RecurrenceSheet({
  visible,
  recurrence,
  endDate,
  anchorDate,
  onClose,
  onSave,
}: {
  visible: boolean;
  recurrence: Recurrence | null;
  endDate: string | null;
  anchorDate: string;
  onClose: () => void;
  onSave: (rec: Recurrence | null, endDate: string | null) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const [kind, setKind] = useState<Kind>("none");
  const [interval, setInterval] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [monthMode, setMonthMode] = useState<"day" | "last">("day");
  const [end, setEnd] = useState<string | null>(null);
  const [endPicker, setEndPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const anchorDay = parseISODate(anchorDate).getDay();
    if (!recurrence) {
      setKind("none");
      setInterval(1);
      setWeekdays([anchorDay]);
      setWeekdaysOnly(false);
      setMonthMode("day");
    } else {
      setKind(recurrence.freq as Kind);
      setInterval(recurrence.interval || 1);
      setWeekdays(recurrence.weekdays && recurrence.weekdays.length ? recurrence.weekdays : [anchorDay]);
      setWeekdaysOnly(!!recurrence.weekdaysOnly);
      setMonthMode(recurrence.monthDay === "last" ? "last" : "day");
    }
    setEnd(endDate);
  }, [visible, recurrence, endDate, anchorDate]);

  const toggleWeekday = (d: number) => {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const save = () => {
    let rec: Recurrence | null = null;
    if (kind === "daily") {
      rec = { freq: "daily", interval, weekdaysOnly };
    } else if (kind === "weekly") {
      rec = { freq: "weekly", interval, weekdays: weekdays.length ? weekdays : [parseISODate(anchorDate).getDay()] };
    } else if (kind === "monthly") {
      rec = {
        freq: "monthly",
        interval,
        monthDay: monthMode === "last" ? "last" : parseISODate(anchorDate).getDate(),
      };
    }
    onSave(rec, rec ? end : null);
    onClose();
  };

  const kinds: { value: Kind; label: string }[] = [
    { value: "none", label: "Ponctuelle (aucune)" },
    { value: "daily", label: "Quotidienne" },
    { value: "weekly", label: "Hebdomadaire" },
    { value: "monthly", label: "Mensuelle" },
  ];

  return (
    <Sheet visible={visible} onClose={onClose} title="Répétition" testID="recurrence-sheet">
      <View style={styles.group}>
        {kinds.map((k, i) => (
          <View key={k.value}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <Pressable style={styles.optionRow} onPress={() => setKind(k.value)} testID={`rec-${k.value}`}>
              <Text style={styles.optionLabel}>{k.label}</Text>
              {kind === k.value ? <Icon name="checkmark" size={20} color={colors.brandPrimary} /> : null}
            </Pressable>
          </View>
        ))}
      </View>

      {kind !== "none" ? (
        <View style={styles.detailBlock}>
          <Stepper
            label={
              kind === "daily"
                ? "Tous les X jours"
                : kind === "weekly"
                  ? "Toutes les X semaines"
                  : "Tous les X mois"
            }
            value={interval}
            min={1}
            onChange={setInterval}
          />

          {kind === "daily" ? (
            <Pressable
              style={styles.toggleRow}
              onPress={() => setWeekdaysOnly((v) => !v)}
              testID="rec-weekdays-only"
            >
              <Text style={styles.optionLabel}>Jours ouvrés uniquement</Text>
              <View style={[styles.checkBox, weekdaysOnly && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}>
                {weekdaysOnly ? <Icon name="checkmark" size={14} color={colors.onBrandPrimary} /> : null}
              </View>
            </Pressable>
          ) : null}

          {kind === "weekly" ? (
            <View style={styles.weekdays}>
              {MON_FIRST.map((d) => {
                const on = weekdays.includes(d);
                return (
                  <Pressable
                    key={d}
                    onPress={() => toggleWeekday(d)}
                    style={[styles.wdBtn, on && styles.wdBtnOn]}
                    testID={`wd-${d}`}
                  >
                    <Text style={[styles.wdText, on && styles.wdTextOn]}>{WEEKDAY_SHORT[d]}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {kind === "monthly" ? (
            <View style={styles.monthModes}>
              <Pressable
                style={[styles.modeBtn, monthMode === "day" && styles.modeBtnOn]}
                onPress={() => setMonthMode("day")}
                testID="month-mode-day"
              >
                <Text style={[styles.modeText, monthMode === "day" && styles.modeTextOn]}>
                  Le {parseISODate(anchorDate).getDate()} du mois
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeBtn, monthMode === "last" && styles.modeBtnOn]}
                onPress={() => setMonthMode("last")}
                testID="month-mode-last"
              >
                <Text style={[styles.modeText, monthMode === "last" && styles.modeTextOn]}>
                  Le dernier jour
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable style={styles.endRow} onPress={() => (end ? setEnd(null) : setEndPicker(true))} testID="rec-end">
            <Text style={styles.optionLabel}>Fin de récurrence</Text>
            <Text style={styles.endValue}>{end ? relativeDateLabel(end) : "Aucune"}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Enregistrer" onPress={save} testID="rec-save" />
      </View>

      <DatePickerSheet
        visible={endPicker}
        value={end ?? anchorDate}
        onChange={setEnd}
        onClose={() => setEndPicker(false)}
      />
    </Sheet>
  );
}

function Stepper({
  label,
  value,
  min = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.stepper}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.stepperCtrl}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.stepBtn}
          testID="stepper-minus"
        >
          <Icon name="remove" size={18} color={colors.onSurfaceSecondary} />
        </Pressable>
        <Text style={styles.stepValue} testID="stepper-value">
          {value}
        </Text>
        <Pressable onPress={() => onChange(value + 1)} style={styles.stepBtn} testID="stepper-plus">
          <Icon name="add" size={18} color={colors.onSurfaceSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  group: { backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, overflow: "hidden" },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  optionLabel: { fontSize: 16, color: colors.onSurfaceSecondary },
  detailBlock: { marginTop: spacing.lg, gap: spacing.md },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepperCtrl: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.xs },
  stepBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepValue: { fontSize: 17, fontWeight: "600", color: colors.onSurfaceSecondary, minWidth: 24, textAlign: "center" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  weekdays: { flexDirection: "row", justifyContent: "space-between", gap: spacing.xs },
  wdBtn: { flex: 1, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  wdBtnOn: { backgroundColor: colors.brandPrimary },
  wdText: { fontSize: 13, fontWeight: "600", color: colors.onSurfaceSecondary },
  wdTextOn: { color: colors.onBrandPrimary },
  monthModes: { gap: spacing.sm },
  modeBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  modeBtnOn: { backgroundColor: colors.brandTertiary },
  modeText: { fontSize: 15, color: colors.onSurfaceSecondary },
  modeTextOn: { color: colors.brandPrimary, fontWeight: "600" },
  endRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  endValue: { fontSize: 15, color: colors.muted },
}));
