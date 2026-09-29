import React from "react";
import { Pressable, Text, View } from "react-native";

import type { Occurrence } from "@/src/types";
import { makeStyles, spacing, useTheme } from "@/src/theme";
import { Checkbox } from "@/src/components/Checkbox";
import { Icon } from "@/src/components/Icon";
import { formatTime, relativeDateLabel } from "@/src/lib/dates";

export function TaskRow({
  occ,
  onToggle,
  onPress,
  showDate = false,
  overdue = false,
}: {
  occ: Occurrence;
  onToggle: () => void;
  onPress: () => void;
  showDate?: boolean;
  overdue?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const completed = occ.completed;

  const hasReminders =
    occ.notificationsEnabled && occ.notifications.length > 0 && !!occ.time;

  const meta: React.ReactNode[] = [];
  if (occ.time) {
    meta.push(
      <Text key="time" style={styles.metaText}>
        {formatTime(occ.time)}
      </Text>,
    );
  }
  if (occ.isRecurring) {
    meta.push(<Icon key="rep" name="repeat" size={13} color={colors.muted} />);
  }
  if (hasReminders) {
    meta.push(<Icon key="bell" name="notifications-outline" size={13} color={colors.muted} />);
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      testID={`task-row-${occ.key}`}
    >
      <Checkbox
        checked={completed}
        priority={occ.priority}
        onPress={onToggle}
        testID={`task-checkbox-${occ.key}`}
      />
      <View style={styles.middle}>
        <Text
          numberOfLines={1}
          style={[styles.title, completed && styles.titleDone]}
          testID={`task-title-${occ.key}`}
        >
          {occ.title}
        </Text>
        {meta.length > 0 ? (
          <View style={styles.metaRow}>
            {meta.map((m, i) => (
              <View key={i} style={styles.metaItem}>
                {m}
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {showDate ? (
        <Text style={[styles.dateLabel, overdue && { color: colors.error }]}>
          {relativeDateLabel(occ.date)}
        </Text>
      ) : null}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.lg,
    paddingLeft: spacing.sm,
    minHeight: 56,
  },
  pressed: { backgroundColor: colors.surfaceTertiary },
  middle: { flex: 1, paddingVertical: spacing.sm, gap: 3 },
  title: { fontSize: 16, color: colors.onSurfaceSecondary, fontWeight: "400" },
  titleDone: { color: colors.muted, textDecorationLine: "line-through" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 13, color: colors.muted },
  dateLabel: { fontSize: 13, color: colors.muted, marginLeft: spacing.sm },
}));
