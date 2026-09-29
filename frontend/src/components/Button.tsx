import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Icon, type IconName } from "@/src/components/Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: any;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const bg = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
  }[variant];
  const txt = {
    primary: colors.onBrandPrimary,
    secondary: colors.onSurfaceSecondary,
    ghost: colors.brandPrimary,
    danger: colors.error,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        bg,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txt} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={txt} /> : null}
          <Text style={[styles.label, { color: txt }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  primary: { backgroundColor: colors.brandPrimary },
  secondary: { backgroundColor: colors.surfaceTertiary },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.brandTertiary },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  label: { fontSize: 16, fontWeight: "600" },
}));
