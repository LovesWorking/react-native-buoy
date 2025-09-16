import { Fragment, FC } from "react";
import { View, ViewStyle } from "react-native";
import { IconBackground } from "./IconBackground";

interface SentryBugIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
  colorPreset?: "red" | "purple" | "orange" | "pink" | "cyan" | "green";
  variant?: "circuit" | "matrix" | "glitch" | "nodes" | "grid";
  noBackground?: boolean;
}

const ColorPresets = {
  red: { color: "#FF3366", glow: "#FF3366" },
  purple: { color: "#9945FF", glow: "#9945FF" },
  orange: { color: "#FF8800", glow: "#FF8800" },
  pink: { color: "#FF45FF", glow: "#FF45FF" },
  cyan: { color: "#00D4FF", glow: "#00D4FF" },
  green: { color: "#00FF88", glow: "#00FF88" },
};

// Leg positions simplified
const LEGS = [
  { y: 0.3, side: "left", rotation: -20 },
  { y: 0.5, side: "left", rotation: -20 },
  { y: 0.7, side: "left", rotation: -20 },
  { y: 0.3, side: "right", rotation: 20 },
  { y: 0.5, side: "right", rotation: 20 },
  { y: 0.7, side: "right", rotation: 20 },
];

export const SentryBugIcon: FC<SentryBugIconProps> = ({
  size = 24,
  color,
  glowColor,
  colorPreset = "red",
  variant = "circuit",
  noBackground = true,
}) => {
  const scale = noBackground ? size / 24 : size / 60;
  const preset =
    ColorPresets[colorPreset as keyof typeof ColorPresets] || ColorPresets.red;
  const activeColor = color || preset.color;
  const activeGlow = glowColor || preset.glow;

  const iconContent = (
    <>
      {/* Bug body - main oval */}
      <View
        style={
          {
            position: "absolute",
            width: 12 * scale,
            height: 14 * scale,
            borderRadius: 6 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 6 * scale,
            top: size / 2 - 5 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      />

      {/* Bug head */}
      <View
        style={
          {
            position: "absolute",
            width: 8 * scale,
            height: 6 * scale,
            borderRadius: 4 * scale,
            backgroundColor: activeColor,
            left: size / 2 - 4 * scale,
            top: size / 2 - 9 * scale,
            opacity: 0.95,
          } as ViewStyle
        }
      />

      {/* Single bug glow */}
      <View
        style={
          {
            position: "absolute",
            width: 14 * scale,
            height: 16 * scale,
            borderRadius: 7 * scale,
            backgroundColor: activeGlow,
            left: size / 2 - 7 * scale,
            top: size / 2 - 6 * scale,
            opacity: 0.15,
          } as ViewStyle
        }
      />

      {/* Bug legs - using loop */}
      {LEGS.map((leg, i) => (
        <View
          key={`leg-${i}`}
          style={
            {
              position: "absolute",
              width: 4 * scale,
              height: 0.8 * scale,
              backgroundColor: activeColor,
              [leg.side]: size / 2 - 10 * scale,
              top: size / 2 - 4 * scale + leg.y * 10 * scale,
              transform: [{ rotate: `${leg.rotation}deg` }],
              opacity: 0.8,
            } as ViewStyle
          }
        />
      ))}

      {/* Simplified antennae */}
      {[-15, 15].map((rotation, i) => (
        <Fragment key={`antenna-${i}`}>
          <View
            style={
              {
                position: "absolute",
                width: 0.5 * scale,
                height: 4 * scale,
                backgroundColor: activeColor,
                [i === 0 ? "left" : "right"]: size / 2 - 2 * scale,
                top: size / 2 - 11 * scale,
                transform: [{ rotate: `${rotation}deg` }],
                opacity: 0.7,
              } as ViewStyle
            }
          />
          <View
            style={
              {
                position: "absolute",
                width: 1.5 * scale,
                height: 1.5 * scale,
                borderRadius: 0.75 * scale,
                backgroundColor: activeGlow,
                [i === 0 ? "left" : "right"]: size / 2 - 3 * scale,
                top: size / 2 - 12 * scale,
                opacity: 0.6,
              } as ViewStyle
            }
          />
        </Fragment>
      ))}

      {/* Single center dot */}
      <View
        style={
          {
            position: "absolute",
            width: 1 * scale,
            height: 1 * scale,
            borderRadius: 0.5 * scale,
            backgroundColor: "#fff",
            left: size / 2 - 0.5 * scale,
            top: size / 2,
            opacity: 0.3,
          } as ViewStyle
        }
      />
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
