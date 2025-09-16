import { Fragment, FC, ReactNode } from "react";
import { View, ViewStyle } from "react-native";

interface IconBackgroundProps {
  size: number;
  glowColor: string;
  variant?: "circuit" | "matrix" | "glitch" | "nodes" | "grid";
  children?: ReactNode;
}

export const IconBackground: FC<IconBackgroundProps> = ({
  size,
  glowColor,
  variant = "circuit",
  children,
}) => {
  const scale = size / 24;

  const renderStars = () => (
    <>
      {/* Starry particles around the edges */}
      {[
        { x: 0.1, y: 0.1, size: 1 },
        { x: 0.9, y: 0.1, size: 1.2 },
        { x: 0.05, y: 0.3, size: 0.8 },
        { x: 0.95, y: 0.35, size: 1 },
        { x: 0.08, y: 0.6, size: 1.2 },
        { x: 0.92, y: 0.65, size: 0.8 },
        { x: 0.15, y: 0.85, size: 1 },
        { x: 0.85, y: 0.9, size: 1.2 },
        { x: 0.05, y: 0.5, size: 0.6 },
        { x: 0.95, y: 0.55, size: 0.6 },
        { x: 0.12, y: 0.95, size: 0.8 },
        { x: 0.88, y: 0.08, size: 0.8 },
      ].map((star, i) => (
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
              opacity: 0.3 + (i % 3) * 0.2,
            } as ViewStyle
          }
        />
      ))}

      {/* Additional tiny stars for depth */}
      {[
        { x: 0.18, y: 0.05, size: 0.4 },
        { x: 0.82, y: 0.03, size: 0.4 },
        { x: 0.03, y: 0.2, size: 0.3 },
        { x: 0.97, y: 0.25, size: 0.4 },
        { x: 0.02, y: 0.75, size: 0.3 },
        { x: 0.98, y: 0.8, size: 0.4 },
        { x: 0.08, y: 0.92, size: 0.3 },
        { x: 0.92, y: 0.95, size: 0.3 },
      ].map((star, i) => (
        <View
          key={`tiny-star-${i}`}
          style={
            {
              position: "absolute",
              width: star.size * scale,
              height: star.size * scale,
              borderRadius: (star.size * scale) / 2,
              backgroundColor: glowColor,
              left: star.x * size - (star.size * scale) / 2,
              top: star.y * size - (star.size * scale) / 2,
              opacity: 0.2 + (i % 2) * 0.1,
            } as ViewStyle
          }
        />
      ))}
    </>
  );

  const renderVariant = () => {
    switch (variant) {
      case "circuit":
        return (
          <>
            {/* Circuit traces */}
            <View
              style={
                {
                  position: "absolute",
                  width: 0.5 * scale,
                  height: size * 0.9,
                  backgroundColor: glowColor,
                  left: size / 2 - 0.25 * scale,
                  top: size * 0.05,
                  opacity: 0.15,
                } as ViewStyle
              }
            />

            {/* Side circuit traces */}
            {[0.25, 0.75].map((x, i) => (
              <View
                key={`trace-${i}`}
                style={
                  {
                    position: "absolute",
                    width: 0.3 * scale,
                    height: size * 0.7,
                    backgroundColor: glowColor,
                    left: x * size,
                    top: size * 0.15,
                    opacity: 0.1,
                  } as ViewStyle
                }
              />
            ))}

            {/* Circuit nodes */}
            {[
              { x: 0.5, y: 0.15 },
              { x: 0.25, y: 0.25 },
              { x: 0.75, y: 0.25 },
              { x: 0.5, y: 0.5 },
              { x: 0.25, y: 0.6 },
              { x: 0.75, y: 0.6 },
              { x: 0.5, y: 0.85 },
            ].map((node, i) => (
              <View
                key={`node-${i}`}
                style={
                  {
                    position: "absolute",
                    width: 2 * scale,
                    height: 2 * scale,
                    borderRadius: 1 * scale,
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

      case "nodes":
        return (
          <>
            {/* Circuit nodes around icon */}
            {[
              { x: 0.2, y: 0.2 },
              { x: 0.8, y: 0.2 },
              { x: 0.15, y: 0.5 },
              { x: 0.85, y: 0.5 },
              { x: 0.2, y: 0.8 },
              { x: 0.8, y: 0.8 },
            ].map((node, i) => (
              <Fragment key={`node-${i}`}>
                {/* Node connection line */}
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

                {/* Node point */}
                <View
                  style={
                    {
                      position: "absolute",
                      width: 2 * scale,
                      height: 2 * scale,
                      borderRadius: 1 * scale,
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

      case "grid":
        return (
          <>
            {/* Background grid */}
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((pos, i) => (
              <Fragment key={`grid-${i}`}>
                {/* Vertical lines */}
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
                {/* Horizontal lines */}
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

            {/* Grid intersection points */}
            {[0.2, 0.5, 0.8].map((x) =>
              [0.2, 0.5, 0.8].map((y) => (
                <View
                  key={`point-${x}-${y}`}
                  style={
                    {
                      position: "absolute",
                      width: 1 * scale,
                      height: 1 * scale,
                      borderRadius: 0.5 * scale,
                      backgroundColor: glowColor,
                      left: x * size - 0.5 * scale,
                      top: y * size - 0.5 * scale,
                      opacity: 0.3,
                    } as ViewStyle
                  }
                />
              ))
            )}
          </>
        );

      case "matrix":
        return (
          <>
            {/* Matrix grid background */}
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((pos, i) => (
              <Fragment key={`matrix-${i}`}>
                {/* Vertical lines */}
                <View
                  style={
                    {
                      position: "absolute",
                      width: 0.2 * scale,
                      height: size * 0.9,
                      backgroundColor: glowColor,
                      left: pos * size,
                      top: size * 0.05,
                      opacity: 0.08,
                    } as ViewStyle
                  }
                />
                {/* Horizontal lines */}
                <View
                  style={
                    {
                      position: "absolute",
                      width: size * 0.9,
                      height: 0.2 * scale,
                      backgroundColor: glowColor,
                      left: size * 0.05,
                      top: pos * size,
                      opacity: 0.08,
                    } as ViewStyle
                  }
                />
              </Fragment>
            ))}

            {/* Matrix code rain effect */}
            {[0.25, 0.5, 0.75].map((x, i) =>
              [0.1, 0.3, 0.5, 0.7, 0.9].map((y, j) => (
                <View
                  key={`code-${i}-${j}`}
                  style={
                    {
                      position: "absolute",
                      width: 0.5 * scale,
                      height: 2 * scale,
                      backgroundColor: glowColor,
                      left: x * size,
                      top: y * size,
                      opacity: 0.2 - j * 0.03,
                    } as ViewStyle
                  }
                />
              ))
            )}
          </>
        );

      case "glitch":
        return (
          <>
            {/* Glitch lines */}
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((y, i) => (
              <View
                key={`glitch-${i}`}
                style={
                  {
                    position: "absolute",
                    width: size * (0.3 + Math.random() * 0.4),
                    height: 0.5 * scale,
                    backgroundColor: glowColor,
                    left: size * (0.1 + i * 0.1),
                    top: y * size,
                    opacity: 0.2 + (i % 2) * 0.1,
                  } as ViewStyle
                }
              />
            ))}

            {/* Static noise dots */}
            {Array.from({ length: 15 }).map((_, i) => (
              <View
                key={`noise-${i}`}
                style={
                  {
                    position: "absolute",
                    width: 0.5 * scale,
                    height: 0.5 * scale,
                    backgroundColor: glowColor,
                    left: Math.random() * size,
                    top: Math.random() * size,
                    opacity: Math.random() * 0.3,
                  } as ViewStyle
                }
              />
            ))}

            {/* Scan lines */}
            <View
              style={
                {
                  position: "absolute",
                  width: size,
                  height: 1 * scale,
                  backgroundColor: glowColor,
                  left: 0,
                  top: size * 0.3,
                  opacity: 0.15,
                } as ViewStyle
              }
            />
            <View
              style={
                {
                  position: "absolute",
                  width: size,
                  height: 1 * scale,
                  backgroundColor: glowColor,
                  left: 0,
                  top: size * 0.7,
                  opacity: 0.15,
                } as ViewStyle
              }
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={{ width: size, height: size, position: "relative" } as ViewStyle}
    >
      {/* Background glow effect */}
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

      {/* Outer ring glow */}
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
