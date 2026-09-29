import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

import { Icon, type IconName } from "@/src/components/Icon";
import { usesNativeTabs } from "@/src/navigation";
import { useTheme } from "@/src/theme";

const TABS: { name: string; label: string; icon: IconName; iconOn: IconName; sf: string }[] = [
  { name: "home", label: "Aujourd'hui", icon: "today-outline", iconOn: "today", sf: "checklist" },
  { name: "calendar", label: "Calendrier", icon: "calendar-outline", iconOn: "calendar", sf: "calendar" },
  { name: "tasks", label: "Tâches", icon: "list-outline", iconOn: "list", sf: "tray.full" },
  { name: "settings", label: "Réglages", icon: "settings-outline", iconOn: "settings", sf: "gearshape" },
];

export default function TabsLayout() {
  const { colors } = useTheme();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        {TABS.map((t) => (
          <NativeTabs.Trigger key={t.name} name={t.name}>
            <NativeTabs.Trigger.Icon sf={t.sf as any} />
            <NativeTabs.Trigger.Label>{t.label}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.label,
            tabBarIcon: ({ focused, color, size }) => (
              <Icon name={focused ? t.iconOn : t.icon} size={size ?? 24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
