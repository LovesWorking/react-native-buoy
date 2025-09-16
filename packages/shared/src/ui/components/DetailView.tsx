import { ReactNode, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LucideIcon } from "rn-better-dev-tools/icons";
import { gameUIColors } from "../gameUI";
import { ModalHeader } from "./ModalHeader";
import { CopyButton } from "./CopyButton";

interface DetailViewProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function DetailView({ children, style }: DetailViewProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  onBack?: () => void;
  actions?: ReactNode;
}

DetailView.Header = function Header({
  title,
  subtitle,
  onClose,
  onBack,
  actions,
}: HeaderProps) {
  return (
    <ModalHeader>
      <ModalHeader.Navigation onBack={onBack} onClose={onClose} />
      <ModalHeader.Content title={title} subtitle={subtitle} />
      {actions && <ModalHeader.Actions>{actions}</ModalHeader.Actions>}
    </ModalHeader>
  );
};

interface SectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  style?: ViewStyle;
  badge?: string | number;
}

DetailView.Section = function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  collapsible = true,
  style,
  badge,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <View style={[styles.section, style]}>
        <View style={styles.sectionHeader}>
          {Icon && <Icon size={14} color={gameUIColors.primary} />}
          <Text style={styles.sectionTitle}>{title}</Text>
          {badge !== undefined && (
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <View style={styles.sectionContent}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.section, style]}>
      <TouchableOpacity
        style={styles.sectionHeaderTouchable}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.sectionHeader}>
          {Icon && <Icon size={14} color={gameUIColors.primary} />}
          <Text style={styles.sectionTitle}>{title}</Text>
          {badge !== undefined && (
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

interface RowProps {
  label: string;
  value?: string | number | ReactNode;
  copyable?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
}

DetailView.Row = function Row({
  label,
  value,
  copyable = false,
  style,
  labelStyle,
  valueStyle,
}: RowProps) {
  const stringValue =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : null;

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.rowLabel, labelStyle]}>{label}</Text>
      <View style={styles.rowValueContainer}>
        {typeof value === "string" || typeof value === "number" ? (
          <Text style={[styles.rowValue, valueStyle]} numberOfLines={1}>
            {value}
          </Text>
        ) : (
          value
        )}
        {copyable && stringValue && (
          <CopyButton value={stringValue} size={12} />
        )}
      </View>
    </View>
  );
};

interface DataSectionProps {
  title: string;
  data: unknown;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  style?: ViewStyle;
}

DetailView.DataSection = function DataSection({
  title,
  data,
  icon,
  defaultOpen = false,
  style,
}: DataSectionProps) {
  return (
    <DetailView.Section
      title={title}
      icon={icon}
      defaultOpen={defaultOpen}
      style={style}
    >
      <View style={styles.dataContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.dataText}>{JSON.stringify(data, null, 2)}</Text>
        </ScrollView>
      </View>
    </DetailView.Section>
  );
};

interface StatusBarProps {
  status: "success" | "error" | "warning" | "pending" | "info";
  message?: string;
  style?: ViewStyle;
}

DetailView.StatusBar = function StatusBar({
  status,
  message,
  style,
}: StatusBarProps) {
  const statusColors = {
    success: gameUIColors.success,
    error: gameUIColors.error,
    warning: gameUIColors.warning,
    pending: gameUIColors.warning,
    info: gameUIColors.primary,
  };

  const color = statusColors[status];

  return (
    <View
      style={[
        styles.statusBar,
        { backgroundColor: color + "20", borderColor: color + "40" },
        style,
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      {message && (
        <Text style={[styles.statusMessage, { color }]}>{message}</Text>
      )}
    </View>
  );
};

interface TimelineProps {
  items: {
    label: string;
    value: string;
    status?: "success" | "error" | "pending";
  }[];
  style?: ViewStyle;
}

DetailView.Timeline = function Timeline({ items, style }: TimelineProps) {
  return (
    <View style={[styles.timeline, style]}>
      {items.map((item, index) => (
        <View key={index} style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          {index < items.length - 1 && <View style={styles.timelineLine} />}
          <View style={styles.timelineContent}>
            <Text style={styles.timelineLabel}>{item.label}</Text>
            <Text style={styles.timelineValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

interface ContentProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

DetailView.Content = function Content({
  children,
  scrollable = true,
  style,
}: ContentProps) {
  if (scrollable) {
    return <ScrollView style={[styles.content, style]}>{children}</ScrollView>;
  }
  return <View style={[styles.content, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameUIColors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  sectionHeaderTouchable: {},
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: gameUIColors.text,
  },
  sectionBadge: {
    backgroundColor: gameUIColors.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: gameUIColors.primary,
  },
  sectionContent: {
    padding: 12,
    paddingTop: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: gameUIColors.border + "20",
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    color: gameUIColors.secondary,
  },
  rowValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
    gap: 8,
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    color: gameUIColors.text,
    textAlign: "right",
  },
  dataContainer: {
    backgroundColor: gameUIColors.background,
    borderRadius: 6,
    padding: 12,
  },
  dataText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: gameUIColors.text,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    marginVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusMessage: {
    fontSize: 13,
    fontWeight: "500",
  },
  timeline: {
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: "row",
    position: "relative",
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: gameUIColors.primary,
    marginTop: 4,
    marginRight: 12,
  },
  timelineLine: {
    position: "absolute",
    left: 3.5,
    top: 12,
    bottom: -4,
    width: 1,
    backgroundColor: gameUIColors.border + "40",
  },
  timelineContent: {
    flex: 1,
    marginBottom: 12,
  },
  timelineLabel: {
    fontSize: 12,
    color: gameUIColors.secondary,
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 13,
    color: gameUIColors.text,
  },
});
