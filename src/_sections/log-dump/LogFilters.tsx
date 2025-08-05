import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
} from 'lucide-react-native';

import { ConsoleTransportEntry, LogLevel, LogType } from '../../_shared/logger/types';

import { getLevelCount, getTypeCount } from './utils';

interface LogFiltersProps {
  entries: ConsoleTransportEntry[];
  selectedTypes: Set<LogType>;
  selectedLevels: Set<LogLevel>;
  onToggleTypeFilter: (type: LogType) => void;
  onToggleLevelFilter: (level: LogLevel) => void;
}

// Helper functions to get actual counts
const getActualTypeCount = (entries: ConsoleTransportEntry[], type: LogType) => {
  return entries.filter((entry) => entry.type === type).length;
};

const getActualLevelCount = (entries: ConsoleTransportEntry[], level: LogLevel) => {
  return entries.filter((entry) => entry.level === level).length;
};

export const LogFilters = ({
  entries,
  selectedTypes,
  selectedLevels,
  onToggleTypeFilter,
  onToggleLevelFilter,
}: LogFiltersProps) => {
  // Calculate which filters have data
  const typeFilters = [
    {
      type: LogType.Auth,
      Icon: Key,
      color: '#F59E0B',
      textColor: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.2)',
      borderColor: '#F59E0B',
    },
    {
      type: LogType.Custom,
      Icon: Palette,
      color: '#06B6D4',
      textColor: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.2)',
      borderColor: '#06B6D4',
    },
    {
      type: LogType.Debug,
      Icon: Bug,
      color: '#60A5FA',
      textColor: '#60A5FA',
      bgColor: 'rgba(96, 165, 250, 0.2)',
      borderColor: '#60A5FA',
    },
    {
      type: LogType.Error,
      Icon: AlertTriangle,
      color: '#F87171',
      textColor: '#F87171',
      bgColor: 'rgba(248, 113, 113, 0.2)',
      borderColor: '#F87171',
    },
    {
      type: LogType.Generic,
      Icon: Box,
      color: '#94A3B8',
      textColor: '#94A3B8',
      bgColor: 'rgba(148, 163, 184, 0.2)',
      borderColor: '#94A3B8',
    },
    {
      type: LogType.HTTPRequest,
      Icon: Globe,
      color: '#2DD4BF',
      textColor: '#2DD4BF',
      bgColor: 'rgba(45, 212, 191, 0.2)',
      borderColor: '#2DD4BF',
    },
    {
      type: LogType.Navigation,
      Icon: Route,
      color: '#34D399',
      textColor: '#34D399',
      bgColor: 'rgba(52, 211, 153, 0.2)',
      borderColor: '#34D399',
    },
    {
      type: LogType.System,
      Icon: Settings,
      color: '#A78BFA',
      textColor: '#A78BFA',
      bgColor: 'rgba(167, 139, 250, 0.2)',
      borderColor: '#A78BFA',
    },
    {
      type: LogType.Touch,
      Icon: Hand,
      color: '#FBBF24',
      textColor: '#FBBF24',
      bgColor: 'rgba(251, 191, 36, 0.2)',
      borderColor: '#FBBF24',
    },
    {
      type: LogType.UserAction,
      Icon: User,
      color: '#FB923C',
      textColor: '#FB923C',
      bgColor: 'rgba(251, 146, 60, 0.2)',
      borderColor: '#FB923C',
    },
    {
      type: LogType.State,
      Icon: Database,
      color: '#8B5CF6',
      textColor: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.2)',
      borderColor: '#8B5CF6',
    },
    {
      type: LogType.Replay,
      Icon: Play,
      color: '#EC4899',
      textColor: '#EC4899',
      bgColor: 'rgba(236, 72, 153, 0.2)',
      borderColor: '#EC4899',
    },
  ]
    .filter((filter) => getActualTypeCount(entries, filter.type) > 0)
    .sort((a, b) => getActualTypeCount(entries, b.type) - getActualTypeCount(entries, a.type));

  const levelFilters = [
    {
      level: LogLevel.Debug,
      textColor: '#60A5FA',
      bgColor: 'rgba(96, 165, 250, 0.2)',
      borderColor: '#60A5FA',
      dotColor: '#60A5FA',
    },
    {
      level: LogLevel.Error,
      textColor: '#F87171',
      bgColor: 'rgba(248, 113, 113, 0.2)',
      borderColor: '#F87171',
      dotColor: '#F87171',
    },
    {
      level: LogLevel.Info,
      textColor: '#22D3EE',
      bgColor: 'rgba(34, 211, 238, 0.2)',
      borderColor: '#22D3EE',
      dotColor: '#22D3EE',
    },
    {
      level: LogLevel.Warn,
      textColor: '#FBBF24',
      bgColor: 'rgba(251, 191, 36, 0.2)',
      borderColor: '#FBBF24',
      dotColor: '#FBBF24',
    },
  ]
    .filter((filter) => getActualLevelCount(entries, filter.level) > 0)
    .sort((a, b) => getActualLevelCount(entries, b.level) - getActualLevelCount(entries, a.level));

  return (
    <View style={styles.container}>
      {/* Type filters */}
      {typeFilters.length > 0 && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            sentry-label="ignore log type filters scroll view"
          >
            {typeFilters.map(({ type, Icon, color, textColor, bgColor, borderColor }) => (
              <TouchableOpacity
                key={type}
                sentry-label={`ignore toggle ${type} type filter`}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${type} logs`}
                accessibilityHint={`${selectedTypes.has(type) ? 'Remove' : 'Add'} ${type} type filter`}
                onPress={() => onToggleTypeFilter(type)}
                style={[
                  styles.filterButton,
                  selectedTypes.has(type)
                    ? { backgroundColor: bgColor, borderColor: borderColor }
                    : styles.inactiveFilter,
                ]}
              >
                <Icon size={12} color={selectedTypes.has(type) ? color : '#6B7280'} />
                <Text
                  style={[
                    styles.filterText,
                    selectedTypes.has(type) ? { color: textColor } : styles.inactiveFilterText,
                  ]}
                >
                  {type === LogType.HTTPRequest ? 'HTTP Request' : type === LogType.UserAction ? 'User Action' : type}
                  {getTypeCount(entries, type)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Level filters */}
      {levelFilters.length > 0 && (
        <View style={styles.levelFiltersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            sentry-label="ignore log level filters scroll view"
          >
            {levelFilters.map(({ level, textColor, bgColor, borderColor, dotColor }) => (
              <TouchableOpacity
                key={level}
                sentry-label={`ignore toggle ${level} level filter`}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${level} level logs`}
                accessibilityHint={`${selectedLevels.has(level) ? 'Remove' : 'Add'} ${level} level filter`}
                onPress={() => onToggleLevelFilter(level)}
                style={[
                  styles.filterButton,
                  selectedLevels.has(level)
                    ? { backgroundColor: bgColor, borderColor: borderColor }
                    : styles.inactiveFilter,
                ]}
              >
                <View style={[styles.levelDot, { backgroundColor: dotColor }]} />
                <Text
                  style={[
                    styles.filterText,
                    selectedLevels.has(level) ? { color: textColor } : styles.inactiveFilterText,
                  ]}
                >
                  {level === LogLevel.Warn ? 'warning' : level}
                  {getLevelCount(entries, level)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  scrollContent: {
    gap: 8,
  },
  levelFiltersContainer: {
    marginTop: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  inactiveFilter: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  inactiveFilterText: {
    color: '#9CA3AF',
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
