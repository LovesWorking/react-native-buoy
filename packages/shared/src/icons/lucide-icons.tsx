import { ComponentType } from "react";
import { View, ViewStyle, ViewProps } from "react-native";
// Import all complex icons from original that don't have optimized versions
import * as OriginalIcons from "./lucide-icons-original-full";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
}

interface SvgProps extends Omit<ViewProps, "style"> {
  width: number;
  height: number;
  viewBox: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

// Optimized helper components
const Svg = ({
  width,
  height,
  viewBox,
  children,
  style,
  ...props
}: SvgProps) => {
  const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number);
  const scaleX = width / vbWidth;
  const scaleY = height / vbHeight;

  return (
    <View
      style={[
        { width, height, position: "relative", overflow: "hidden" },
        style,
      ]}
      {...props}
    >
      <View
        style={{
          transform: [{ scaleX }, { scaleY }],
          transformOrigin: "top left",
          width: vbWidth,
          height: vbHeight,
        }}
      >
        {children}
      </View>
    </View>
  );
};

interface LineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth?: number;
}

const Line = ({ x1, y1, x2, y2, stroke, strokeWidth = 2 }: LineProps) => {
  const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  return (
    <View
      style={{
        position: "absolute",
        left: x1,
        top: y1 - strokeWidth / 2,
        width: length,
        height: strokeWidth,
        backgroundColor: stroke,
        transform: [{ rotate: `${angle}deg` }],
        transformOrigin: "left center",
      }}
    />
  );
};

interface CircleProps {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

const Circle = ({ cx, cy, r, fill, stroke, strokeWidth = 2 }: CircleProps) => (
  <View
    style={{
      position: "absolute",
      left: cx - r,
      top: cy - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      backgroundColor: fill || "transparent",
      borderColor: stroke,
      borderWidth: stroke ? strokeWidth : 0,
    }}
  />
);

interface RectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
}

const Rect = ({
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth = 2,
  rx = 0,
  ry,
}: RectProps) => (
  <View
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
      borderRadius: ry !== undefined ? Math.max(rx, ry) : rx,
      backgroundColor: fill || "transparent",
      borderColor: stroke,
      borderWidth: stroke ? strokeWidth : 0,
    }}
  />
);

// Icons Being Reviewed (Exact Originals)
export const Activity = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={3}
      y1={12}
      x2={7}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={7}
      y1={12}
      x2={10}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={10}
      y1={6}
      x2={14}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={14}
      y1={18}
      x2={17}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={17}
      y1={12}
      x2={21}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const AlertTriangle = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={12}
      y1={3}
      x2={3}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={3}
      x2={21}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={3}
      y1={20}
      x2={21}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={9}
      x2={12}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx={12} cy={16} r={1} fill={color} />
  </Svg>
);

export const Check = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={20}
      y1={6}
      x2={9}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={9}
      y1={17}
      x2={4}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const CheckCircle = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1={16}
      y1={10}
      x2={11}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={11}
      y1={15}
      x2={8}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const ChevronDown = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={6}
      y1={9}
      x2={12}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={15}
      x2={18}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const ChevronLeft = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={15}
      y1={18}
      x2={9}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={9}
      y1={12}
      x2={15}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const ChevronRight = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={9}
      y1={18}
      x2={15}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={15}
      y1={12}
      x2={9}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const ChevronUp = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={18}
      y1={15}
      x2={12}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={9}
      x2={6}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Clock = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1={12}
      y1={6}
      x2={12}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={12}
      x2={16}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Copy = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Rect
      x={8}
      y={8}
      width={12}
      height={12}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <View
      style={{
        position: "absolute",
        left: 4,
        top: 4,
        width: 12,
        height: 12,
        borderRadius: 1,
        borderWidth: strokeWidth,
        borderColor: color,
        borderRightColor: "transparent",
        borderBottomColor: "transparent",
        backgroundColor: "transparent",
      }}
    />
  </Svg>
);

