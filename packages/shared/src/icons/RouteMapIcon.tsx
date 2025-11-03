import { FC, Fragment } from "react";
import { View, ViewStyle } from "react-native";
import { IconBackground } from "./IconBackground";

interface RouteMapIconProps {
  size?: number;
  color?: string;
  glowColor?: string;
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green";
  variant?: "circuit" | "matrix" | "glitch" | "nodes" | "grid";
  noBackground?: boolean;
}

const ColorPresets = {
  orange: { color: "#f59e0b", glow: "#f59e0b" },
  cyan: { color: "#00D4FF", glow: "#00D4FF" },
  purple: { color: "#a78bfa", glow: "#a78bfa" },
  pink: { color: "#FF45FF", glow: "#FF45FF" },
  yellow: { color: "#FFD700", glow: "#FFD700" },
  green: { color: "#00FF88", glow: "#00FF88" },
};

// Route nodes - representing different screens/routes in the app
const ROUTE_NODES = [
  { x: 0.5, y: 0.2, size: 1.2, isActive: true }, // Home/root
  { x: 0.25, y: 0.45, size: 1, isActive: false }, // Route 1
  { x: 0.75, y: 0.45, size: 1, isActive: false }, // Route 2
  { x: 0.35, y: 0.7, size: 0.9, isActive: false }, // Route 3
  { x: 0.65, y: 0.7, size: 0.9, isActive: false }, // Route 4
];

// Connections between routes - representing navigation paths
const ROUTE_CONNECTIONS = [
  { from: 0, to: 1 }, // Home to Route 1
  { from: 0, to: 2 }, // Home to Route 2
  { from: 1, to: 3 }, // Route 1 to Route 3
  { from: 2, to: 4 }, // Route 2 to Route 4
];

export const RouteMapIcon: FC<RouteMapIconProps> = ({
  size = 24,
  color,
  glowColor,
  colorPreset = "orange",
  variant = "nodes",
  noBackground = true,
}) => {
  const scale = noBackground ? size / 24 : size / 26;
  const preset =
    ColorPresets[colorPreset as keyof typeof ColorPresets] ||
    ColorPresets.orange;
  const activeColor = color || preset.color;
  const activeGlow = glowColor || preset.glow;

  const iconContent = (
    <>
      {/* Draw connections first (behind nodes) */}
      {ROUTE_CONNECTIONS.map((connection, index) => {
        const fromNode = ROUTE_NODES[connection.from];
        const toNode = ROUTE_NODES[connection.to];

        const startX = fromNode.x * size;
        const startY = fromNode.y * size;
        const endX = toNode.x * size;
        const endY = toNode.y * size;

        const distance = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
        );
        const angle = Math.atan2(endY - startY, endX - startX);

        return (
          <Fragment key={`connection-${index}`}>
            {/* Connection glow */}
            <View
              style={
                {
                  position: "absolute",
                  width: distance,
                  height: 1.5 * scale,
                  backgroundColor: activeGlow,
                  left: startX,
                  top: startY,
                  opacity: 0.15,
                  transform: [
                    { translateY: -0.75 * scale },
                    { rotate: `${angle}rad` },
                  ],
                } as ViewStyle
              }
            />

            {/* Connection line */}
            <View
              style={
                {
                  position: "absolute",
                  width: distance,
                  height: 0.8 * scale,
                  backgroundColor: activeColor,
                  left: startX,
                  top: startY,
                  opacity: 0.5,
                  transform: [
                    { translateY: -0.4 * scale },
                    { rotate: `${angle}rad` },
                  ],
                } as ViewStyle
              }
            />

            {/* Animated direction indicator dots */}
            {[0.3, 0.6].map((position, dotIndex) => (
              <View
                key={`dot-${index}-${dotIndex}`}
                style={
                  {
                    position: "absolute",
                    width: 1 * scale,
                    height: 1 * scale,
                    borderRadius: 0.5 * scale,
                    backgroundColor: activeGlow,
                    left: startX + (endX - startX) * position,
                    top: startY + (endY - startY) * position,
                    opacity: 0.7,
                  } as ViewStyle
                }
              />
            ))}
          </Fragment>
        );
      })}

      {/* Draw route nodes */}
      {ROUTE_NODES.map((node, index) => {
        const nodeX = node.x * size - node.size * 1.5 * scale;
        const nodeY = node.y * size - node.size * 1.5 * scale;

        return (
          <Fragment key={`node-${index}`}>
            {/* Node outer glow */}
            <View
              style={
                {
                  position: "absolute",
                  width: node.size * 4 * scale,
                  height: node.size * 4 * scale,
                  borderRadius: node.size * 2 * scale,
                  backgroundColor: activeGlow,
                  left: nodeX - node.size * 0.5 * scale,
                  top: nodeY - node.size * 0.5 * scale,
                  opacity: node.isActive ? 0.2 : 0.1,
                } as ViewStyle
              }
            />

            {/* Node main circle */}
            <View
              style={
                {
                  position: "absolute",
                  width: node.size * 3 * scale,
                  height: node.size * 3 * scale,
                  borderRadius: node.size * 1.5 * scale,
                  backgroundColor: activeColor,
                  left: nodeX,
                  top: nodeY,
                  opacity: node.isActive ? 0.95 : 0.75,
                } as ViewStyle
              }
            />

            {/* Node inner highlight */}
            <View
              style={
                {
                  position: "absolute",
                  width: node.size * 1.5 * scale,
                  height: node.size * 1.5 * scale,
                  borderRadius: node.size * 0.75 * scale,
                  backgroundColor: "#fff",
                  left: nodeX + node.size * 0.75 * scale,
                  top: nodeY + node.size * 0.75 * scale,
                  opacity: 0.2,
                } as ViewStyle
              }
            />

            {/* Active node indicator */}
            {node.isActive && (
              <>
                <View
                  style={
                    {
                      position: "absolute",
                      width: node.size * 5 * scale,
                      height: node.size * 5 * scale,
                      borderRadius: node.size * 2.5 * scale,
                      borderWidth: 0.5 * scale,
                      borderColor: activeGlow,
                      backgroundColor: "transparent",
                      left: nodeX - node.size * 1 * scale,
                      top: nodeY - node.size * 1 * scale,
                      opacity: 0.4,
                    } as ViewStyle
                  }
                />
                {/* Pulsing center dot */}
                <View
                  style={
                    {
                      position: "absolute",
                      width: node.size * 1 * scale,
                      height: node.size * 1 * scale,
                      borderRadius: node.size * 0.5 * scale,
                      backgroundColor: activeGlow,
                      left: nodeX + node.size * 1 * scale,
                      top: nodeY + node.size * 1 * scale,
                      opacity: 0.9,
                    } as ViewStyle
                  }
                />
              </>
            )}
          </Fragment>
        );
      })}
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

export const RouteIcon = RouteMapIcon;
export const NavigationIcon = RouteMapIcon;

