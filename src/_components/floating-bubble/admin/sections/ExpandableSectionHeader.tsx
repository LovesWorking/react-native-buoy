import { TouchableOpacity, View } from 'react-native';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faChevronDown, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { Text } from '~/components/ui/text';

interface ExpandableSectionHeaderProps {
  icon: IconProp;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onPress: () => void;
}

export function ExpandableSectionHeader({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  isExpanded,
  onPress,
}: ExpandableSectionHeaderProps) {
  return (
    <TouchableOpacity
      sentry-label="ignore expand section button"
      accessibilityRole="button"
      onPress={onPress}
      className="mb-4"
    >
      <View className="flex-row items-start">
        <View className={`${iconBackgroundColor} p-3 rounded-xl`}>
          <FontAwesomeIcon icon={icon} size={20} color={iconColor} />
        </View>
        <View className="flex-1 mx-4">
          <Text className="text-lg font-medium text-white mb-1">{title}</Text>
          <Text className="text-base text-gray-400" numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <View className="pt-1.5">
          <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} size={18} color="#4B5563" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
