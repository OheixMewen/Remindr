import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { storage } from "@/src/utils/storage";
import { ONBOARDED_KEY } from "@/src/lib/constants";
import { Button } from "@/src/components/Button";
import { Icon } from "@/src/components/Icon";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function Onboarding() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const finish = async (createNow: boolean) => {
    await storage.setItem(ONBOARDED_KEY, true);
    if (createNow) router.replace("/task/new");
    else router.replace("/(tabs)/home");
  };

  const features = [
    { icon: "checkbox-outline" as const, text: "Notez vos tâches en quelques secondes" },
    { icon: "calendar-outline" as const, text: "Planifiez à la date et l'heure exactes" },
    { icon: "repeat-outline" as const, text: "Créez des tâches récurrentes" },
    { icon: "notifications-outline" as const, text: "Recevez des rappels personnalisés" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.top}>
        <View style={styles.logo}>
          <Icon name="checkmark-done" size={40} color={colors.onBrandPrimary} />
        </View>
        <Text style={styles.title}>Organisez vos tâches.{"\n"}N&apos;oubliez plus rien.</Text>
        <Text style={styles.subtitle}>
          Une application simple et rapide pour vos rappels du quotidien.
        </Text>
      </View>

      <View style={styles.features}>
        {features.map((f, i) => (
          <View key={i} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Icon name={f.icon} size={20} color={colors.brandPrimary} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Créer ma première tâche" icon="add" onPress={() => finish(true)} testID="onboard-create" />
        <Button label="Explorer l'application" variant="ghost" onPress={() => finish(false)} testID="onboard-skip" />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl, justifyContent: "space-between" },
  top: { alignItems: "center", gap: spacing.md },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.onSurface, textAlign: "center", lineHeight: 36 },
  subtitle: { fontSize: 16, color: colors.muted, textAlign: "center", lineHeight: 22, maxWidth: 320 },
  features: { gap: spacing.lg },
  feature: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 16, color: colors.onSurface, flex: 1 },
  actions: { gap: spacing.xs },
}));
