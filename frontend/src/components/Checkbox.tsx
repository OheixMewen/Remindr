import React from "react";
import { Pressable, View } from "react-native";

import type { Priority } from "@/src/types";
import { priorityColor } from "@/src/lib/priority";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon } from "@/src/components/Icon";

export function Checkbox({
  checked,
  priority,
  onPress,
  testID,
}: {
  checked: boolean;
  priority: Priority;
  onPress: () => void;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const ring = priorityColor(colors, priority);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      testID={testID}
      style={styles.hit}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }
            : { borderColor: ring },
        ]}
      >
        {checked ? <Icon name="checkmark" size={16} color={colors.onBrandPrimary} /> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  hit: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
}));
