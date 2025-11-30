import { FC } from "react";
import { View, ViewStyle } from "react-native";

interface RenderCountIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
}

/**
 * RenderCountIcon - Icon for the RENDERS modal tool
 * Shows stacked component layers with a counter indicator,
 * representing render count tracking and component profiling.
 */
export const RenderCountIcon: FC<RenderCountIconProps> = ({
  size = 24,
  color = "#00D4FF",
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
      {/* Bottom layer (back) */}
      <View
        style={
          {
            position: "absolute",
            width: 14 * scale,
            height: 10 * scale,
            borderRadius: 2 * scale,
            backgroundColor: activeGlow,
            left: size / 2 - 7 * scale + 3 * scale,
            top: size / 2 - 5 * scale + 3 * scale,
            opacity: 0.2,
          } as ViewStyle
        }
      />

      {/* Middle layer */}
      <View
        style={
          {
            position: "absolute",
            width: 14 * scale,
            height: 10 * scale,
            borderRadius: 2 * scale,
            backgroundColor: activeGlow,
            left: size / 2 - 7 * scale + 1.5 * scale,
            top: size / 2 - 5 * scale + 1.5 * scale,
            opacity: 0.35,
          } as ViewStyle
        }
      />

      {/* Top layer (front) - main component */}
      <View
        style={
          {
            position: "absolute",
            width: 14 * scale,
            height: 10 * scale,
            borderRadius: 2 * scale,
            borderWidth: 1.5 * scale,
            borderColor: activeColor,
            backgroundColor: "transparent",
            left: size / 2 - 7 * scale,
            top: size / 2 - 5 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Content lines inside top component */}
      <View
        style={
          {
            position: "absolute",
            width: 6 * scale,
            height: 1 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 5 * scale,
            top: size / 2 - 2 * scale,
            opacity: 0.7,
          } as ViewStyle
        }
      />
      <View
        style={
          {
            position: "absolute",
            width: 4 * scale,
            height: 1 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 5 * scale,
            top: size / 2,
            opacity: 0.5,
          } as ViewStyle
        }
      />

      {/* Counter badge (top-right) */}
      <View
        style={
          {
            position: "absolute",
            width: 8 * scale,
            height: 8 * scale,
            borderRadius: 4 * scale,
            backgroundColor: activeColor,
            right: size * 0.1,
            top: size * 0.08,
            opacity: 0.9,
            alignItems: "center",
            justifyContent: "center",
          } as ViewStyle
        }
      >
        {/* Number indicator inside badge */}
        <View
          style={
            {
              width: 3 * scale,
              height: 4 * scale,
              borderRadius: 0.5 * scale,
              backgroundColor: "#000",
              opacity: 0.6,
            } as ViewStyle
          }
        />
      </View>

      {/* Refresh arrow indicator (bottom-left) */}
      <View
        style={
          {
            position: "absolute",
            width: 6 * scale,
            height: 6 * scale,
            borderRadius: 3 * scale,
            borderWidth: 1 * scale,
            borderColor: activeGlow,
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            left: size * 0.08,
            bottom: size * 0.12,
            opacity: 0.6,
            transform: [{ rotate: "-45deg" }],
          } as ViewStyle
        }
      />
      {/* Arrow head */}
      <View
        style={
          {
            position: "absolute",
            width: 0,
            height: 0,
            borderLeftWidth: 2 * scale,
            borderRightWidth: 2 * scale,
            borderBottomWidth: 3 * scale,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: activeGlow,
            left: size * 0.18,
            bottom: size * 0.22,
            opacity: 0.6,
            transform: [{ rotate: "45deg" }],
          } as ViewStyle
        }
      />
    </View>
  );
};
