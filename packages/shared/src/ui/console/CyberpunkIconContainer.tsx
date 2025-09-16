import { ReactNode } from "react";
import { View } from "react-native";
import Svg, {
  Path,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  G,
  Circle,
} from "react-native-svg";

interface CyberpunkIconContainerProps {
  children: ReactNode;
  color: string;
  size?: number;
}

export function CyberpunkIconContainer({
  children,
  color,
  size = 42,
}: CyberpunkIconContainerProps) {
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* SVG Background */}
      <Svg
        viewBox="0 0 42 42"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      >
        <Defs>
          <LinearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </LinearGradient>

          <Filter id="iconGlow" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="2" result="coloredBlur" />
            <FeMerge>
              <FeMergeNode in="coloredBlur" />
              <FeMergeNode in="coloredBlur" />
              <FeMergeNode in="SourceGraphic" />
            </FeMerge>
          </Filter>
        </Defs>

        {/* Main frame with angular corners - lighter background */}
        <Path
          d="M 6 2 L 36 2 L 40 6 L 40 36 L 36 40 L 6 40 L 2 36 L 2 6 Z"
          fill="rgba(0, 0, 0, 0.6)"
          stroke={color}
          strokeWidth={1.5}
          filter="url(#iconGlow)"
        />

        {/* Inner frame */}
        <Path
          d="M 8 4 L 34 4 L 38 8 L 38 34 L 34 38 L 8 38 L 4 34 L 4 8 Z"
          fill="none"
          stroke={color}
          strokeWidth={0.5}
          opacity={0.4}
        />

        {/* Corner accents */}
        <G>
          {/* Top left */}
          <Rect x={2} y={2} width={3} height={1} fill={color} opacity={0.8} />
          <Rect x={2} y={2} width={1} height={3} fill={color} opacity={0.8} />

          {/* Top right */}
          <Rect x={37} y={2} width={3} height={1} fill={color} opacity={0.8} />
          <Rect x={39} y={2} width={1} height={3} fill={color} opacity={0.8} />

          {/* Bottom left */}
          <Rect x={2} y={39} width={3} height={1} fill={color} opacity={0.8} />
          <Rect x={2} y={37} width={1} height={3} fill={color} opacity={0.8} />

          {/* Bottom right */}
          <Rect x={37} y={39} width={3} height={1} fill={color} opacity={0.8} />
          <Rect x={39} y={37} width={1} height={3} fill={color} opacity={0.8} />
        </G>

        {/* Tech detail dots */}
        <Circle cx={21} cy={2} r={0.5} fill={color} opacity={0.6} />
        <Circle cx={21} cy={40} r={0.5} fill={color} opacity={0.6} />
        <Circle cx={2} cy={21} r={0.5} fill={color} opacity={0.6} />
        <Circle cx={40} cy={21} r={0.5} fill={color} opacity={0.6} />
      </Svg>

      {/* Icon content container with glow effect */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
        }}
      >
        {children}
      </View>
    </View>
  );
}
