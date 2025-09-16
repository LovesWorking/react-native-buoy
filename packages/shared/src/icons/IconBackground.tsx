import { Fragment, FC, ReactNode } from "react";
import { View, ViewStyle } from "react-native";

interface IconBackgroundProps {
  size: number;
  glowColor: string;
  variant?: "circuit" | "matrix" | "glitch" | "nodes" | "grid";
  children?: ReactNode;
}

// Consolidated star data
const STARS = [
  { x: 0.1, y: 0.1, size: 1, opacity: 0.3 },
  { x: 0.9, y: 0.1, size: 1.2, opacity: 0.5 },
  { x: 0.05, y: 0.3, size: 0.8, opacity: 0.4 },
  { x: 0.95, y: 0.35, size: 1, opacity: 0.3 },
  { x: 0.15, y: 0.85, size: 1, opacity: 0.5 },
  { x: 0.85, y: 0.9, size: 1.2, opacity: 0.4 },
];

interface CircuitVariant {
  lines: { x: number; width: number; height: number; opacity: number }[];
  nodes: { x: number; y: number }[];
}

interface NodesVariant {
  nodes: { x: number; y: number }[];
}

interface GridVariant {
  lines: number[];
}

interface MatrixVariant {
  lines: number[];
  rain: number[];
}

interface GlitchVariant {
  lines: number[];
  scan: number[];
}

type VariantData = {
  circuit: CircuitVariant;
  nodes: NodesVariant;
  grid: GridVariant;
  matrix: MatrixVariant;
  glitch: GlitchVariant;
};

const VARIANT_DATA: VariantData = {
  circuit: {
    lines: [
      { x: 0.5, width: 0.5, height: 0.9, opacity: 0.15 },
      { x: 0.25, width: 0.3, height: 0.7, opacity: 0.1 },
      { x: 0.75, width: 0.3, height: 0.7, opacity: 0.1 },
    ],
    nodes: [
      { x: 0.5, y: 0.15 },
      { x: 0.25, y: 0.25 },
      { x: 0.75, y: 0.25 },
      { x: 0.5, y: 0.5 },
      { x: 0.25, y: 0.6 },
      { x: 0.75, y: 0.6 },
    ],
  },
  nodes: {
    nodes: [
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.2 },
      { x: 0.15, y: 0.5 },
      { x: 0.85, y: 0.5 },
      { x: 0.2, y: 0.8 },
      { x: 0.8, y: 0.8 },
    ],
  },
  grid: {
    lines: [0.2, 0.35, 0.5, 0.65, 0.8],
  },
  matrix: {
    lines: [0.2, 0.35, 0.5, 0.65, 0.8],
    rain: [0.25, 0.5, 0.75],
  },
  glitch: {
    lines: [0.2, 0.35, 0.5, 0.65, 0.8],
    scan: [0.3, 0.7],
  },
};

