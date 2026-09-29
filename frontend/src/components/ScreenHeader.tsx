import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, spacing } from "@/src/theme";

export function ScreenHeader({
  title,
  subtitle,
  right,
  large = true,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  large?: boolean;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.titleWrap}>
          <Text style={large ? styles.titleLarge : styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md },
  titleWrap: { flex: 1, gap: 2 },
  titleLarge: { fontSize: 32, fontWeight: "700", color: colors.onSurface, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  subtitle: { fontSize: 15, color: colors.muted },
  right: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingBottom: 2 },
}));
