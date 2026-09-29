import React from "react";
import { Text, View } from "react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Icon, type IconName } from "@/src/components/Icon";
import { Button } from "@/src/components/Button";

export function EmptyState({
  icon = "checkmark-done-circle-outline",
  title,
  subtitle,
  ctaLabel,
  onCta,
  testID,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.circle}>
        <Icon name={icon} size={40} color={colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCta ? (
        <View style={styles.cta}>
          <Button label={ctaLabel} onPress={onCta} icon="add" testID="empty-cta" />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  circle: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: "600", color: colors.onSurface, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20, maxWidth: 300 },
  cta: { marginTop: spacing.md },
}));
