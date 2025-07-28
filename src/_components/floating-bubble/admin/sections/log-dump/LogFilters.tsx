import { ScrollView, TouchableOpacity, View } from 'react-native';
import {
  faBug,
  faCube,
  faDatabase,
  faGears,
  faGlobe,
  faHandPointer,
  faKey,
  faPalette,
  faPlay,
  faRoute,
  faTriangleExclamation,
  faUser,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { Text } from '~/components/ui/text';

import { ConsoleTransportEntry, LogLevel, LogType } from '~/lib/utils/logger/types';

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
      icon: faKey,
      color: '#F59E0B',
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20 border-yellow-500',
    },
    {
      type: LogType.Custom,
      icon: faPalette,
      color: '#06B6D4',
      textColor: 'text-cyan-500',
      bgColor: 'bg-cyan-500/20 border-cyan-500',
    },
    {
      type: LogType.Debug,
      icon: faBug,
      color: '#60A5FA',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-400/20 border-blue-400',
    },
    {
      type: LogType.Error,
      icon: faTriangleExclamation,
      color: '#F87171',
      textColor: 'text-red-400',
      bgColor: 'bg-red-400/20 border-red-400',
    },
    {
      type: LogType.Generic,
      icon: faCube,
      color: '#94A3B8',
      textColor: 'text-slate-400',
      bgColor: 'bg-slate-400/20 border-slate-400',
    },
    {
      type: LogType.HTTPRequest,
      icon: faGlobe,
      color: '#2DD4BF',
      textColor: 'text-teal-400',
      bgColor: 'bg-teal-400/20 border-teal-400',
    },
    {
      type: LogType.Navigation,
      icon: faRoute,
      color: '#34D399',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-400/20 border-emerald-400',
    },
    {
      type: LogType.System,
      icon: faGears,
      color: '#A78BFA',
      textColor: 'text-violet-400',
      bgColor: 'bg-violet-400/20 border-violet-400',
    },
    {
      type: LogType.Touch,
      icon: faHandPointer,
      color: '#FBBF24',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-400/20 border-amber-400',
    },
    {
      type: LogType.UserAction,
      icon: faUser,
      color: '#FB923C',
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-400/20 border-orange-400',
    },
    {
      type: LogType.State,
      icon: faDatabase,
      color: '#8B5CF6',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/20 border-purple-500',
    },
    {
      type: LogType.Replay,
      icon: faPlay,
      color: '#EC4899',
      textColor: 'text-pink-500',
      bgColor: 'bg-pink-500/20 border-pink-500',
    },
  ]
    .filter((filter) => getActualTypeCount(entries, filter.type) > 0)
    .sort((a, b) => getActualTypeCount(entries, b.type) - getActualTypeCount(entries, a.type));

  const levelFilters = [
    {
      level: LogLevel.Debug,
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-400/20 border-blue-400',
      dotColor: 'bg-blue-400',
    },
    {
      level: LogLevel.Error,
      textColor: 'text-red-400',
      bgColor: 'bg-red-400/20 border-red-400',
      dotColor: 'bg-red-400',
    },
    {
      level: LogLevel.Info,
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-400/20 border-cyan-400',
      dotColor: 'bg-cyan-400',
    },
    {
      level: LogLevel.Warn,
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20 border-yellow-400',
      dotColor: 'bg-yellow-400',
    },
  ]
    .filter((filter) => getActualLevelCount(entries, filter.level) > 0)
    .sort((a, b) => getActualLevelCount(entries, b.level) - getActualLevelCount(entries, a.level));

  return (
    <View className="px-4 pb-1 space-y-2">
      {/* Type filters */}
      {typeFilters.length > 0 && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            sentry-label="ignore log type filters scroll view"
          >
            {typeFilters.map(({ type, icon, color, textColor, bgColor }) => (
              <TouchableOpacity
                key={type}
                sentry-label={`ignore toggle ${type} type filter`}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${type} logs`}
                accessibilityHint={`${selectedTypes.has(type) ? 'Remove' : 'Add'} ${type} type filter`}
                onPress={() => onToggleTypeFilter(type)}
                className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                  selectedTypes.has(type) ? bgColor : 'bg-white/[0.02] border-white/[0.1]'
                }`}
              >
                <FontAwesomeIcon icon={icon} size={12} color={selectedTypes.has(type) ? color : '#6B7280'} />
                <Text className={`ml-2 text-sm font-medium ${selectedTypes.has(type) ? textColor : 'text-gray-400'}`}>
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
        <View className="mt-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            sentry-label="ignore log level filters scroll view"
          >
            {levelFilters.map(({ level, textColor, bgColor, dotColor }) => (
              <TouchableOpacity
                key={level}
                sentry-label={`ignore toggle ${level} level filter`}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${level} level logs`}
                accessibilityHint={`${selectedLevels.has(level) ? 'Remove' : 'Add'} ${level} level filter`}
                onPress={() => onToggleLevelFilter(level)}
                className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                  selectedLevels.has(level) ? bgColor : 'bg-white/[0.02] border-white/[0.1]'
                }`}
              >
                <View className={`w-2 h-2 rounded-full ${dotColor}`} />
                <Text className={`ml-2 text-sm font-medium ${selectedLevels.has(level) ? textColor : 'text-gray-400'}`}>
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
