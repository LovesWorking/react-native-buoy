import { FC } from "react";
import { View, ViewStyle } from "react-native";
import { IconBackground } from "./IconBackground";

interface ReactQueryIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
  colorPreset?: "red" | "orange" | "yellow" | "purple" | "cyan" | "pink";
  variant?: "circuit" | "matrix" | "glitch" | "nodes" | "grid";
  noBackground?: boolean;
}

const ColorPresets = {
  red: { color: "#FF3366", glow: "#FF3366" },
  orange: { color: "#FF8800", glow: "#FF8800" },
  yellow: { color: "#FFD700", glow: "#FFD700" },
  purple: { color: "#9945FF", glow: "#9945FF" },
  cyan: { color: "#00D4FF", glow: "#00D4FF" },
  pink: { color: "#FF45FF", glow: "#FF45FF" },
};

// Simplified orbital dots
const ORBITAL_DOTS = [
  { x: 0.08, y: 0.5 },
  { x: 0.92, y: 0.5 },
  { x: 0.5, y: 0.2 },
  { x: 0.5, y: 0.8 },
];

export const ReactQueryIcon: FC<ReactQueryIconProps> = ({
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

  // Simplified hexagon using loop
  const renderHexagon = () => {
    const hexWidth = 8 * scale;
    const hexHeight = 2.5 * scale;
    const hexLeft = size / 2 - hexWidth / 2;
    const hexTop = size / 2 - hexHeight / 2;
    const rotations = [0, 60, -60];

    return (
      <>
        {rotations.map((rotation, i) => (
          <View
            key={`hex-${i}`}
            style={
              {
                position: "absolute",
                width: hexWidth,
                height: hexHeight,
                backgroundColor: activeColor,
                left: hexLeft,
                top: hexTop,
                transform:
                  rotation !== 0 ? [{ rotate: `${rotation}deg` }] : undefined,
                opacity: 0.9,
              } as ViewStyle
            }
          />
        ))}
        {/* Single hexagon glow */}
        <View
          style={
            {
              position: "absolute",
              width: 10 * scale,
              height: 10 * scale,
              borderRadius: 2 * scale,
              backgroundColor: activeGlow,
              left: size / 2 - 5 * scale,
              top: size / 2 - 5 * scale,
              opacity: 0.15,
            } as ViewStyle
          }
        />
      </>
    );
  };

  // Simplified orbital lines using loop
  const renderOrbitalLines = () => {
    const lineLength = 18 * scale;
    const lineThickness = 2 * scale;
    const orbitRadius = lineThickness / 2;
    const rotations = [0, 60, -60];

    return (
      <>
        {rotations.map((rotation, i) => (
          <View
            key={`orbit-${i}`}
            style={
              {
                position: "absolute",
                width: lineLength,
                height: lineThickness,
                backgroundColor: activeColor,
                borderRadius: orbitRadius,
                left: size / 2 - lineLength / 2,
                top: size / 2 - lineThickness / 2,
                transform:
                  rotation !== 0 ? [{ rotate: `${rotation}deg` }] : undefined,
                opacity: 0.7,
              } as ViewStyle
            }
          />
        ))}
        {/* Simplified dots */}
        {ORBITAL_DOTS.map((dot, i) => (
          <View
            key={`dot-${i}`}
            style={
              {
                position: "absolute",
                width: 2.5 * scale,
                height: 2.5 * scale,
                borderRadius: 1.25 * scale,
                backgroundColor: activeGlow,
                left: dot.x * size - 1.25 * scale,
                top: dot.y * size - 1.25 * scale,
                opacity: 0.5,
              } as ViewStyle
            }
          />
        ))}
      </>
    );
  };

  const iconContent = (
    <>
      {renderOrbitalLines()}
      {renderHexagon()}
      {/* Single outer ring glow */}
      <View
        style={
          {
            position: "absolute",
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.35,
            borderWidth: 0.5 * scale,
            borderColor: activeGlow,
            left: size * 0.15,
            top: size * 0.15,
            opacity: 0.2,
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
