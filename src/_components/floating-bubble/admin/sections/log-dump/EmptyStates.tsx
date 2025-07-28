import { View } from 'react-native';

import { Text } from '~/components/ui/text';

export const EmptyState = () => (
  <View className="flex-1 justify-center items-center p-8">
    <View className="bg-white/[0.03] p-8 rounded-lg border border-white/[0.05]">
      <Text className="text-gray-500 text-base font-medium text-center mb-2">No log entries found</Text>
      <Text className="text-gray-600 text-sm text-center">Logs will appear here as the app generates them</Text>
    </View>
  </View>
);

// Add EmptyFilterState component
export const EmptyFilterState = () => (
  <View className="flex-1 justify-center items-center p-8">
    <View className="bg-white/[0.03] p-8 rounded-lg border border-white/[0.05]">
      <Text className="text-gray-500 text-base font-medium text-center mb-2">No matching entries</Text>
      <Text className="text-gray-600 text-sm text-center">Try adjusting your filters to see more entries</Text>
    </View>
  </View>
);
