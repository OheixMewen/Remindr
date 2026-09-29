import React from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { makeStyles, spacing, useTheme } from "@/src/theme";
import { Icon, type IconName } from "@/src/components/Icon";

// A generic iOS-style row: icon + label on the left, a value / control on the
// right. Used across Settings and the task form.
export function FormRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  right,
  toggle,
  onToggle,
  showChevron = true,
  destructive = false,
  testID,
}: {
  icon?: IconName;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  showChevron?: boolean;
  destructive?: boolean;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isSwitch = typeof toggle === "boolean";

  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.iconWrap, iconColor ? { backgroundColor: iconColor } : styles.iconDefault]}>
          <Icon name={icon} size={16} color={iconColor ? colors.onBrandPrimary : colors.onSurfaceSecondary} />
        </View>
      ) : null}
      <Text style={[styles.label, destructive && { color: colors.error }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.rightSide}>
        {value ? (
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {right}
        {isSwitch ? (
          <Switch
            value={toggle}
            onValueChange={onToggle}
            trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }}
            thumbColor={colors.surfaceSecondary}
            testID={testID ? `${testID}-switch` : undefined}
          />
        ) : onPress && showChevron ? (
          <Icon name="chevron-forward" size={18} color={colors.muted} />
        ) : null}
      </View>
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <Pressable onPress={onPress} testID={testID} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID}>{content}</View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceTertiary },
  iconWrap: { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  iconDefault: { backgroundColor: colors.surfaceTertiary },
  label: { flex: 1, fontSize: 16, color: colors.onSurfaceSecondary },
  rightSide: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  value: { fontSize: 15, color: colors.muted, maxWidth: 180 },
}));
