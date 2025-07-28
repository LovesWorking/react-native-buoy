import { ScrollView, TouchableOpacity, View } from 'react-native';
import JSONTree from 'react-native-json-tree';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { faChevronLeft } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { Text } from '~/components/ui/text';

import { ConsoleTransportEntry } from '~/lib/utils/logger/types';

import { jsonTreeTheme } from './constants';
import { formatTimestamp, getLevelColor, getTypeColor, getTypeIcon } from './utils';

// Log Detail View Component
export const LogDetailView = ({ entry, onBack }: { entry: ConsoleTransportEntry; onBack: () => void }) => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/20">
        <TouchableOpacity
          sentry-label="ignore back to log list"
          accessibilityLabel="Back to log list"
          accessibilityHint="Return to log entries list"
          onPress={onBack}
          className="flex-row items-center space-x-2"
        >
          <FontAwesomeIcon icon={faChevronLeft} size={16} color="#8B5CF6" />
          <Text className="text-purple-400 font-medium">Back</Text>
        </TouchableOpacity>
        <Text className="text-white font-semibold text-lg flex-1 text-center mr-16">Log Details</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        sentry-label="ignore log entries scroll view"
        accessibilityLabel="Log entries scroll view"
        accessibilityHint="Scroll through log entries"
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 16 + insets.bottom }}
        showsVerticalScrollIndicator={true}
      >
        {/* Level and timestamp */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center space-x-2">
            {/* Type indicator */}
            <View className="flex-row items-center bg-white/[0.05] px-2 py-1 rounded-md mr-3">
              <FontAwesomeIcon icon={getTypeIcon(entry.type)} size={14} color={getTypeColor(entry.type)} />
              <Text className="text-sm font-medium ml-1.5" style={{ color: getTypeColor(entry.type) }}>
                {entry.type}
              </Text>
            </View>

            {/* Level indicator */}
            <View
              className={`w-3 h-3 rounded-full mr-2 ${
                entry.level === 'error'
                  ? 'bg-red-400'
                  : entry.level === 'warn'
                    ? 'bg-yellow-400'
                    : entry.level === 'info'
                      ? 'bg-cyan-400'
                      : entry.level === 'debug'
                        ? 'bg-blue-400'
                        : 'bg-gray-400'
              }`}
            />
            <Text className={`text-sm font-mono font-medium ${getLevelColor(entry.level)}`}>
              {entry.level.toUpperCase()}
            </Text>
          </View>
          <Text className="text-gray-400 text-sm font-mono">{formatTimestamp(entry.timestamp)}</Text>
        </View>

        {/* Message */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs font-medium mb-3">MESSAGE</Text>
          <View className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.05]">
            <Text className="text-white text-base leading-6" selectable>
              {String(entry.message)}
            </Text>
          </View>
        </View>

        {/* Metadata if it exists */}
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-medium mb-3">METADATA</Text>
            <View className="bg-white/[0.02] p-1 rounded-lg border border-white/[0.05]">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                sentry-label="ignore metadata horizontal scroll"
              >
                <View className="flex-1">
                  <JSONTree
                    data={entry.metadata}
                    theme={jsonTreeTheme}
                    invertTheme={false}
                    hideRoot
                    shouldExpandNode={() => true}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Debug info */}
        <View>
          <Text className="text-gray-400 text-xs font-medium mb-3">DEBUG INFO</Text>
          <View className="bg-white/[0.02] p-1 rounded-lg border border-white/[0.05]">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              sentry-label="ignore debug info horizontal scroll"
            >
              <View className="flex-1">
                <JSONTree
                  data={{ id: entry.id, level: entry.level, timestamp: entry.timestamp }}
                  theme={jsonTreeTheme}
                  invertTheme={false}
                  hideRoot
                  shouldExpandNode={() => true}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
