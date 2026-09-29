import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export const haptic = {
  success: () => Platform.OS !== "web" && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Platform.OS !== "web" && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  light: () => Platform.OS !== "web" && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Platform.OS !== "web" && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Platform.OS !== "web" && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  selection: () => Platform.OS !== "web" && Haptics.selectionAsync(),
};
