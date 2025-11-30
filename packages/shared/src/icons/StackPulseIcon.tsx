import { FC } from "react";
import { View, ViewStyle } from "react-native";

interface StackPulseIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
}

export const StackPulseIcon: FC<StackPulseIconProps> = ({
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
      {/* Outer pulse ring (largest, most faded) */}
      <View
        style={
          {
            position: "absolute",
            width: 20 * scale,
            height: 20 * scale,
            borderRadius: 3 * scale,
            borderWidth: 1.5 * scale,
            borderColor: activeGlow,
            backgroundColor: "transparent",
            left: size / 2 - 10 * scale,
            top: size / 2 - 10 * scale,
            opacity: 0.2,
          } as ViewStyle
        }
      />

      {/* Middle pulse ring */}
      <View
        style={
          {
            position: "absolute",
            width: 15 * scale,
            height: 15 * scale,
            borderRadius: 2.5 * scale,
            borderWidth: 1.5 * scale,
            borderColor: activeGlow,
            backgroundColor: "transparent",
            left: size / 2 - 7.5 * scale,
            top: size / 2 - 7.5 * scale,
            opacity: 0.4,
          } as ViewStyle
        }
      />

      {/* Inner component box - the "view" being highlighted */}
      {/* Glow behind */}
      <View
        style={
          {
            position: "absolute",
            width: 12 * scale,
            height: 12 * scale,
            borderRadius: 2 * scale,
            backgroundColor: activeGlow,
            left: size / 2 - 6 * scale,
            top: size / 2 - 6 * scale,
            opacity: 0.15,
          } as ViewStyle
        }
      />

      {/* Main component box */}
      <View
        style={
          {
            position: "absolute",
            width: 10 * scale,
            height: 10 * scale,
            borderRadius: 1.5 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 5 * scale,
            top: size / 2 - 5 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Inner screen/content area */}
      <View
        style={
          {
            position: "absolute",
            width: 7 * scale,
            height: 7 * scale,
            borderRadius: 1 * scale,
            backgroundColor: "#000",
            left: size / 2 - 3.5 * scale,
            top: size / 2 - 3.5 * scale,
            opacity: 0.4,
          } as ViewStyle
        }
      />

      {/* Content lines inside component */}
      <View
        style={
          {
            position: "absolute",
            width: 4 * scale,
            height: 1 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: activeGlow,
            left: size / 2 - 2 * scale,
            top: size / 2 - 2 * scale,
            opacity: 0.7,
          } as ViewStyle
        }
      />
      <View
        style={
          {
            position: "absolute",
            width: 3 * scale,
            height: 1 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: activeGlow,
            left: size / 2 - 2 * scale,
            top: size / 2,
            opacity: 0.5,
          } as ViewStyle
        }
      />
      <View
        style={
          {
            position: "absolute",
            width: 2 * scale,
            height: 1 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: activeGlow,
            left: size / 2 - 2 * scale,
            top: size / 2 + 2 * scale,
            opacity: 0.4,
          } as ViewStyle
        }
      />

      {/* Top highlight on component */}
      <View
        style={
          {
            position: "absolute",
            width: 6 * scale,
            height: 1.5 * scale,
            borderRadius: 0.75 * scale,
            backgroundColor: "#fff",
            left: size / 2 - 3 * scale,
            top: size / 2 - 4.5 * scale,
            opacity: 0.2,
          } as ViewStyle
        }
      />

      {/* Corner accent dots - representing the highlight corners */}
      {[
        { x: 0.15, y: 0.15 },
        { x: 0.85, y: 0.15 },
        { x: 0.15, y: 0.85 },
        { x: 0.85, y: 0.85 },
      ].map((pos, i) => (
        <View
          key={`corner-${i}`}
          style={
            {
              position: "absolute",
              width: 1.5 * scale,
              height: 1.5 * scale,
              borderRadius: 0.75 * scale,
              backgroundColor: activeGlow,
              left: pos.x * size - 0.75 * scale,
              top: pos.y * size - 0.75 * scale,
              opacity: 0.6,
            } as ViewStyle
          }
        />
      ))}
    </View>
  );
};

// Aliases for flexibility
export const RenderPulseIcon = StackPulseIcon;
export const HighlightUpdatesIcon = StackPulseIcon;