export const IconBackground: FC<IconBackgroundProps> = ({
  size,
  glowColor,
  variant = "circuit",
  children,
}) => {
  const scale = size / 24;

  const renderStars = () => (
    <>
      {STARS.map((star, i) => (
        <View
          key={`star-${i}`}
          style={
            {
              position: "absolute",
              width: star.size * scale,
              height: star.size * scale,
              borderRadius: (star.size * scale) / 2,
              backgroundColor: glowColor,
              left: star.x * size - (star.size * scale) / 2,
              top: star.y * size - (star.size * scale) / 2,
              opacity: star.opacity,
            } as ViewStyle
          }
        />
      ))}
    </>
  );

  const renderVariant = () => {
    const data = VARIANT_DATA[variant];
    if (!data) return null;

    if (variant === "circuit") {
      const circuitData = data as CircuitVariant;
      return (
        <>
          {circuitData.lines.map((line, i) => (
            <View
              key={`line-${i}`}
              style={
                {
                  position: "absolute",
                  width: line.width * scale,
                  height: size * line.height,
                  backgroundColor: glowColor,
                  left: line.x * size - (line.width * scale) / 2,
                  top: size * 0.05,
                  opacity: line.opacity,
                } as ViewStyle
              }
            />
          ))}
          {circuitData.nodes.map((node, i) => (
            <View
              key={`node-${i}`}
              style={
                {
                  position: "absolute",
                  width: 2 * scale,
                  height: 2 * scale,
                  borderRadius: scale,
                  backgroundColor: glowColor,
                  left: node.x * size - scale,
                  top: node.y * size - scale,
                  opacity: 0.4,
                } as ViewStyle
              }
            />
          ))}
        </>
      );
    }

    if (variant === "nodes") {
      const nodesData = data as NodesVariant;
      return (
        <>
          {nodesData.nodes.map((node, i) => (
            <Fragment key={`node-${i}`}>
              <View
                style={
                  {
                    position: "absolute",
                    width: Math.abs(0.5 - node.x) * size,
                    height: 0.3 * scale,
                    backgroundColor: glowColor,
                    left: Math.min(node.x * size, size / 2),
                    top: node.y * size,
                    opacity: 0.1,
                  } as ViewStyle
                }
              />
              <View
                style={
                  {
                    position: "absolute",
                    width: 2 * scale,
                    height: 2 * scale,
                    borderRadius: scale,
                    backgroundColor: glowColor,
                    left: node.x * size - scale,
                    top: node.y * size - scale,
                    opacity: 0.5,
                  } as ViewStyle
                }
              />
            </Fragment>
          ))}
        </>
      );
    }

    if (variant === "grid" || variant === "matrix") {
      const gridData = data as GridVariant | MatrixVariant;
      return (
        <>
          {gridData.lines.map((pos, i) => (
            <Fragment key={`grid-${i}`}>
              <View
                style={
                  {
                    position: "absolute",
                    width: 0.2 * scale,
                    height: size * 0.9,
                    backgroundColor: glowColor,
                    left: pos * size,
                    top: size * 0.05,
                    opacity: 0.05,
                  } as ViewStyle
                }
              />
              <View
                style={
                  {
                    position: "absolute",
                    width: size * 0.9,
                    height: 0.2 * scale,
                    backgroundColor: glowColor,
                    left: size * 0.05,
                    top: pos * size,
                    opacity: 0.05,
                  } as ViewStyle
                }
              />
            </Fragment>
          ))}
        </>
      );
    }

    if (variant === "glitch") {
      const glitchData = data as GlitchVariant;
      return (
        <>
          {glitchData.lines.map((y, i) => (
            <View
              key={`glitch-${i}`}
              style={
                {
                  position: "absolute",
                  width: size * 0.4,
                  height: 0.5 * scale,
                  backgroundColor: glowColor,
                  left: size * (0.1 + i * 0.1),
                  top: y * size,
                  opacity: 0.2,
                } as ViewStyle
              }
            />
          ))}
          {glitchData.scan.map((y, i) => (
            <View
              key={`scan-${i}`}
              style={
                {
                  position: "absolute",
                  width: size,
                  height: scale,
                  backgroundColor: glowColor,
                  left: 0,
                  top: size * y,
                  opacity: 0.15,
                } as ViewStyle
              }
            />
          ))}
        </>
      );
    }

    return null;
  };

  return (
    <View
      style={{ width: size, height: size, position: "relative" } as ViewStyle}
    >
      <View
        style={
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: glowColor,
            opacity: 0.05,
          } as ViewStyle
        }
      />
      <View
        style={
          {
            position: "absolute",
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: (size * 0.9) / 2,
            borderWidth: 0.5 * scale,
            borderColor: glowColor,
            opacity: 0.1,
            left: size * 0.05,
            top: size * 0.05,
          } as ViewStyle
        }
      />
      {renderStars()}
      {renderVariant()}
      {children}
    </View>
  );
};
