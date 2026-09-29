import React from "react";
import { Pressable, Text, View } from "react-native";

import { makeStyles, radius, spacing } from "@/src/theme";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.container} testID={testID}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, selected && styles.segmentOn]}
            testID={`${testID ?? "segment"}-${opt.value}`}
          >
            <Text style={[styles.label, selected && styles.labelOn]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm + 3,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentOn: { backgroundColor: colors.surfaceSecondary },
  label: { fontSize: 14, fontWeight: "500", color: colors.muted },
  labelOn: { color: colors.onSurfaceSecondary },
}));
