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
            width: 14 * scale,
            height: 14 * scale,
            borderRadius: 7 * scale,
            borderWidth: 1.5 * scale,
            borderColor: activeColor,
            backgroundColor: "transparent",
            left: size / 2 - 7 * scale,
            top: size / 2 - 5 * scale,
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
            left: size / 2 - 5 * scale,
            top: size / 2 - 3 * scale,
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
            left: size / 2 - 2 * scale,
            top: size / 2 - 8 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Stopwatch crown/stem */}
      <View
        style={
          {
            position: "absolute",
            width: 2 * scale,
            height: 2 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 1 * scale,
            top: size / 2 - 5.5 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Stopwatch hand - pointing to ~10 o'clock (active measurement) */}
      <View
        style={
          {
            position: "absolute",
            width: 1.5 * scale,
            height: 4 * scale,
            borderRadius: 1 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 0.75 * scale,
            top: size / 2 - 2 * scale,
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
            left: size / 2 - 1 * scale,
            top: size / 2 - 1 * scale + 2 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Performance bars (bottom-right) - representing metrics */}
      {/* Bar 1 - short */}
      <View
        style={
          {
            position: "absolute",
            width: 2 * scale,
            height: 4 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: activeGlow,
            right: size * 0.12,
            bottom: size * 0.15,
            opacity: 0.6,
          } as ViewStyle
        }
      />

      {/* Bar 2 - medium */}
      <View
        style={
          {
            position: "absolute",
            width: 2 * scale,
            height: 6 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: activeGlow,
            right: size * 0.12 + 3 * scale,
            bottom: size * 0.15,
            opacity: 0.7,
          } as ViewStyle
        }
      />

      {/* Bar 3 - tall */}
      <View
        style={
          {
            position: "absolute",
            width: 2 * scale,
            height: 8 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: activeColor,
            right: size * 0.12 + 6 * scale,
            bottom: size * 0.15,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Recording indicator (top-left) - pulsing dot */}
      <View
        style={
          {
            position: "absolute",
            width: 4 * scale,
            height: 4 * scale,
            borderRadius: 2 * scale,
            backgroundColor: "#EF4444",
            left: size * 0.1,
            top: size * 0.15,
            opacity: 0.9,
          } as ViewStyle
        }
      />
    </View>
  );
};
