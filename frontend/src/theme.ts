// Design tokens for this app. Dark-first with full light theme.
// Keys match the "color" block of /app/design_guidelines.json.
// Build sheets with makeStyles((colors) => ({...})); read useTheme().colors
// for non-style color props. Never write color literals in components.

import { useEffect, useMemo, useReducer } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F2F2F7",
  onSurface: "#000000",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1C1C1E",
  surfaceTertiary: "#E5E5EA",
  onSurfaceTertiary: "#1C1C1E",
  surfaceInverse: "#1C1C1E",
  onSurfaceInverse: "#FFFFFF",
  muted: "#8E8E93",

  brand: "#FF3B30",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF3B30",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#8E8E93",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FF3B3015",
  onBrandTertiary: "#FF3B30",

  success: "#34C759",
  onSuccess: "#FFFFFF",
  warning: "#FF9F0A",
  onWarning: "#FFFFFF",
  error: "#FF3B30",
  onError: "#FFFFFF",
  info: "#8E8E93",
  onInfo: "#FFFFFF",

  border: "#C6C6C8",
  borderStrong: "#AEAEB2",
  divider: "#D8D8DC",

  priorityLow: "#34C759",
  priorityNormal: "#8E8E93",
  priorityHigh: "#FF9F0A",
  priorityUrgent: "#FF3B30",

  overlay: "#00000055",
  glass: "#FFFFFFCC",
};

const dark: typeof light = {
  surface: "#000000",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#1C1C1E",
  onSurfaceSecondary: "#F2F2F7",
  surfaceTertiary: "#2C2C2E",
  onSurfaceTertiary: "#E5E5EA",
  surfaceInverse: "#F2F2F7",
  onSurfaceInverse: "#000000",
  muted: "#8E8E93",

  brand: "#FF453A",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF453A",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#3A3A3C",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FF453A22",
  onBrandTertiary: "#FF453A",

  success: "#32D74B",
  onSuccess: "#000000",
  warning: "#FF9F0A",
  onWarning: "#000000",
  error: "#FF453A",
  onError: "#000000",
  info: "#8E8E93",
  onInfo: "#000000",

  border: "#38383A",
  borderStrong: "#48484A",
  divider: "#2C2C2E",

  priorityLow: "#32D74B",
  priorityNormal: "#8E8E93",
  priorityHigh: "#FF9F0A",
  priorityUrgent: "#FF453A",

  overlay: "#000000AA",
  glass: "#1C1C1ECC",
};

export type ThemeColors = typeof light;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

// App-level scheme override so an in-app theme choice works on every platform
// (react-native-web ignores Appearance.setColorScheme). null = follow system.
let overrideScheme: ColorScheme | null = null;
const listeners = new Set<() => void>();

export function setColorScheme(scheme: ColorScheme | null) {
  overrideScheme = scheme;
  Appearance.setColorScheme?.(scheme ?? "unspecified");
  listeners.forEach((l) => l());
}

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const [, force] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  const scheme: ColorScheme =
    overrideScheme && themes[overrideScheme]
      ? overrideScheme
      : system && themes[system]
        ? system
        : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

// Static spacing / radius / type tokens (no color, safe at module level).
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
export const fontSize = { sm: 12, base: 14, lg: 16, xl: 20, "2xl": 24, "3xl": 32, "4xl": 40 };
