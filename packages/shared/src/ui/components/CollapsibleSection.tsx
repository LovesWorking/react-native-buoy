import { useState, useRef, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
} from "react-native";
import { ChevronDown, LucideIcon } from "../../icons";
import { gameUIColors } from "../gameUI";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  badge?: string | number | ReactNode;
  defaultOpen?: boolean;
  variant?: "bordered" | "plain" | "card";
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  onToggle?: (isOpen: boolean) => void;
}

export function CollapsibleSection({
  title,
  children,
  icon: Icon,
  badge,
  defaultOpen = false,
  variant = "bordered",
  style,
  headerStyle,
  titleStyle,
  contentStyle,
  onToggle,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);

    Animated.timing(rotateAnim, {
      toValue: newState ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const containerStyles = [
    styles.container,
    variant === "bordered" && styles.borderedVariant,
    variant === "card" && styles.cardVariant,
    style,
  ];

  return (
    <View style={containerStyles}>
      <TouchableOpacity
        style={[styles.header, headerStyle]}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {Icon && (
            <Icon
              size={16}
              color={
                variant === "card"
                  ? gameUIColors.primary
                  : gameUIColors.secondary
              }
            />
          )}
          <Text style={[styles.title, titleStyle]}>{title}</Text>
        </View>

        <View style={styles.headerRight}>
          {badge !== undefined && (
            <View style={styles.badgeContainer}>
              {typeof badge === "string" || typeof badge === "number" ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : (
                badge
              )}
            </View>
          )}
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <ChevronDown size={16} color={gameUIColors.secondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {isOpen && <View style={[styles.content, contentStyle]}>{children}</View>}
    </View>
  );
}

interface SimpleProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

CollapsibleSection.Simple = function Simple({
  title,
  children,
  defaultOpen,
}: SimpleProps) {
  return (
    <CollapsibleSection title={title} defaultOpen={defaultOpen} variant="plain">
      {children}
    </CollapsibleSection>
  );
};

interface WithIconProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

CollapsibleSection.WithIcon = function WithIcon({
  title,
  icon,
  children,
  defaultOpen,
  badge,
}: WithIconProps) {
  return (
    <CollapsibleSection
      title={title}
      icon={icon}
      badge={badge}
      defaultOpen={defaultOpen}
      variant="card"
    >
      {children}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  borderedVariant: {
    borderWidth: 1,
    borderColor: gameUIColors.border + "30",
    borderRadius: 8,
    overflow: "hidden",
  },
  cardVariant: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: gameUIColors.text,
    flex: 1,
  },
  badgeContainer: {
    marginRight: 4,
  },
  badge: {
    backgroundColor: gameUIColors.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: gameUIColors.primary,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
