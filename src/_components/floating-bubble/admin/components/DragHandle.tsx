import { Dimensions } from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { GripVertical } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface DragHandleProps {
  panGesture: PanGesture;
  translateX: SharedValue<number>;
}

export function DragHandle({ panGesture, translateX }: DragHandleProps) {
  const dragHandleBorder = useAnimatedStyle(() => {
    const handleWidth = 24;
    const centerX = translateX.value + handleWidth / 2;
    const isOnLeft = centerX < screenWidth / 2;

    return {
      borderLeftWidth: isOnLeft ? 1 : 0,
      borderLeftColor: 'rgba(75, 85, 99, 0.4)',
      borderRightWidth: isOnLeft ? 0 : 1,
      borderRightColor: 'rgba(75, 85, 99, 0.4)',
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            paddingHorizontal: 6,
            paddingVertical: 6,
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            flexShrink: 0,
          },
          dragHandleBorder,
        ]}
      >
        <GripVertical size={12} color="rgba(156, 163, 175, 0.8)" />
      </Animated.View>
    </GestureDetector>
  );
}
