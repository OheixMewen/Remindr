import React from "react";
import { View } from "react-native";

import type { Priority } from "@/src/types";
import { priorityColor } from "@/src/lib/priority";
import { useTheme } from "@/src/theme";

export function PriorityDot({ priority, size = 10 }: { priority: Priority; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: priorityColor(colors, priority),
      }}
    />
  );
}
