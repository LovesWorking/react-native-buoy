import { View, Text, StyleSheet } from "react-native";
import type { ReactNode, ComponentType } from "react";

// Base SectionHeader container component
interface SectionHeaderProps {
  children: ReactNode;
}

export function SectionHeader({ children }: SectionHeaderProps) {
  return <View style={styles.container}>{children}</View>;
}

// Icon component for section headers
interface IconProps {
  icon: ComponentType<{ size?: number; color?: string }>;
  color?: string;
  size?: number;
}

function Icon({
  icon: IconComponent,
  color = "#E5E7EB",
  size = 16,
}: IconProps) {
  return (
    <View style={styles.iconWrapper}>
      <IconComponent size={size} color={color} />
    </View>
  );
}

// Title component for section headers
interface TitleProps {
  children: ReactNode;
  flex?: number;
}

function Title({ children, flex = 1 }: TitleProps) {
  return (
    <Text style={[styles.title, { flex }]} numberOfLines={1}>
      {children}
    </Text>
  );
}

// Badge component for counts or status
interface BadgeProps {
  count?: number | string;
  color?: string;
  children?: ReactNode;
}

function Badge({ count, color = "#E5E7EB", children }: BadgeProps) {
  const backgroundColor = `${color}15`;
  const borderColor = `${color}33`;

  return (
    <View style={[styles.badge, { backgroundColor, borderColor }]}>
      {count !== undefined ? (
        <Text style={[styles.badgeText, { color }]}>{count}</Text>
      ) : (
        children
      )}
    </View>
  );
}

// Actions component for section header actions
interface ActionsProps {
  children: ReactNode;
}

function Actions({ children }: ActionsProps) {
  return <View style={styles.actions}>{children}</View>;
}

// Attach sub-components to the main component
SectionHeader.Icon = Icon;
SectionHeader.Title = Title;
SectionHeader.Badge = Badge;
SectionHeader.Actions = Actions;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#0F0F0F",
    minHeight: 40,
  },
  iconWrapper: {
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
});
