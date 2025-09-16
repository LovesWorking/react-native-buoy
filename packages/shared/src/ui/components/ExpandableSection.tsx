import { ReactNode, useState } from "react";
import { StyleSheet, View, Animated } from "react-native";
import type { LucideIcon } from "rn-better-dev-tools/icons";

import { ExpandableSectionHeader } from "./ExpandableSectionHeader";

interface ExpandableSectionProps {
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  onPress?: () => void;
}

export function ExpandableSection({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  children,
  defaultExpanded = false,
  onPress,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ExpandableSectionHeader
          icon={icon}
          iconColor={iconColor}
          iconBackgroundColor={iconBackgroundColor}
          title={title}
          subtitle={subtitle}
          isExpanded={isExpanded}
          onPress={handlePress}
        />

        <View style={styles.divider} />

        {isExpanded && (
          <Animated.View style={{ opacity: 1 }}>{children}</Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F1F1F",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    marginHorizontal: 8,
    marginBottom: 16,
  },
  content: {
    padding: 24,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 24,
  },
});
