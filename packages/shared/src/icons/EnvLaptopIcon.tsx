import { FC } from "react";
import { View, ViewStyle } from "react-native";
import { IconBackground } from "./IconBackground";

interface EnvLaptopIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
  colorPreset?: "green" | "cyan" | "purple" | "pink" | "yellow" | "orange";
  variant?: "circuit" | "matrix" | "glitch" | "nodes" | "grid";
  noBackground?: boolean;
}

const ColorPresets = {
  green: { color: "#00FF88", glow: "#00FF88" },
  cyan: { color: "#00D4FF", glow: "#00D4FF" },
  purple: { color: "#9945FF", glow: "#9945FF" },
  pink: { color: "#FF45FF", glow: "#FF45FF" },
  yellow: { color: "#FFD700", glow: "#FFD700" },
  orange: { color: "#FF8800", glow: "#FF8800" },
};

// Keyboard layout - two rows of keys for realistic appearance
const KEYBOARD_ROW_1 = [1, 3, 5, 7, 9, 11, 13, 15, 17]; // Top row keys
const KEYBOARD_ROW_2 = [2, 4, 6, 8, 10, 12, 14, 16]; // Bottom row keys
const SPACEBAR = { x: 5, width: 10, y: 5.5 }; // Spacebar

// Simplified screen dots
const SCREEN_DOTS = [
  { x: 0.3, y: 0.3 },
  { x: 0.7, y: 0.3 },
  { x: 0.5, y: 0.7 },
];

export const EnvLaptopIcon: FC<EnvLaptopIconProps> = ({
  size = 24,
  color,
  glowColor,
  colorPreset = "green",
  variant = "circuit",
  noBackground = true,
}) => {
  const scale = noBackground ? size / 24 : size / 40;
  const preset =
    ColorPresets[colorPreset as keyof typeof ColorPresets] ||
    ColorPresets.green;
  const activeColor = color || preset.color;
  const activeGlow = glowColor || preset.glow;

  const iconContent = (
    <>
      {/* Laptop base/keyboard */}
      <View
        style={
          {
            position: "absolute",
            width: 20 * scale,
            height: 8 * scale,
            backgroundColor: activeColor,
            borderRadius: 1 * scale,
            left: size / 2 - 10 * scale,
            top: size / 2 + 4 * scale,
            opacity: 0.85,
          } as ViewStyle
        }
      >
        {/* Top row of keys */}
        {KEYBOARD_ROW_1.map((x, i) => (
          <View
            key={`key1-${i}`}
            style={
              {
                position: "absolute",
                width: 1.5 * scale,
                height: 1.2 * scale,
                backgroundColor: "#000",
                opacity: 0.3,
                left: x * scale,
                top: 1.5 * scale,
                borderRadius: 0.2 * scale,
              } as ViewStyle
            }
          />
        ))}

        {/* Bottom row of keys */}
        {KEYBOARD_ROW_2.map((x, i) => (
          <View
            key={`key2-${i}`}
            style={
              {
                position: "absolute",
                width: 1.5 * scale,
                height: 1.2 * scale,
                backgroundColor: "#000",
                opacity: 0.3,
                left: x * scale,
                top: 3.2 * scale,
                borderRadius: 0.2 * scale,
              } as ViewStyle
            }
          />
        ))}

        {/* Spacebar */}
        <View
          style={
            {
              position: "absolute",
              width: SPACEBAR.width * scale,
              height: 1 * scale,
              backgroundColor: "#000",
              opacity: 0.25,
              left: SPACEBAR.x * scale,
              top: SPACEBAR.y * scale,
              borderRadius: 0.2 * scale,
            } as ViewStyle
          }
        />
      </View>

      {/* Single base glow */}
      <View
        style={
          {
            position: "absolute",
            width: 22 * scale,
            height: 10 * scale,
            backgroundColor: activeGlow,
            borderRadius: 1 * scale,
            left: size / 2 - 11 * scale,
            top: size / 2 + 3 * scale,
            opacity: 0.15,
          } as ViewStyle
        }
      />

      {/* Laptop screen */}
      <View
        style={
          {
            position: "absolute",
            width: 18 * scale,
            height: 12 * scale,
            backgroundColor: activeColor,
            borderRadius: 1 * scale,
            left: size / 2 - 9 * scale,
            top: size / 2 - 10 * scale,
            opacity: 0.9,
          } as ViewStyle
        }
      >
        {/* Screen inner */}
        <View
          style={
            {
              position: "absolute",
              width: 16 * scale,
              height: 10 * scale,
              backgroundColor: "#000",
              opacity: 0.5,
              left: 1 * scale,
              top: 1 * scale,
              borderRadius: 0.5 * scale,
            } as ViewStyle
          }
        />

        {/* Simplified code lines */}
        {[2, 4, 6].map((y, i) => (
          <View
            key={i}
            style={
              {
                position: "absolute",
                width: (10 - i * 3) * scale,
                height: 0.5 * scale,
                backgroundColor: activeGlow,
                opacity: 0.6,
                left: 2 * scale,
                top: y * scale,
              } as ViewStyle
            }
          />
        ))}
      </View>

      {/* Power indicator */}
      <View
        style={
          {
            position: "absolute",
            width: 2 * scale,
            height: 1 * scale,
            backgroundColor: activeGlow,
            borderRadius: 0.5 * scale,
            left: size / 2 - 1 * scale,
            top: size / 2 + 10 * scale,
            opacity: 0.8,
          } as ViewStyle
        }
      />

      {/* Simplified screen dots */}
      {SCREEN_DOTS.map((dot, i) => (
        <View
          key={`dot-${i}`}
          style={
            {
              position: "absolute",
              width: 1 * scale,
              height: 1 * scale,
              borderRadius: 0.5 * scale,
              backgroundColor: activeGlow,
              left: size / 2 - 9 * scale + dot.x * 18 * scale,
              top: size / 2 - 10 * scale + dot.y * 12 * scale,
              opacity: 0.4,
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

export const ServerIcon = EnvLaptopIcon;
export const LaptopIcon = EnvLaptopIcon;
