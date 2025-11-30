import { FC } from "react";
import { View, ViewStyle } from "react-native";

interface BenchmarkIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
}

/**
 * BenchmarkIcon - Icon for the BENCHMARK dev tool
 * Shows a stopwatch with performance bars, representing
 * performance measurement and benchmarking functionality.
 */
export const BenchmarkIcon: FC<BenchmarkIconProps> = ({
  size = 24,
  color = "#F59E0B",
  glowColor,
}) => {
  const scale = size / 24;
  const activeColor = color;
  const activeGlow = glowColor || color;

  // Center the stopwatch in the icon area
  const centerX = size / 2;
  const centerY = size / 2 + 1 * scale; // Slightly lower to account for button
  const clockRadius = 7 * scale;

  return (
    <View
      style={{
        width: size,
        height: size,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Stopwatch body - outer circle */}
      <View
        style={
          {
            position: "absolute",
            width: clockRadius * 2,
            height: clockRadius * 2,
            borderRadius: clockRadius,
            borderWidth: 1.5 * scale,
            borderColor: activeColor,
            backgroundColor: "transparent",
            left: centerX - clockRadius,
            top: centerY - clockRadius,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Stopwatch inner glow */}
      <View
        style={
          {
            position: "absolute",
            width: 10 * scale,
            height: 10 * scale,
            borderRadius: 5 * scale,
            backgroundColor: activeGlow,
            left: centerX - 5 * scale,
            top: centerY - 5 * scale,
            opacity: 0.15,
          } as ViewStyle
        }
      />

      {/* Stopwatch button (top) */}
      <View
        style={
          {
            position: "absolute",
            width: 4 * scale,
            height: 3 * scale,
            borderRadius: 1 * scale,
            backgroundColor: activeColor,
            left: centerX - 2 * scale,
            top: centerY - clockRadius - 3 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Stopwatch crown/stem - connects button to clock */}
      <View
        style={
          {
            position: "absolute",
            width: 2 * scale,
            height: 2 * scale,
            backgroundColor: activeColor,
            left: centerX - 1 * scale,
            top: centerY - clockRadius - 0.5 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Stopwatch hand - pointing to ~10 o'clock position */}
      <View
        style={
          {
            position: "absolute",
            width: 1.5 * scale,
            height: 5 * scale,
            borderRadius: 1 * scale,
            backgroundColor: activeColor,
            left: centerX - 0.75 * scale,
            top: centerY - 5 * scale,
            opacity: 0.9,
            transform: [{ rotate: "-45deg" }],
            transformOrigin: "bottom center",
          } as ViewStyle
        }
      />

      {/* Center dot */}
      <View
        style={
          {
            position: "absolute",
            width: 2 * scale,
            height: 2 * scale,
            borderRadius: 1 * scale,
            backgroundColor: activeColor,
            left: centerX - 1 * scale,
            top: centerY - 1 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />
    </View>
  );
};