export const Edit3 = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={12}
      y1={20}
      x2={20}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={16}
      y1={4}
      x2={4}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={4}
      y1={16}
      x2={4}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={4}
      y1={20}
      x2={8}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={14}
      y1={2}
      x2={22}
      y2={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Eye = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <View
      style={{
        position: "absolute",
        left: 2,
        top: 8,
        width: 20,
        height: 8,
        borderWidth: strokeWidth,
        borderColor: color,
        borderRadius: 10,
      }}
    />
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const EyeOff = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={17.94}
      y1={17.94}
      x2={14.12}
      y2={14.12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={9.88}
      y1={9.88}
      x2={6.06}
      y2={6.06}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={21}
      y1={21}
      x2={3}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <View
      style={{
        position: "absolute",
        left: 2,
        top: 8,
        width: 20,
        height: 8,
        borderWidth: strokeWidth,
        borderColor: color,
        borderRadius: 10,
      }}
    />
  </Svg>
);

export const FileCode = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Rect
      x={4}
      y={2}
      width={12}
      height={20}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={16}
      y1={2}
      x2={20}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={20}
      y1={6}
      x2={20}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={20}
      y1={22}
      x2={4}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={10}
      y1={9}
      x2={8}
      y2={11}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={11}
      x2={10}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={14}
      y1={9}
      x2={16}
      y2={11}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={16}
      y1={11}
      x2={14}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const FileText = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Rect
      x={4}
      y={2}
      width={12}
      height={20}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={16}
      y1={2}
      x2={20}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={20}
      y1={6}
      x2={20}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={20}
      y1={22}
      x2={4}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={12}
      x2={16}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={16}
      x2={16}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={8}
      x2={13}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Filter = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={22}
      y1={3}
      x2={2}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={2}
      y1={3}
      x2={10}
      y2={12.5}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={22}
      y1={3}
      x2={14}
      y2={12.5}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={10}
      y1={12.5}
      x2={10}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={14}
      y1={12.5}
      x2={14}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const FlaskConical = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={10}
      y1={2}
      x2={10}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={14}
      y1={2}
      x2={14}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={2}
      x2={16}
      y2={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={10}
      y1={9}
      x2={4}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={14}
      y1={9}
      x2={20}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={4}
      y1={21}
      x2={20}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={16}
      x2={16}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const GitBranch = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={6}
      y1={3}
      x2={6}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={6}
      y1={9}
      x2={18}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={18}
      y1={9}
      x2={18}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={18} cy={6} r={3} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={6} cy={6} r={3} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const HardDrive = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Rect
      x={3}
      y={6}
      width={18}
      height={12}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={3}
      y1={12}
      x2={21}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx={6} cy={15} r={1} fill={color} />
    <Circle cx={9} cy={15} r={0.5} fill={color} />
    <Line
      x1={18}
      y1={9}
      x2={21}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Hash = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={4}
      y1={9}
      x2={20}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={4}
      y1={15}
      x2={20}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={10}
      y1={3}
      x2={8}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={16}
      y1={3}
      x2={14}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Info = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1={12}
      y1={16}
      x2={12}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx={12} cy={8} r={1} fill={color} />
  </Svg>
);

export const Key = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={7} cy={12} r={5} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={7} cy={12} r={1.5} fill={color} />
    <Line
      x1={12}
      y1={12}
      x2={21}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={19}
      y1={12}
      x2={19}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={21}
      y1={12}
      x2={21}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Layers = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={12}
      y1={2}
      x2={2}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={2}
      y1={7}
      x2={12}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={12}
      x2={22}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={22}
      y1={7}
      x2={12}
      y2={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={2}
      y1={12}
      x2={12}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={17}
      x2={22}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={2}
      y1={17}
      x2={12}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={22}
      x2={22}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Minus = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={5}
      y1={12}
      x2={19}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Maximize2 = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Top-left corner */}
    <Line x1={5} y1={9} x2={5} y2={5} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={5} y1={5} x2={9} y2={5} stroke={color} strokeWidth={strokeWidth} />
    {/* Top-right corner */}
    <Line x1={15} y1={5} x2={19} y2={5} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={19} y1={5} x2={19} y2={9} stroke={color} strokeWidth={strokeWidth} />
    {/* Bottom-left corner */}
    <Line x1={5} y1={15} x2={5} y2={19} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={5} y1={19} x2={9} y2={19} stroke={color} strokeWidth={strokeWidth} />
    {/* Bottom-right corner */}
    <Line x1={15} y1={19} x2={19} y2={19} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={19} y1={19} x2={19} y2={15} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

/**
 * Icon showing a rectangle docked to the bottom - indicates "dock to bottom sheet"
 * Used when modal is floating and clicking will dock it to bottom
 */
export const DockBottom = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Outer rectangle frame */}
    <Rect
      x={3}
      y={3}
      width={18}
      height={18}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Bottom panel indicator - filled rectangle at bottom */}
    <Rect
      x={3}
      y={14}
      width={18}
      height={7}
      fill={color}
    />
  </Svg>
);

