import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { onlineManager } from '@tanstack/react-query';
import { FlaskConical, GripVertical, TestTube2, Wifi, WifiOff } from 'lucide-react-native';

import { AdminModal } from './AdminModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FloatingStatusBubbleProps {
  userRole: 'admin' | 'internal' | 'user';
  environment: 'local' | 'dev' | 'prod';
}

export function FloatingStatusBubble({ userRole, environment }: FloatingStatusBubbleProps) {
  const { top, bottom } = useSafeAreaInsets();
  const adminModalRef = useRef<BottomSheetModal>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());
  const [bubbleWidth, setBubbleWidth] = useState(200);
  const [contentMeasurements, setContentMeasurements] = useState({
    envLabelWidth: 0,
    statusWidth: 0,
  });

  // Initial position with proper right-side spacing
  const translateX = useSharedValue(screenWidth - bubbleWidth - 5); // 5px edge spacing
  const translateY = useSharedValue(screenHeight - bottom - 120);
  const borderOpacity = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // Memoize the calculation function to prevent unnecessary re-renders
  const calculateTotalWidth = useCallback(() => {
    const handleWidth = 24;
    const wifiWidth = 24;
    const dividerWidth = 1;
    const horizontalPadding = 8;
    const dividerMargin = 8 * 2;
    const minContentWidth = Math.max(contentMeasurements.envLabelWidth, contentMeasurements.statusWidth);

    // Calculate number of dividers based on environment
    const numDividers = 2; // 3 dividers in local (with breadcrumb), 2 in dev/prod

    // Total width = handle + env section + divider + status section + (breadcrumb + divider if local) + wifi + padding
    const totalWidth =
      handleWidth + minContentWidth + (dividerWidth + dividerMargin) * numDividers + wifiWidth + horizontalPadding * 2;

    // Adjust minimum width based on environment
    const minWidth = 200;
    const maxWidth = screenWidth - 32;

    return Math.min(Math.max(totalWidth, minWidth), maxWidth);
  }, [contentMeasurements]);

  // Update bubble width when content measurements change
  useEffect(() => {
    const newWidth = calculateTotalWidth();
    if (newWidth !== bubbleWidth) {
      setBubbleWidth(newWidth);
    }
  }, [contentMeasurements, bubbleWidth, calculateTotalWidth]);

  const handleEnvLabelLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== contentMeasurements.envLabelWidth) {
      setContentMeasurements((prev) => ({ ...prev, envLabelWidth: width }));
    }
  };

  const handleStatusLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== contentMeasurements.statusWidth) {
      setContentMeasurements((prev) => ({ ...prev, statusWidth: width }));
    }
  };

  const handlePress = () => {
    if (!isDragging) {
      setIsModalOpen(true);
      adminModalRef.current?.present();
    }
  };

  const handleModalDismiss = () => {
    setIsModalOpen(false);
  };

  const handleWifiToggle = () => {
    if (!isDragging) {
      const newOnlineState = !isOnline;
      setIsOnline(newOnlineState);
      onlineManager.setOnline(newOnlineState);
    }
  };

  // Listen to online manager changes to keep state in sync
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  const setDragging = (dragging: boolean) => {
    setIsDragging(dragging);
  };

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .shouldCancelWhenOutside(false)
    .onBegin(() => {
      runOnJS(setDragging)(true);
      borderOpacity.value = withSpring(1);
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      const handleWidth = 24;

      // When dragging, allow more of the bubble to be hidden, showing just the handle
      translateX.value = clamp(
        offsetX.value + event.translationX,
        -bubbleWidth + handleWidth, // Show only the handle width
        screenWidth - handleWidth, // Show only the handle width
      );
      translateY.value = clamp(offsetY.value + event.translationY, top + 10, screenHeight - bottom - 32 - 10);
    })
    .onEnd(() => {
      const handleWidth = 24;
      const centerX = translateX.value + bubbleWidth / 2;

      // Calculate edge positions with consistent spacing
      if (centerX < screenWidth / 2) {
        // When on left side
        if (translateX.value < -bubbleWidth / 2) {
          // Hide bubble, show only handle
          translateX.value = withSpring(-bubbleWidth + handleWidth);
        } else {
          // Show full bubble with spacing
          translateX.value = withSpring(1);
        }
      } else {
        // When on right side
        if (translateX.value > screenWidth - bubbleWidth / 2) {
          // Hide bubble, show only handle
          translateX.value = withSpring(screenWidth - handleWidth);
        } else {
          // Show full bubble with spacing
          translateX.value = withSpring(screenWidth - bubbleWidth - 5); // 5px edge spacing to prevent cutoff
        }
      }

      borderOpacity.value = withSpring(0);
      runOnJS(setDragging)(false);
    })
    .onFinalize(() => {
      runOnJS(setDragging)(false);
      borderOpacity.value = withSpring(0);
    });

  // Initial position with proper right-side spacing
  useEffect(() => {
    const spacing = 5; // Keep consistent spacing for now
    translateX.value = screenWidth - bubbleWidth - spacing;
  }, [bubbleWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    const normalBorder = 'rgba(75, 85, 99, 0.4)';
    const dragBorder = 'rgba(34, 197, 94, 1)';

    return {
      borderColor: isDragging ? dragBorder : normalBorder,
      borderWidth: isDragging ? 2 : 1,
      transform: [
        {
          translateY: isDragging ? 1 : 0,
        },
      ],
    };
  });

  const bubbleLayout = useAnimatedStyle(() => {
    const centerX = translateX.value + bubbleWidth / 2;
    const isOnLeft = centerX < screenWidth / 2;
    return {
      flexDirection: isOnLeft ? 'row-reverse' : 'row',
      alignItems: 'center',
      width: bubbleWidth,
    };
  });

  const dragHandleBorder = useAnimatedStyle(() => {
    const handleWidth = 160;
    const centerX = translateX.value + handleWidth / 2;
    const isOnLeft = centerX < screenWidth / 2;
    return {
      borderLeftWidth: isOnLeft ? 1 : 0,
      borderLeftColor: 'rgba(75, 85, 99, 0.4)',
      borderRightWidth: isOnLeft ? 0 : 1,
      borderRightColor: 'rgba(75, 85, 99, 0.4)',
    };
  });

  const contentLayout = useAnimatedStyle(() => {
    const centerX = translateX.value + bubbleWidth / 2;
    const isOnLeft = centerX < screenWidth / 2;
    return {
      flexDirection: isOnLeft ? 'row-reverse' : 'row',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
      gap: 6,
    };
  });

  const getEnvironmentConfig = () => {
    if (environment === 'local') {
      return {
        label: 'LOCAL',
        backgroundColor: '#06B6D4',
        icon: FlaskConical,
        isLocal: true,
      };
    }

    if (environment === 'prod') {
      return {
        label: 'PROD',
        backgroundColor: '#DC2626',
        icon: TestTube2,
        isLocal: false,
      };
    }

    if (environment === 'dev') {
      return {
        label: 'DEV',
        backgroundColor: '#F97316',
        icon: FlaskConical,
        isLocal: false,
      };
    }

    return {
      label: 'LOCAL',
      backgroundColor: '#06B6D4',
      icon: FlaskConical,
      isLocal: true,
    };
  };

  const envConfig = getEnvironmentConfig();
  const isAdmin = userRole === 'admin';
  const isInternal = userRole === 'internal';

  return (
    <>
      {!isModalOpen && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              zIndex: 1001,
            },
            animatedStyle,
          ]}
          sentry-label="ignore floating status bubble"
        >
          <Animated.View
            style={[
              {
                alignItems: 'center',
                backgroundColor: '#171717',
                borderRadius: 6,
                elevation: 8,
                overflow: 'hidden',
                width: bubbleWidth,
              },
              bubbleLayout,
              isDragging ? styles.dragShadow : styles.normalShadow,
              animatedBorderStyle,
            ]}
          >
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
                    flexShrink: 0, // Prevent handle from shrinking
                  },
                  dragHandleBorder,
                ]}
              >
                <GripVertical size={12} color="rgba(156, 163, 175, 0.8)" />
              </Animated.View>
            </GestureDetector>

            <Animated.View style={contentLayout}>
              <View
                onLayout={handleEnvLabelLayout}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  flexShrink: 0,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: envConfig.backgroundColor,
                    marginRight: 6,
                    shadowColor: envConfig.backgroundColor,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    fontFamily: 'Poppins-SemiBold',
                    color: '#F9FAFB',
                    letterSpacing: 0.5,
                  }}
                >
                  {envConfig.label}
                </Text>
              </View>

              <View
                style={{
                  width: 1,
                  height: 12,
                  backgroundColor: 'rgba(107, 114, 128, 0.4)',
                  flexShrink: 0,
                }}
              />

              <TouchableOpacity
                onLayout={handleStatusLayout}
                sentry-label="ignore toggle admin modal button"
                accessibilityRole="button"
                onPress={handlePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isDragging}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  flexShrink: 0,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isAdmin ? '#10B981' : isInternal ? '#6366F1' : '#6B7280',
                    marginRight: 4,
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '500',
                    fontFamily: 'Poppins-Medium',
                    color: isAdmin ? '#10B981' : isInternal ? '#A5B4FC' : '#9CA3AF',
                    letterSpacing: 0.3,
                  }}
                >
                  {isAdmin ? 'Admin' : isInternal ? 'Internal' : 'User'}
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  width: 1,
                  height: 12,
                  backgroundColor: 'rgba(107, 114, 128, 0.4)',
                  flexShrink: 0,
                }}
              />

              <TouchableOpacity
                sentry-label={`ignore toggle WiFi ${isOnline ? 'On' : 'Off'}`}
                accessibilityRole="button"
                accessibilityLabel={`WiFi ${isOnline ? 'On' : 'Off'}`}
                accessibilityHint={`Tap to turn WiFi ${isOnline ? 'off' : 'on'} for React Query`}
                onPress={handleWifiToggle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isDragging}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  flexShrink: 0,
                }}
              >
                {isOnline ? <Wifi size={16} color="#10B981" /> : <WifiOff size={16} color="#DC2626" />}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}

      <AdminModal bottomSheetModalRef={adminModalRef} onDismiss={handleModalDismiss} />
    </>
  );
}

const styles = StyleSheet.create({
  normalShadow: {
    boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.3)',
  },
  dragShadow: {
    boxShadow: '0px 6px 12px 0px rgba(34, 197, 94, 0.6)',
  },
});
