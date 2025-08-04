import { View, Text, StyleSheet, Pressable } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { ExpandableSectionHeader } from "../admin/sections/ExpandableSectionHeader";

// Stable constants moved to module scope to prevent re-renders [[memory:4875251]]
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

interface ConsoleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  onPress: () => void;
  children?: React.ReactNode;
}

/**
 * Individual console section component following composition principles.
 * Separates section UI rendering from business logic.
 */
export function ConsoleSection({
  id,
  title,
  subtitle,
  icon,
  iconColor,
  iconBackgroundColor,
  onPress,
}: ConsoleSectionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.sectionCard}
      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
    >
      <View style={styles.sectionCardContent}>
        <ExpandableSectionHeader
          title={title}
          subtitle={subtitle || ""}
          icon={icon}
          iconColor={iconColor}
          iconBackgroundColor={iconBackgroundColor}
          isExpanded={false}
          onPress={onPress}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "#1F1F1F", // Match ExpandableSection background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)", // Match ExpandableSection border
    overflow: "hidden",
    marginBottom: 16, // Match ExpandableSection spacing
  },

  sectionCardContent: {
    padding: 24, // Match ExpandableSection padding
  },
});
