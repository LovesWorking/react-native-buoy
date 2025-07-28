import { TouchableOpacity, View } from 'react-native';
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { ListRenderItem } from '@shopify/flash-list';

import { Text } from '~/components/ui/text';

import { ConsoleTransportEntry } from '~/lib/utils/logger/types';

import { formatTimestamp, getLevelColor, getTypeColor, getTypeIcon } from './utils';

// Stable render function outside component
export const renderLogEntry: ListRenderItem<ConsoleTransportEntry> = ({ item: entry, extraData }) => {
  return (
    <View className="bg-white/[0.03] rounded-lg overflow-hidden mb-2 mx-4">
      <TouchableOpacity
        sentry-label={`ignore view log entry ${entry.id} details`}
        accessibilityLabel={`Log entry: ${entry.message}`}
        accessibilityHint="View full log entry details"
        onPress={() => extraData?.selectEntry(entry)}
        className="p-4"
      >
        {/* Header row with type, level and time */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center space-x-2">
            {/* Type indicator */}
            <View className="flex-row items-center bg-white/[0.05] px-2 py-1 rounded-md mr-2">
              <FontAwesomeIcon icon={getTypeIcon(entry.type)} size={12} color={getTypeColor(entry.type)} />
              <Text className="text-xs font-medium ml-1.5" style={{ color: getTypeColor(entry.type) }}>
                {entry.type}
              </Text>
            </View>

            {/* Level indicator */}
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
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
            <Text className={`text-xs font-mono font-medium ${getLevelColor(entry.level)}`}>
              {entry.level.toUpperCase()}
            </Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <Text className="text-gray-500 text-xs font-mono">{formatTimestamp(entry.timestamp)}</Text>
            <FontAwesomeIcon icon={faChevronRight} size={12} color="#6B7280" />
          </View>
        </View>

        {/* Message preview */}
        <Text className="text-white text-sm leading-5" numberOfLines={3}>
          {String(entry.message)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