/**
 * Icon showing a floating window with offset shadow - indicates "make floating"
 * Used when modal is bottom sheet and clicking will make it float
 */
export const FloatWindow = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Main floating window */}
    <Rect
      x={3}
      y={3}
      width={14}
      height={14}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Shadow/offset indicator showing it's floating */}
    <Line x1={7} y1={17} x2={7} y2={21} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={7} y1={21} x2={21} y2={21} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={21} y1={21} x2={21} y2={7} stroke={color} strokeWidth={strokeWidth} />
    <Line x1={17} y1={7} x2={21} y2={7} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const Palette = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={8.5} cy={8.5} r={1.5} fill={color} />
    <Circle cx={15.5} cy={8.5} r={1.5} fill={color} />
    <Circle cx={8.5} cy={15.5} r={1.5} fill={color} />
    <Circle cx={15.5} cy={15.5} r={1.5} fill={color} />
  </Svg>
);

export const Pause = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Rect
      x={6}
      y={4}
      width={4}
      height={16}
      stroke={color}
      strokeWidth={strokeWidth}
      fill={color}
    />
    <Rect
      x={14}
      y={4}
      width={4}
      height={16}
      stroke={color}
      strokeWidth={strokeWidth}
      fill={color}
    />
  </Svg>
);

export const Play = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={5}
      y1={3}
      x2={5}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={5}
      y1={3}
      x2={19}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={19}
      y1={12}
      x2={5}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Plus = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={12}
      y1={5}
      x2={12}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={5}
      y1={12}
      x2={19}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const RefreshCw = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={23}
      y1={4}
      x2={23}
      y2={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={23}
      y1={10}
      x2={17}
      y2={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={1}
      y1={20}
      x2={1}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={1}
      y1={14}
      x2={7}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export const Search = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1={21}
      y1={21}
      x2={16.65}
      y2={16.65}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Settings = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1={12}
      y1={1}
      x2={12}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={21}
      x2={12}
      y2={23}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={4.22}
      y1={4.22}
      x2={5.64}
      y2={5.64}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={18.36}
      y1={18.36}
      x2={19.78}
      y2={19.78}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={1}
      y1={12}
      x2={3}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={21}
      y1={12}
      x2={23}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={4.22}
      y1={19.78}
      x2={5.64}
      y2={18.36}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={18.36}
      y1={5.64}
      x2={19.78}
      y2={4.22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Shield = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={12}
      y1={2}
      x2={5}
      y2={5}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={5}
      y1={5}
      x2={5}
      y2={11}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={5}
      y1={11}
      x2={12}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={22}
      x2={19}
      y2={11}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={19}
      y1={11}
      x2={19}
      y2={5}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={19}
      y1={5}
      x2={12}
      y2={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const TestTube2 = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Rect
      x={10}
      y={2}
      width={4}
      height={18}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={4}
      x2={16}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={10}
      y1={14}
      x2={14}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Rect x={11} y={15} width={2} height={4} fill={color} />
  </Svg>
);

export const Trash2 = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={3}
      y1={6}
      x2={21}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={19}
      y1={6}
      x2={19}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={19}
      y1={21}
      x2={5}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={5}
      y1={21}
      x2={5}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={10}
      y1={11}
      x2={10}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={14}
      y1={11}
      x2={14}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={6}
      x2={8}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={8}
      y1={4}
      x2={16}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={16}
      y1={4}
      x2={16}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const X = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={18}
      y1={6}
      x2={6}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={6}
      y1={6}
      x2={18}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const XCircle = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    <Line
      x1={15}
      y1={9}
      x2={9}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={9}
      y1={9}
      x2={15}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Zap = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={13}
      y1={2}
      x2={3}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={3}
      y1={14}
      x2={10}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={10}
      y1={14}
      x2={11}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={11}
      y1={22}
      x2={21}
      y2={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={21}
      y1={10}
      x2={14}
      y2={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={14}
      y1={10}
      x2={13}
      y2={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const Box = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Line
      x1={21}
      y1={16}
      x2={21}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={21}
      y1={8}
      x2={12}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={3}
      x2={3}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={3}
      y1={8}
      x2={3}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={3}
      y1={16}
      x2={12}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={21}
      x2={21}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={21}
      x2={12}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={12}
      x2={12}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={12}
      x2={3}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={12}
      x2={21}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

// AlertOctagon - simplified octagon with exclamation mark (using XCircle as fallback)
export const AlertOctagon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Using a square with cut corners to approximate octagon */}
    <Rect
      x={3}
      y={3}
      width={18}
      height={18}
      rx={4}
      ry={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Exclamation mark */}
    <Line
      x1={12}
      y1={8}
      x2={12}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx={12} cy={16} r={1} fill={color} />
  </Svg>
);

// HelpCircle - circle with question mark
export const HelpCircle = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} />
    {/* Simplified question mark using lines */}
    <Line
      x1={12}
      y1={13}
      x2={12}
      y2={11}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={11}
      x2={12}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={9}
      x2={10}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1={12}
      y1={9}
      x2={14}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx={12} cy={17} r={1} fill={color} />
  </Svg>
);

// Re-export ALL icons from original implementation
// Icons that have optimized versions above will use those
// Icons without optimized versions will use originals

// Re-export icons with Icon suffix for compatibility
export const ActivityIcon = Activity; // Uses optimized version
export const AlertTriangleIcon = AlertTriangle; // Uses optimized version
export const BoxIcon = Box; // Uses optimized version
export const CheckIcon = Check; // Uses optimized version
export const CheckCircleIcon = CheckCircle; // Uses optimized version
export const ChevronDownIcon = ChevronDown; // Uses optimized version
export const ChevronLeftIcon = ChevronLeft; // Uses optimized version
export const ChevronRightIcon = ChevronRight; // Uses optimized version
export const ChevronUpIcon = ChevronUp; // Uses optimized version
export const ClockIcon = Clock; // Uses optimized version
export const CopyIcon = Copy; // Uses optimized version
export const Edit3Icon = Edit3; // Uses optimized version
export const EyeIcon = Eye; // Uses optimized version
export const EyeOffIcon = EyeOff; // Uses optimized version
export const FileCodeIcon = FileCode; // Uses optimized version
export const FileTextIcon = FileText; // Uses optimized version
export const FilterIcon = Filter; // Uses optimized version
export const FlaskConicalIcon = FlaskConical; // Uses optimized version
export const GitBranchIcon = GitBranch; // Uses optimized version
export const HardDriveIcon = HardDrive; // Uses optimized version
export const HashIcon = Hash; // Uses optimized version
export const InfoIcon = Info; // Uses optimized version
export const KeyIcon = Key; // Uses optimized version
export const LayersIcon = Layers; // Uses optimized version
export const Maximize2Icon = Maximize2; // Uses optimized version
export const MinusIcon = Minus; // Uses optimized version
export const PaletteIcon = Palette; // Uses optimized version
export const PauseIcon = Pause; // Uses optimized version
export const PlayIcon = Play; // Uses optimized version
export const PlusIcon = Plus; // Uses optimized version
export const RefreshCwIcon = RefreshCw; // Uses optimized version
export const SearchIcon = Search; // Uses optimized version
export const SettingsIcon = Settings; // Uses optimized version
export const ShieldIcon = Shield; // Uses optimized version
export const TestTube2Icon = TestTube2; // Uses optimized version
export const Trash2Icon = Trash2; // Uses optimized version
export const XIcon = X; // Uses optimized version
export const XCircleIcon = XCircle; // Uses optimized version
export const ZapIcon = Zap; // Uses optimized version

// Re-export complex icons that don't have optimized versions
export const Bug = OriginalIcons.BugIcon;
export const Database = OriginalIcons.DatabaseIcon;
export const Globe = OriginalIcons.GlobeIcon;
export const Wifi = OriginalIcons.WifiIcon;
export const AlertCircle = OriginalIcons.AlertCircleIcon;
export const CheckCircle2 = OriginalIcons.CheckCircle2Icon;
export const Server = OriginalIcons.ServerIcon;
export const Power = OriginalIcons.PowerIcon;
export const Upload = OriginalIcons.UploadIcon;
export const Download = OriginalIcons.DownloadIcon;
export const Lock = OriginalIcons.LockIcon;
export const Unlock = OriginalIcons.UnlockIcon;
export const FileJson = OriginalIcons.FileJsonIcon;
export const Link = OriginalIcons.LinkIcon;
export const Hand = OriginalIcons.HandIcon;
export const Route = OriginalIcons.RouteIcon;
export const Trash = OriginalIcons.TrashIcon;
export const TriangleAlert = OriginalIcons.TriangleAlertIcon;
export const User = OriginalIcons.UserIcon;

// Additional icons from original that weren't included yet
export const BarChart3 = OriginalIcons.BarChart3;
export const BarChart3Icon = OriginalIcons.BarChart3Icon;
export const Cloud = OriginalIcons.Cloud;
export const CloudIcon = OriginalIcons.CloudIcon;
export const Film = OriginalIcons.Film;
export const FilmIcon = OriginalIcons.FilmIcon;
export const Image = OriginalIcons.Image;
export const ImageIcon = OriginalIcons.ImageIcon;
export const Music = OriginalIcons.Music;
export const MusicIcon = OriginalIcons.MusicIcon;
export const Navigation = OriginalIcons.Navigation;
export const NavigationIcon = OriginalIcons.NavigationIcon;
export const Phone = OriginalIcons.Phone;
export const PhoneIcon = OriginalIcons.PhoneIcon;
export const Smartphone = OriginalIcons.Smartphone;
export const SmartphoneIcon = OriginalIcons.SmartphoneIcon;
export const Timer = OriginalIcons.Timer;
export const TimerIcon = OriginalIcons.TimerIcon;
export const Touchpad = OriginalIcons.Touchpad;
export const TouchpadIcon = OriginalIcons.TouchpadIcon;
export const Users = OriginalIcons.Users;
export const UsersIcon = OriginalIcons.UsersIcon;
export const Volume = OriginalIcons.Volume;
export const VolumeIcon = OriginalIcons.VolumeIcon;

// Re-export additional Icon-suffixed versions from original
export const BugIcon = OriginalIcons.BugIcon;
export const DatabaseIcon = OriginalIcons.DatabaseIcon;
export const GlobeIcon = OriginalIcons.GlobeIcon;
export const WifiIcon = OriginalIcons.WifiIcon;
export const AlertCircleIcon = OriginalIcons.AlertCircleIcon;
export const CheckCircle2Icon = OriginalIcons.CheckCircle2Icon;
export const ServerIcon = OriginalIcons.ServerIcon;
export const PowerIcon = OriginalIcons.PowerIcon;
export const UploadIcon = OriginalIcons.UploadIcon;
export const DownloadIcon = OriginalIcons.DownloadIcon;
export const LockIcon = OriginalIcons.LockIcon;
export const UnlockIcon = OriginalIcons.UnlockIcon;
export const FileJsonIcon = OriginalIcons.FileJsonIcon;
export const LinkIcon = OriginalIcons.LinkIcon;
export const HandIcon = OriginalIcons.HandIcon;
export const RouteIcon = OriginalIcons.RouteIcon;
export const TrashIcon = OriginalIcons.TrashIcon;
export const TriangleAlertIcon = OriginalIcons.TriangleAlertIcon;
export const UserIcon = OriginalIcons.UserIcon;

// Export types
export type { IconProps };
export type LucideIcon = ComponentType<IconProps>;
