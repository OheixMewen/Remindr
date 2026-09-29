import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";

import { useTheme } from "@/src/theme";

type IconProps = {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.onSurface} />;
}

export type IconName = IconProps["name"];
