import { Fragment, FC } from "react";
import { View, ViewStyle } from "react-native";
import { IconBackground } from "./IconBackground";

interface StorageStackIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
  colorPreset?: "yellow" | "cyan" | "green" | "purple" | "pink" | "orange";
  variant?: "circuit" | "matrix" | "glitch" | "nodes" | "grid";
  noBackground?: boolean;
}

const ColorPresets = {
  yellow: { color: "#FFD700", glow: "#FFD700" },
  cyan: { color: "#00D4FF", glow: "#00D4FF" },
  green: { color: "#00FF88", glow: "#00FF88" },
  purple: { color: "#9945FF", glow: "#9945FF" },
  pink: { color: "#FF45FF", glow: "#FF45FF" },
  orange: { color: "#FF8800", glow: "#FF8800" },
};

// Simplified cylinder data
const CYLINDERS = [
  { y: 0.25, opacity: 0.9 },
  { y: 0.45, opacity: 0.8 },
  { y: 0.65, opacity: 0.7 },
];

export const StorageStackIcon: FC<StorageStackIconProps> = ({
  size = 24,
  color,
  glowColor,
  colorPreset = "yellow",
  variant = "nodes",
  noBackground = true,
}) => {
  const scale = noBackground ? size / 24 : size / 26;
  const preset =
    ColorPresets[colorPreset as keyof typeof ColorPresets] ||
    ColorPresets.yellow;
  const activeColor = color || preset.color;
  const activeGlow = glowColor || preset.glow;

  const renderCylinder = (y: number, opacity: number, index: number) => (
    <Fragment key={`cylinder-${index}`}>
      {/* Single shadow/glow per cylinder */}
      <View
        style={
          {
            position: "absolute",
            width: 18 * scale,
            height: 8 * scale,
            borderRadius: 4 * scale,
            backgroundColor: activeGlow,
            left: size / 2 - 9 * scale,
            top: y * size - scale,
            opacity: 0.1,
          } as ViewStyle
        }
      />

      {/* Main cylinder body */}
      <View
        style={
          {
            position: "absolute",
            width: 16 * scale,
            height: 6 * scale,
            borderRadius: 3 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 8 * scale,
            top: y * size,
            opacity,
          } as ViewStyle
        }
      />

      {/* Top surface highlight */}
      <View
        style={
          {
            position: "absolute",
            width: 14 * scale,
            height: 2 * scale,
            borderRadius: 1 * scale,
            backgroundColor: "#fff",
            left: size / 2 - 7 * scale,
            top: y * size + 0.5 * scale,
            opacity: 0.15,
          } as ViewStyle
        }
      />

      {/* Edge glow */}
      <View
        style={
          {
            position: "absolute",
            width: 16 * scale,
            height: 6 * scale,
            borderRadius: 3 * scale,
            borderWidth: 0.5 * scale,
            borderColor: activeGlow,
            backgroundColor: "transparent",
            left: size / 2 - 8 * scale,
            top: y * size,
            opacity: 0.3,
          } as ViewStyle
        }
      />
    </Fragment>
  );

  const iconContent = (
    <>
      {/* Render all cylinders with loop */}
      {CYLINDERS.map(({ y, opacity }, index) =>
        renderCylinder(y, opacity, index),
      )}

      {/* Simplified connection lines */}
      {[0.35, 0.55].map((y, i) => (
        <View
          key={`connection-${i}`}
          style={
            {
              position: "absolute",
              width: 0.5 * scale,
              height: 6 * scale,
              backgroundColor: activeGlow,
              left: size / 2 - 0.25 * scale,
              top: y * size,
              opacity: 0.3,
            } as ViewStyle
          }
        />
      ))}

      {/* Minimal data dots - only 3 strategic ones */}
      {[0.25, 0.45, 0.65].map((y, i) => (
        <View
          key={`dot-${i}`}
          style={
            {
              position: "absolute",
              width: 1 * scale,
              height: 1 * scale,
              borderRadius: 0.5 * scale,
              backgroundColor: activeGlow,
              left: size / 2 - 0.5 * scale,
              top: y * size + 2.5 * scale,
              opacity: 0.6,
            } as ViewStyle
          }
        />
      ))}
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
