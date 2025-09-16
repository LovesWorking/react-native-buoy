import { ReactNode, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  ViewStyle,
  Dimensions,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface GalaxyButtonProps {
  children: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export function GalaxyButton({ children, onPress, style }: GalaxyButtonProps) {
  const starsTranslateY = useRef(new Animated.Value(0)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Star field animations
    Animated.loop(
      Animated.timing(starsTranslateY, {
        toValue: -135,
        duration: 60000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(starsRotate, {
        toValue: 1,
        duration: 90000,
        useNativeDriver: true,
      })
    ).start();
  }, [starsTranslateY, starsRotate]);

  const rotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Pressable
      onPress={onPress}
      style={[styles.buttonContainer, style]}
      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
    >
      {/* Animated star field behind content */}
      <View style={styles.starsContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.starsLayer,
            {
              transform: [
                { translateY: starsTranslateY },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <View
              key={`star-${i}`}
              style={[
                styles.star,
                {
                  left: Math.random() * screenWidth * 2,
                  top: Math.random() * 400,
                  width: Math.random() * 1.5 + 0.5,
                  height: Math.random() * 1.5 + 0.5,
                  opacity: Math.random() * 0.6 + 0.2,
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>

      {/* Button content */}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: "relative",
    backgroundColor: "rgba(31, 31, 31, 0.85)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  starsLayer: {
    position: "absolute",
    width: screenWidth * 3,
    height: 800,
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 50,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
});
