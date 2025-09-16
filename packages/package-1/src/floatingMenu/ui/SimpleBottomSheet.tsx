import React, { FC, PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, View } from 'react-native';

type Props = PropsWithChildren<{
  visible: boolean;
  onClose?: () => void;
  maxHeight?: number;
  initialHeight?: number;
  header?: React.ReactNode;
}>;

export const SimpleBottomSheet: FC<Props> = ({
  visible,
  onClose,
  maxHeight = Dimensions.get('window').height * 0.9,
  initialHeight = Math.floor(Dimensions.get('window').height * 0.33),
  header,
  children,
}) => {
  // Start hidden just below the screen by the sheet height
  const translateY = useRef(new Animated.Value(initialHeight)).current;

  useEffect(() => {
    if (visible) {
      // Slide up into view
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset to hidden position for next open
      translateY.setValue(initialHeight);
    }
  }, [visible, initialHeight, translateY]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight,
            transform: [{ translateY }],
          },
        ]}
      >
        {header}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,12,20,0.98)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(0,184,230,0.3)',
    paddingBottom: 12,
  },
  content: {
    paddingHorizontal: 12,
  },
});
