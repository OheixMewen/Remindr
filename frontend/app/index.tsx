import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { storage } from "@/src/utils/storage";
import { useSettings } from "@/src/store/SettingsContext";
import { useTasks } from "@/src/store/TaskContext";
import { useTheme } from "@/src/theme";
import { ONBOARDED_KEY } from "@/src/lib/constants";

export default function Index() {
  const { colors } = useTheme();
  const { loaded: settingsLoaded } = useSettings();
  const { loaded: tasksLoaded } = useTasks();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const v = await storage.getItem<boolean>(ONBOARDED_KEY, false);
      setOnboarded(!!v);
    })();
  }, []);

  if (!settingsLoaded || !tasksLoaded || onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  return <Redirect href={onboarded ? "/(tabs)/home" : "/onboarding"} />;
}
