import React from "react";
import { Pressable, Text } from "react-native";

import { makeStyles, radius, spacing } from "@/src/theme";

export function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
    >
      <Text style={[styles.label, selected ? styles.labelOn : styles.labelOff]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  chip: {
    height: 36,
    flexShrink: 0,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  chipOn: { backgroundColor: colors.onSurface, borderColor: colors.onSurface },
  chipOff: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
  label: { fontSize: 14, fontWeight: "500" },
  labelOn: { color: colors.surface },
  labelOff: { color: colors.onSurfaceSecondary },
}));
