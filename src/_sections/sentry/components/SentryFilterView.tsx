import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  AlertTriangle,
  Box,
  Bug,
  Database,
  Globe,
  Hand,
  Key,
  Palette,
  Play,
  Route,
  Settings,
  User,
  Check,
} from "lucide-react-native";
import {
  LogLevel,
  LogType,
  ConsoleTransportEntry,
} from "../../../_components/floating-bubble/admin/logger/types";
import { useSentryEventCounts } from "../hooks/useSentryEvents";

interface SentryFilterViewProps {
  _entries: ConsoleTransportEntry[];
  selectedTypes: Set<LogType>;
  selectedLevels: Set<LogLevel>;
  onToggleTypeFilter: (type: LogType) => void;
  onToggleLevelFilter: (level: LogLevel) => void;
  _onBack: () => void;
}

// Define all possible log types with their icons and colors
const ALL_LOG_TYPES = [
  { type: LogType.Navigation, Icon: Route, color: "#34D399" },
  { type: LogType.Touch, Icon: Hand, color: "#FBBF24" },
  { type: LogType.System, Icon: Settings, color: "#A78BFA" },
  { type: LogType.HTTPRequest, Icon: Globe, color: "#2DD4BF" },
  { type: LogType.State, Icon: Database, color: "#8B5CF6" },
  { type: LogType.UserAction, Icon: User, color: "#FB923C" },
  { type: LogType.Auth, Icon: Key, color: "#F59E0B" },
  { type: LogType.Error, Icon: AlertTriangle, color: "#F87171" },
  { type: LogType.Debug, Icon: Bug, color: "#60A5FA" },
  { type: LogType.Custom, Icon: Palette, color: "#06B6D4" },
  { type: LogType.Generic, Icon: Box, color: "#94A3B8" },
  { type: LogType.Replay, Icon: Play, color: "#EC4899" },
];

// Define all log levels
const ALL_LOG_LEVELS = [
  { level: LogLevel.Info, color: "#22D3EE" },
  { level: LogLevel.Debug, color: "#60A5FA" },
  { level: LogLevel.Warn, color: "#FBBF24" },
  { level: LogLevel.Error, color: "#F87171" },
];

export function SentryFilterView({
  _entries,
  selectedTypes,
  selectedLevels,
  onToggleTypeFilter,
  onToggleLevelFilter,
  _onBack,
}: SentryFilterViewProps) {
  // Use reactive counts hook for real-time updates
  const counts = useSentryEventCounts();

  // Sort log types by count (descending)
  const sortedLogTypes = [...ALL_LOG_TYPES].sort((a, b) => {
    const countA = counts.byType[a.type] || 0;
    const countB = counts.byType[b.type] || 0;
    return countB - countA;
  });

  // Sort log levels by count (descending)
  const sortedLogLevels = [...ALL_LOG_LEVELS].sort((a, b) => {
    const countA = counts.byLevel[a.level] || 0;
    const countB = counts.byLevel[b.level] || 0;
    return countB - countA;
  });

  const renderFilterItem = (
    key: string,
    label: string,
    count: number,
    isSelected: boolean,
    onPress: () => void,
    Icon?: React.ComponentType<{ size?: number; color?: string }>,
    color?: string
  ) => (
    <TouchableOpacity
      accessibilityLabel={`${label} filter ${count} items`}
      accessibilityHint={`View ${label} filter ${count} items`}
      sentry-label="ignore devtools sentry filter item"
      key={key}
      onPress={onPress}
      style={[
        styles.filterItem,
        isSelected && { backgroundColor: `${color}20`, borderColor: color },
      ]}
    >
      <View style={styles.filterItemLeft}>
        {Icon && <Icon size={16} color={isSelected ? color : "#9CA3AF"} />}
        <Text style={[styles.filterItemText, isSelected && { color }]}>
          {label}
        </Text>
      </View>
      <View style={styles.filterItemRight}>
        {count > 0 && (
          <Text style={[styles.filterItemCount, isSelected && { color }]}>
            {count}
          </Text>
        )}
        {isSelected && <Check size={14} color={color} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        accessibilityLabel="Sentry filter view"
        accessibilityHint="View sentry filter view"
        sentry-label="ignore devtools sentry filter scroll"
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Log Levels Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Levels</Text>
          <View style={styles.filterGrid}>
            {sortedLogLevels.map(({ level, color }) => {
              const count = counts.byLevel[level] || 0;
              const label =
                level === LogLevel.Warn
                  ? "Warning"
                  : level.charAt(0).toUpperCase() + level.slice(1);

              return renderFilterItem(
                `level-${level}`,
                label,
                count,
                selectedLevels.has(level),
                () => onToggleLevelFilter(level),
                undefined,
                color
              );
            })}
          </View>
        </View>

        {/* Event Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Types</Text>
          <View style={styles.filterGrid}>
            {sortedLogTypes.map(({ type, Icon, color }) => {
              const count = counts.byType[type] || 0;
              const label =
                type === LogType.HTTPRequest
                  ? "HTTP Request"
                  : type === LogType.UserAction
                    ? "User Action"
                    : type;

              return renderFilterItem(
                `type-${type}`,
                label,
                count,
                selectedTypes.has(type),
                () => onToggleTypeFilter(type),
                Icon,
                color
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1F1F",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 12,
  },
  filterGrid: {
    gap: 8,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 8,
  },
  filterItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filterItemText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  filterItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterItemCount: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
});
