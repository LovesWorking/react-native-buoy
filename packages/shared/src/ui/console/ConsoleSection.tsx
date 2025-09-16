import { View, StyleSheet } from "react-native";
import type { LucideIcon } from "rn-better-dev-tools/icons";
import { ExpandableSectionHeader } from "@/rn-better-dev-tools/src/shared/ui/components/ExpandableSectionHeader";
import { GalaxyButton } from "./GalaxyButton";

// Stable constants moved to module scope to prevent re-renders [[memory:4875251]]

interface ConsoleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  onPress: () => void;
  children?: ReactNode;
}

/**
 * Individual console section component following composition principles.
 * Separates section UI rendering from business logic.
 */
export function ConsoleSection({
  id: _id,
  title,
  subtitle,
  icon,
  iconColor,
  iconBackgroundColor,
  onPress,
}: ConsoleSectionProps) {
  return (
    <GalaxyButton onPress={onPress} style={styles.sectionCard}>
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
    </GalaxyButton>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: 16, // Match ExpandableSection spacing
  },

  sectionCardContent: {
    padding: 24, // Match ExpandableSection padding
  },
});
