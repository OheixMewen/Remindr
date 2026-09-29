import React from "react";
import { Text, View } from "react-native";

import { makeStyles, radius, spacing } from "@/src/theme";

export function Section({
  title,
  footer,
  children,
  testID,
}: {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  testID?: string;
}) {
  const styles = useStyles();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.wrap} testID={testID}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.card}>
        {items.map((child, i) => (
          <View key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            {child}
          </View>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { marginBottom: spacing.xl },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg },
  footer: { fontSize: 12, color: colors.muted, marginTop: spacing.sm, marginLeft: spacing.xs, lineHeight: 17 },
}));
