import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

interface CyberpunkIconContainerProps {
  children: ReactNode;
  color: string;
  size?: number;
}

export function CyberpunkIconContainer({
  children,
  color,
  size = 42,
}: CyberpunkIconContainerProps) {
  const borderWidth = 1.5;
  const cornerSize = 4;

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* Main frame background */}
      <View
        style={[
          styles.mainFrame,
          {
            width: size,
            height: size,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderColor: color,
            borderWidth: borderWidth,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
          },
        ]}
      />

      {/* Inner frame */}
      <View
        style={[
          styles.innerFrame,
          {
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
            borderColor: color,
            borderWidth: 0.5,
            opacity: 0.4,
          },
        ]}
      />

      {/* Corner accents */}
      {/* Top left */}
      <View
        style={[
          styles.cornerAccent,
          {
            top: 0,
            left: 0,
            width: cornerSize,
            height: borderWidth,
            backgroundColor: color,
            opacity: 0.8,
          },
        ]}
      />
      <View
        style={[
          styles.cornerAccent,
          {
            top: 0,
            left: 0,
            width: borderWidth,
            height: cornerSize,
            backgroundColor: color,
            opacity: 0.8,
          },
        ]}
      />

      {/* Top right */}
      <View
        style={[
          styles.cornerAccent,
          {
            top: 0,
            right: 0,
            width: cornerSize,
            height: borderWidth,
            backgroundColor: color,
            opacity: 0.8,
          },
        ]}
      />
      <View
        style={[
          styles.cornerAccent,
          {
            top: 0,
            right: 0,
            width: borderWidth,
            height: cornerSize,
            backgroundColor: color,
            opacity: 0.8,
          },
        ]}
      />

      {/* Bottom left */}
      <View
        style={[
          styles.cornerAccent,
          {
            bottom: 0,
            left: 0,
            width: cornerSize,
            height: borderWidth,
            backgroundColor: color,
            opacity: 0.8,
          },
        ]}
      />
      <View
        style={[
          styles.cornerAccent,
          {
            bottom: 0,
            left: 0,
            width: borderWidth,
            height: cornerSize,
            backgroundColor: color,
            opacity: 0.8,
          },
        ]}
      />

      {/* Bottom right */}
      <View
        style={[
          styles.cornerAccent,
          {
            bottom: 0,
            right: 0,
            width: cornerSize,
            height: borderWidth,
            backgroundColor: color,
            opacity: 0.8,
          },
        ]}
      />
      <View
        style={[
          styles.cornerAccent,
          {
            bottom: 0,
            right: 0,
            width: borderWidth,
            height: cornerSize,
            backgroundColor: color,
            opacity: 0.8,
          },
        ]}
      />

      {/* Tech detail dots */}
      <View
        style={[
          styles.techDot,
          {
            top: -1,
            left: size / 2 - 1,
            backgroundColor: color,
            opacity: 0.6,
          },
        ]}
      />
      <View
        style={[
          styles.techDot,
          {
            bottom: -1,
            left: size / 2 - 1,
            backgroundColor: color,
            opacity: 0.6,
          },
        ]}
      />
      <View
        style={[
          styles.techDot,
          {
            left: -1,
            top: size / 2 - 1,
            backgroundColor: color,
            opacity: 0.6,
          },
        ]}
      />
      <View
        style={[
          styles.techDot,
          {
            right: -1,
            top: size / 2 - 1,
            backgroundColor: color,
            opacity: 0.6,
          },
        ]}
      />

      {/* Icon content container with glow effect */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainFrame: {
    position: "absolute",
    borderRadius: 2,
  },
  innerFrame: {
    position: "absolute",
    borderRadius: 2,
  },
  cornerAccent: {
    position: "absolute",
  },
  techDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
  },
});
