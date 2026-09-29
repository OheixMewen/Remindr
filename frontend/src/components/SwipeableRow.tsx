import React, { useRef } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import { Icon, type IconName } from "@/src/components/Icon";
import { makeStyles, spacing, useTheme } from "@/src/theme";

export interface SwipeAction {
  label: string;
  icon: IconName;
  color: string;
  onPress: () => void;
}

export function SwipeableRow({
  children,
  rightActions,
}: {
  children: React.ReactNode;
  rightActions: SwipeAction[];
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const ref = useRef<SwipeableMethods>(null);

  if (Platform.OS === "web" || rightActions.length === 0) {
    return <>{children}</>;
  }

  const renderRight = () => (
    <View style={styles.actions}>
      {rightActions.map((a, i) => (
        <Pressable
          key={i}
          style={[styles.action, { backgroundColor: a.color }]}
          onPress={() => {
            ref.current?.close();
            a.onPress();
          }}
          testID={`swipe-action-${a.label}`}
        >
          <Icon name={a.icon} size={20} color={colors.onBrandPrimary} />
          <Text style={styles.actionText}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRight}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const useStyles = makeStyles((colors) => ({
  actions: { flexDirection: "row" },
  action: {
    width: 84,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  actionText: { color: colors.onBrandPrimary, fontSize: 12, fontWeight: "600" },
}));
