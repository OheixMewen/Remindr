import { Platform } from "react-native";

// iOS 26+ gets real liquid-glass NativeTabs; everything else uses the classic
// JS tab bar. Defined once and imported by the tabs layout and tab screens.
export const usesNativeTabs =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;
