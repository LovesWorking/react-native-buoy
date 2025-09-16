import { ReactNode, useState, useRef } from "react";
import { View, ViewStyle, Pressable, Animated, StyleSheet } from "react-native";

interface CyberpunkButtonOutlineProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accentColor?: string;
  index?: number;
}

export function CyberpunkButtonOutline({
  children,
  onPress,
  style,
  accentColor = "#00ffff",
}: CyberpunkButtonOutlineProps) {
  const [isPressed, setIsPressed] = useState(false);
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cornerCutSize = 15;
  const borderWidth = isPressed ? 3 : 2.5;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View
        style={{
          position: "relative",
          height: 80,
          marginBottom: 12,
          transform: [{ scale: animatedScale }],
          opacity: animatedOpacity,
        }}
      >
        {/* Main border frame */}
        <View
          style={[
            styles.mainFrame,
            {
              borderColor: accentColor,
              borderWidth: borderWidth,
              opacity: isPressed ? 1 : 0.95,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
            },
          ]}
        >
          {/* Cut corners overlay */}
          {/* Top left corner cut */}
          <View
            style={[
              styles.cornerCut,
              {
                top: -borderWidth,
                left: -borderWidth,
                width: cornerCutSize,
                height: cornerCutSize,
                borderRightWidth: borderWidth,
                borderBottomWidth: borderWidth,
                borderRightColor: accentColor,
                borderBottomColor: accentColor,
                backgroundColor: style?.backgroundColor || "transparent",
                transform: [{ rotate: "0deg" }],
              },
            ]}
          />

          {/* Top right corner cut */}
          <View
            style={[
              styles.cornerCut,
              {
                top: -borderWidth,
                right: -borderWidth,
                width: cornerCutSize,
                height: cornerCutSize,
                borderLeftWidth: borderWidth,
                borderBottomWidth: borderWidth,
                borderLeftColor: accentColor,
                borderBottomColor: accentColor,
                backgroundColor: style?.backgroundColor || "transparent",
                transform: [{ rotate: "0deg" }],
              },
            ]}
          />

          {/* Bottom left corner cut */}
          <View
            style={[
              styles.cornerCut,
              {
                bottom: -borderWidth,
                left: -borderWidth,
                width: cornerCutSize,
                height: cornerCutSize,
                borderRightWidth: borderWidth,
                borderTopWidth: borderWidth,
                borderRightColor: accentColor,
                borderTopColor: accentColor,
                backgroundColor: style?.backgroundColor || "transparent",
                transform: [{ rotate: "0deg" }],
              },
            ]}
          />

          {/* Bottom right corner cut */}
          <View
            style={[
              styles.cornerCut,
              {
                bottom: -borderWidth,
                right: -borderWidth,
                width: cornerCutSize,
                height: cornerCutSize,
                borderLeftWidth: borderWidth,
                borderTopWidth: borderWidth,
                borderLeftColor: accentColor,
                borderTopColor: accentColor,
                backgroundColor: style?.backgroundColor || "transparent",
                transform: [{ rotate: "0deg" }],
              },
            ]}
          />
        </View>

        {/* Inner border for double-line effect */}
        <View
          style={[
            styles.innerFrame,
            {
              top: 3,
              left: 3,
              right: 3,
              bottom: 3,
              borderColor: accentColor,
              borderWidth: 1.5,
              opacity: 0.6,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
            },
          ]}
        />

        {/* Corner accent lines */}
        {/* Top left */}
        <View
          style={[
            styles.accentLine,
            {
              top: 5,
              left: cornerCutSize,
              width: 10,
              height: 1,
              backgroundColor: accentColor,
              opacity: 0.6,
            },
          ]}
        />
        <View
          style={[
            styles.accentLine,
            {
              top: cornerCutSize,
              left: 5,
              width: 1,
              height: 10,
              backgroundColor: accentColor,
              opacity: 0.6,
            },
          ]}
        />

        {/* Top right */}
        <View
          style={[
            styles.accentLine,
            {
              top: 5,
              right: cornerCutSize,
              width: 10,
              height: 1,
              backgroundColor: accentColor,
              opacity: 0.6,
            },
          ]}
        />
        <View
          style={[
            styles.accentLine,
            {
              top: cornerCutSize,
              right: 5,
              width: 1,
              height: 10,
              backgroundColor: accentColor,
              opacity: 0.6,
            },
          ]}
        />

        {/* Bottom left */}
        <View
          style={[
            styles.accentLine,
            {
              bottom: 5,
              left: cornerCutSize,
              width: 10,
              height: 1,
              backgroundColor: accentColor,
              opacity: 0.6,
            },
          ]}
        />
        <View
          style={[
            styles.accentLine,
            {
              bottom: cornerCutSize,
              left: 5,
              width: 1,
              height: 10,
              backgroundColor: accentColor,
              opacity: 0.6,
            },
          ]}
        />

        {/* Bottom right */}
        <View
          style={[
            styles.accentLine,
            {
              bottom: 5,
              right: cornerCutSize,
              width: 10,
              height: 1,
              backgroundColor: accentColor,
              opacity: 0.6,
            },
          ]}
        />
        <View
          style={[
            styles.accentLine,
            {
              bottom: cornerCutSize,
              right: 5,
              width: 1,
              height: 10,
              backgroundColor: accentColor,
              opacity: 0.6,
            },
          ]}
        />

        {/* Content container */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            paddingLeft: 35,
            paddingRight: 25,
            paddingVertical: 12,
            justifyContent: "center",
          }}
        >
          {children}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mainFrame: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    bottom: 0,
    borderRadius: 2,
  },
  innerFrame: {
    position: "absolute",
    borderRadius: 2,
  },
  cornerCut: {
    position: "absolute",
  },
  accentLine: {
    position: "absolute",
  },
});