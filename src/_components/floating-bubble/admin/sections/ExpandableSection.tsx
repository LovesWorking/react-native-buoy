import { ReactNode, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { Separator } from '~/components/ui/separator';

import { ExpandableSectionHeader } from './ExpandableSectionHeader';

interface ExpandableSectionProps {
  icon: IconProp;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  onPress?: () => void;
}

export function ExpandableSection({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  children,
  defaultExpanded = false,
  onPress,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <View className="bg-[#1F1F1F] rounded-xl border border-white/[0.08] overflow-hidden">
      <View className="p-6">
        <ExpandableSectionHeader
          icon={icon}
          iconColor={iconColor}
          iconBackgroundColor={iconBackgroundColor}
          title={title}
          subtitle={subtitle}
          isExpanded={isExpanded}
          onPress={handlePress}
        />

        <Separator className="bg-white/[0.06] mb-6" />

        {isExpanded && <Animated.View entering={FadeIn.duration(300)}>{children}</Animated.View>}
      </View>
    </View>
  );
}
