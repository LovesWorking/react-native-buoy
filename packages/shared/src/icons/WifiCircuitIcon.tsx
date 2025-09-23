import { FC } from "react";
import { View, ViewStyle } from "react-native";
import { IconBackground } from "./IconBackground";

interface WifiIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
  strength?: 0 | 1 | 2 | 3 | 4;
  colorPreset?: "cyan" | "green" | "purple" | "pink" | "yellow" | "orange";
  variant?: "circuit" | "matrix" | "glitch" | "nodes" | "grid";
  noBackground?: boolean;
  showSlash?: boolean;
}

const ColorPresets = {
  cyan: { color: "#00D4FF", glow: "#00D4FF" },
  green: { color: "#00FF88", glow: "#00FF88" },
  purple: { color: "#9945FF", glow: "#9945FF" },
  pink: { color: "#FF45FF", glow: "#FF45FF" },
  yellow: { color: "#FFD700", glow: "#FFD700" },
  orange: { color: "#FF8800", glow: "#FF8800" },
};

// Arc configurations - matching original spacing
const ARCS = [
  { strength: 1, size: 15, topOffset: 0.55, opacity: 0.9 },
  { strength: 2, size: 30, topOffset: 0.45, opacity: 0.8 },
  { strength: 3, size: 45, topOffset: 0.35, opacity: 0.7 },
  { strength: 4, size: 60, topOffset: 0.25, opacity: 0.6 },
];

// Simplified dots
const DOTS = [
  { x: 0.35, y: 0.5, minStrength: 2 },
  { x: 0.65, y: 0.5, minStrength: 2 },
  { x: 0.5, y: 0.3, minStrength: 4 },
];

export const WifiCircuitIcon: FC<WifiIconProps> = ({
  size = 24,
  color,
  glowColor,
  strength = 4,
  colorPreset = "cyan",
  variant = "nodes",
  noBackground = true,
  showSlash = false,
}) => {
  const scale = size / 60;
  const strokeWidth = 2.5 * scale;
  const isOff = strength === 0;

  const preset =
    ColorPresets[colorPreset as keyof typeof ColorPresets] || ColorPresets.cyan;
  const baseColor = color || preset.color;
  const baseGlow = glowColor || preset.glow;
  const activeColor = isOff ? "#333" : baseColor;
  const activeGlow = isOff ? "#333" : baseGlow;

  const iconContent = (
    <>
      {/* Central dot */}
      <View
        style={
          {
            position: "absolute",
            width: 5 * scale,
            height: 5 * scale,
            borderRadius: 2.5 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 2.5 * scale,
            top: size * 0.7,
            opacity: strength > 0 ? 1 : 0.3,
          } as ViewStyle
        }
      />

      {/* WiFi arcs - loop based on strength */}
      {ARCS.filter((arc) => strength >= arc.strength).map((arc, i) => (
        <View
          key={`arc-${i}`}
          style={
            {
              position: "absolute",
              width: arc.size * scale,
              height: arc.size * scale,
              borderRadius: (arc.size * scale) / 2,
              borderWidth: strokeWidth,
              borderColor: activeColor,
              borderTopColor: "transparent",
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              left: size / 2 - (arc.size * scale) / 2,
              top: size * arc.topOffset,
              transform: [{ rotate: "180deg" }],
              opacity: arc.opacity,
            } as ViewStyle
          }
        />
      ))}

      {/* Simplified data dots */}
      {strength > 0 &&
        DOTS.filter((dot) => strength >= dot.minStrength).map((dot, i) => (
          <View
            key={`dot-${i}`}
            style={
              {
                position: "absolute",
                width: 1.5 * scale,
                height: 1.5 * scale,
                borderRadius: 0.75 * scale,
                backgroundColor: activeGlow,
                left: dot.x * size - 0.75 * scale,
                top: dot.y * size,
                opacity: 0.6,
              } as ViewStyle
            }
          />
        ))}

      {/* Simplified slash overlay */}
      {showSlash && (
        <View
          style={
            {
              position: "absolute",
              width: size * 0.7,
              height: strokeWidth * 1.5,
              backgroundColor: activeColor,
              left: size * 0.15,
              top: size * 0.5 - strokeWidth * 0.75,
              opacity: 0.9,
              transform: [{ rotate: "45deg" }],
              borderRadius: strokeWidth,
            } as ViewStyle
          }
        />
      )}
    </>
  );

  if (noBackground) {
    return (
      <View
        style={
          {
            width: size,
            height: size,
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
          } as ViewStyle
        }
      >
        {iconContent}
      </View>
    );
  }

  return (
    <IconBackground size={size} glowColor={activeGlow} variant={variant}>
      {iconContent}
    </IconBackground>
  );
};

export const WifiIcon = WifiCircuitIcon;
