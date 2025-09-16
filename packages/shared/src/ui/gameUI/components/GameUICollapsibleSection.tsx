import { ComponentType, ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Animated,
} from "react-native";
import { ChevronDown, ChevronUp } from "rn-better-dev-tools/icons";
import { gameUIColors } from "../constants/gameUIColors";

export interface GameUICollapsibleSectionProps {
  // Icon component from lucide-react-native
  icon: ComponentType<{ size: number; color: string }>;
  // Color for icon and count badge
  iconColor: string;
  // Section title (uppercase, monospace)
  title: string;
  // Number to display in badge
  count: number;
  // Descriptive subtitle text
  subtitle: string;
  // Current expanded state
  expanded: boolean;
  // Toggle callback
  onToggle: () => void;
  // Section content
  children: ReactNode;
  // Optional style overrides
  style?: ViewStyle;
  // Optional title style override
  titleStyle?: TextStyle;
}

/**
 * Reusable collapsible section component for Game UI
 * Follows the established design pattern with icon, title, count badge, and subtitle
 * Used across ENV, Storage, and other game-style interfaces
 */
export function GameUICollapsibleSection({
  icon: Icon,
  iconColor,
  title,
  count,
  subtitle,
  expanded,
  onToggle,
  children,
  style,
  titleStyle,
}: GameUICollapsibleSectionProps) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.headerTouchable}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon size={14} color={iconColor} />
            <Text style={[styles.title, titleStyle]}>{title}</Text>
            <View style={[styles.badge, { backgroundColor: iconColor + "20" }]}>
              <Text style={[styles.badgeText, { color: iconColor }]}>
                {count}
              </Text>
            </View>
          </View>
          {expanded ? (
            <ChevronUp size={14} color={gameUIColors.muted} />
          ) : (
            <ChevronDown size={14} color={gameUIColors.muted} />
          )}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </TouchableOpacity>

      {expanded && (
        <Animated.View style={{ opacity: 1 }}>{children}</Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerTouchable: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 11,
    color: gameUIColors.primary,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 2,
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 9,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
    paddingHorizontal: 4,
    marginTop: 2,
    opacity: 0.7,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
  },
});
