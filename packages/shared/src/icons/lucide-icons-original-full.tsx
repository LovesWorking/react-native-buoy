import { ComponentType, Fragment } from "react";
import { View, ViewStyle, ViewProps } from "react-native";
import { gameUIColors } from "../ui/gameUI";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
}

interface PureSvgProps extends Omit<ViewProps, "style"> {
  width: number;
  height: number;
  viewBox: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

// Core helper components with proper sizing
const PureSvg = ({
  width,
  height,
  viewBox,
  children,
  style,
  ...props
}: PureSvgProps) => {
  const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number);
  const scaleX = width / vbWidth;
  const scaleY = height / vbHeight;

  return (
    <View
      style={[
        {
          width,
          height,
          position: "relative",
          overflow: "hidden",
        },
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

interface PureLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth?: number;
}

const PureLine = ({
  x1,
  y1,
  x2,
  y2,
  stroke,
  strokeWidth = 2,
}: PureLineProps) => {
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

interface PureCircleProps {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

const PureCircle = ({
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth = 2,
}: PureCircleProps) => {
  const diameter = r * 2;
  return (
    <View
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: diameter,
        height: diameter,
        borderRadius: r,
        backgroundColor: fill || "transparent",
        borderColor: stroke,
        borderWidth: stroke ? strokeWidth : 0,
      }}
    />
  );
};

interface PureRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
}

const PureRect = ({
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth = 2,
  rx = 0,
}: PureRectProps) => (
  <View
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
      backgroundColor: fill || "transparent",
      borderColor: stroke,
      borderWidth: stroke ? strokeWidth : 0,
      borderRadius: rx,
    }}
  />
);

// IMPROVED WIFI ICON - Using cone shape for perfect WiFi arcs
export const WifiIcon = ({
  size = 1,
  color = "currentColor",
  strokeWidth = 2,
}: IconProps) => {
  const strength = 4;
  const scale = 28 / 60;
  strokeWidth = 4 * scale;
  return (
    <View style={{ position: "relative", width: size, height: size }}>
      {/* Center dot */}
      <View
        style={{
          position: "absolute",
          width: 5 * scale,
          height: 5 * scale,
          borderRadius: 2.5 * scale,
          backgroundColor: color,
          bottom: 0,
          left: size / 2 - 2.5 * scale,
          zIndex: 10,
        }}
      />

      {/* Arcs with rotation to show more curve */}
      {strength >= 2 && (
        <View
          style={{
            position: "absolute",
            bottom: -8 * scale, // Move down to show more arc
            left: size / 2 - 10 * scale,
            transform: [{ rotate: "180deg" }], // Rotate to show bottom half
          }}
        >
          <View
            style={{
              width: 20 * scale,
              height: 20 * scale,
              borderRadius: 10 * scale,
              borderWidth: strokeWidth * scale,
              borderColor: color,
              borderTopColor: "transparent", // Hide top after rotation
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
            }}
          />
        </View>
      )}

      {strength >= 3 && (
        <View
          style={{
            position: "absolute",
            bottom: -14 * scale,
            left: size / 2 - 17 * scale,
            transform: [{ rotate: "180deg" }],
          }}
        >
          <View
            style={{
              width: 34 * scale,
              height: 34 * scale,
              borderRadius: 17 * scale,
              borderWidth: strokeWidth * scale,
              borderColor: color,
              borderTopColor: "transparent",
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
            }}
          />
        </View>
      )}

      {strength >= 4 && (
        <View
          style={{
            position: "absolute",
            bottom: -22 * scale,
            left: size / 2 - 25 * scale,
            transform: [{ rotate: "180deg" }],
          }}
        >
          <View
            style={{
              width: 50 * scale,
              height: 50 * scale,
              borderRadius: 25 * scale,
              borderWidth: strokeWidth * scale,
              borderColor: color,
              borderTopColor: "transparent",
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
            }}
          />
        </View>
      )}
    </View>
  );
};

// SIMPLIFIED SETTINGS ICON - Minimal gear
export const SettingsIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Outer gear circle */}
    <PureCircle
      cx={12}
      cy={12}
      r={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Inner settings circle */}
    <PureCircle
      cx={12}
      cy={12}
      r={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Simple gear teeth as lines */}
    <PureLine
      x1={12}
      y1={1}
      x2={12}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={20}
      x2={12}
      y2={23}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={1}
      y1={12}
      x2={4}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={20}
      y1={12}
      x2={23}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED CLOUD ICON
export const CloudIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Simple cloud using circles */}
    <PureCircle cx={8} cy={15} r={4} stroke={color} strokeWidth={strokeWidth} />
    <PureCircle
      cx={16}
      cy={15}
      r={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureCircle
      cx={12}
      cy={11}
      r={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Bottom rectangle to connect */}
    <PureRect x={8} y={13} width={8} height={6} fill="white" stroke="white" />
  </PureSvg>
);

// SIMPLIFIED PHONE ICON
export const PhoneIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Simple phone shape with rounded corners */}
    <PureRect
      x={5}
      y={15}
      width={6}
      height={6}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureRect
      x={13}
      y={3}
      width={6}
      height={6}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Connecting line */}
    <PureLine
      x1={11}
      y1={15}
      x2={13}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED VOLUME ICON
export const VolumeIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Speaker box */}
    <PureRect
      x={3}
      y={9}
      width={5}
      height={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Speaker cone triangle */}
    <PureLine
      x1={8}
      y1={9}
      x2={11}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={8}
      y1={15}
      x2={11}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={8}
      y1={9}
      x2={8}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Sound waves - simple arcs */}
    <PureLine
      x1={13}
      y1={9}
      x2={13}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={16}
      y1={7}
      x2={16}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={19}
      y1={5}
      x2={19}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED EYE ICON
export const EyeIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Simple eye outline */}
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Iris */}
    <PureCircle
      cx={12}
      cy={12}
      r={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Pupil */}
    <PureCircle cx={12} cy={12} r={2} fill={color} />
  </PureSvg>
);

// SIMPLIFIED EYE OFF ICON
export const EyeOffIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Simple eye outline */}
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Iris */}
    <PureCircle
      cx={12}
      cy={12}
      r={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Diagonal line through */}
    <PureLine
      x1={4}
      y1={4}
      x2={20}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED REFRESH ICON
export const RefreshCwIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Circle with gap */}
    <PureCircle
      cx={12}
      cy={12}
      r={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Arrow heads */}
    <PureLine
      x1={12}
      y1={3}
      x2={15}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={3}
      x2={9}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={21}
      x2={15}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={21}
      x2={9}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED SHIELD ICON
export const ShieldIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Simple shield outline using lines */}
    <PureLine
      x1={12}
      y1={2}
      x2={4}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={2}
      x2={20}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={8}
      x2={4}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={20}
      y1={8}
      x2={20}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={14}
      x2={12}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={20}
      y1={14}
      x2={12}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Check mark inside */}
    <PureLine
      x1={8}
      y1={11}
      x2={11}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={11}
      y1={14}
      x2={16}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED PALETTE ICON
export const PaletteIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Simple circle palette */}
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Paint dots in simple pattern */}
    <PureCircle cx={8} cy={8} r={1} fill={color} />
    <PureCircle cx={16} cy={8} r={1} fill={color} />
    <PureCircle cx={8} cy={14} r={1} fill={color} />
    <PureCircle cx={14} cy={14} r={1} fill={color} />

    {/* Thumb hole */}
    <PureCircle
      cx={17}
      cy={17}
      r={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED HAND ICON
export const HandIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Simple hand outline */}
    <PureRect
      x={7}
      y={11}
      width={10}
      height={10}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Fingers as simple lines */}
    <PureLine
      x1={9}
      y1={11}
      x2={9}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={11}
      x2={12}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={15}
      y1={11}
      x2={15}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Thumb */}
    <PureLine
      x1={7}
      y1={14}
      x2={4}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// Copy all the rest of the existing icons from the original file...
// (I'll include the key ones that are visible in your screenshots)

export const ActivityIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={3}
      y1={12}
      x2={7}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={7}
      y1={12}
      x2={10}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={10}
      y1={6}
      x2={14}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={18}
      x2={17}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={17}
      y1={12}
      x2={21}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED DATABASE ICON
export const DatabaseIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Top cylinder */}
    <PureRect
      x={5}
      y={3}
      width={14}
      height={4}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Middle section */}
    <PureRect
      x={5}
      y={7}
      width={14}
      height={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Bottom cylinder */}
    <PureRect
      x={5}
      y={11}
      width={14}
      height={8}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Horizontal dividers */}
    <PureLine
      x1={5}
      y1={7}
      x2={19}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={5}
      y1={11}
      x2={19}
      y2={11}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const BugIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => {
  const scale = 20 / 30;
  return (
    <View
      style={{
        width: size * 1.5,
        height: size * 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          transform: [{ rotate: "20deg" }],
          position: "relative",
        }}
      >
        {/* Bug body - oval shape */}
        <View
          style={{
            width: 20 * scale,
            height: 26 * scale,
            backgroundColor: color,
            borderRadius: 10 * scale,
            // Create oval/egg shape
            borderTopLeftRadius: 10 * scale,
            borderTopRightRadius: 10 * scale,
            borderBottomLeftRadius: 12 * scale,
            borderBottomRightRadius: 12 * scale,
          }}
        />

        {/* Head */}
        <View
          style={{
            position: "absolute",
            width: 12 * scale,
            height: 8 * scale,
            backgroundColor: color,
            borderRadius: 6 * scale,
            top: -4 * scale,
            left: 4 * scale,
          }}
        />

        {/* Antennae */}
        <View
          style={{
            position: "absolute",
            width: 2 * scale,
            height: 8 * scale,
            backgroundColor: color,
            top: -10 * scale,
            left: 6 * scale,
            transform: [{ rotate: "-15deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 2 * scale,
            height: 8 * scale,
            backgroundColor: color,
            top: -10 * scale,
            right: 6 * scale,
            transform: [{ rotate: "15deg" }],
          }}
        />

        {/* Eyes (white dots on head) */}
        <View
          style={{
            position: "absolute",
            width: 3 * scale,
            height: 3 * scale,
            backgroundColor: "#fff",
            borderRadius: 1.5 * scale,
            top: -2 * scale,
            left: 6 * scale,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 3 * scale,
            height: 3 * scale,
            backgroundColor: "#fff",
            borderRadius: 1.5 * scale,
            top: -2 * scale,
            right: 6 * scale,
          }}
        />

        {/* Legs - 6 total */}
        {[0, 1, 2].map((index) => (
          <Fragment key={index}>
            {/* Left leg */}
            <View
              style={{
                position: "absolute",
                width: 8 * scale,
                height: 2 * scale,
                backgroundColor: color,
                top: (6 + index * 6) * scale,
                left: -6 * scale,
                transform: [{ rotate: "-45deg" }],
              }}
            />
            {/* Right leg */}
            <View
              style={{
                position: "absolute",
                width: 8 * scale,
                height: 2 * scale,
                backgroundColor: color,
                top: (6 + index * 6) * scale,
                right: -6 * scale,
                transform: [{ rotate: "45deg" }],
              }}
            />
          </Fragment>
        ))}
      </View>
    </View>
  );
};
export const ServerIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => {
  const scale = 20 / 30;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Screen */}
      <View
        style={{
          width: 28 * scale,
          height: 18 * scale,
          backgroundColor: color,
          borderRadius: 2 * scale,
          marginBottom: -2 * scale,
        }}
      />

      {/* Screen display */}
      <View
        style={{
          position: "absolute",
          width: 24 * scale,
          height: 14 * scale,
          backgroundColor: "#fff",
          borderRadius: 1 * scale,
          top: 11 * scale,
          opacity: 0.2,
        }}
      />

      {/* Base */}
      <View
        style={{
          width: 36 * scale,
          height: 3 * scale,
          backgroundColor: color,
          borderRadius: 1 * scale,
        }}
      />

      {/* Notch/opening indicator */}
      <View
        style={{
          position: "absolute",
          width: 8 * scale,
          height: 1 * scale,
          backgroundColor: "#fff",
          bottom: 17 * scale,
          opacity: 0.3,
        }}
      />
    </View>
  );
};

export const GlobeIcon = ({
  size = 24,
  color = gameUIColors.env,
  strokeWidth = 2,
  ...props
}: IconProps) => {
  color = gameUIColors.env;
  const scale = size / 24;
  const globeSize = 18 * scale;

  return (
    <View
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Main globe with glow */}
      <View
        style={{
          position: "absolute",
          width: globeSize,
          height: globeSize,
          borderWidth: 2 * scale,
          borderColor: color,
          borderRadius: globeSize / 2,
          top: (size - globeSize) / 2,
          left: (size - globeSize) / 2,
          backgroundColor: gameUIColors.blackTint1,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 4 * scale,
        }}
      />

      {/* Vertical meridian */}
      <View
        style={{
          position: "absolute",
          width: globeSize,
          height: globeSize,
          borderWidth: 2 * scale,
          borderColor: color,
          borderRadius: globeSize / 2,
          top: (size - globeSize) / 2,
          left: (size - globeSize) / 2,
          transform: [{ scaleX: 0.45 }],
          opacity: 0.6,
        }}
      />

      {/* Horizontal equator */}
      <View
        style={{
          position: "absolute",
          width: globeSize,
          height: globeSize,
          borderWidth: 2 * scale,
          borderColor: color,
          borderRadius: globeSize / 2,
          top: (size - globeSize) / 2,
          left: (size - globeSize) / 2,
          transform: [{ scaleX: 1.33 }, { scaleY: 0.6 }],
          opacity: 0.6,
        }}
      />
    </View>
  );
};

export const XIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={6}
      y1={6}
      x2={18}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={18}
      y1={6}
      x2={6}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// IMPROVED CHECK CIRCLE ICON
export const CheckCircle2Icon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Check mark */}
    <PureLine
      x1={8}
      y1={12}
      x2={11}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={11}
      y1={15}
      x2={16}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// IMPROVED X CIRCLE ICON
export const XCircleIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* X marks */}
    <PureLine
      x1={8}
      y1={8}
      x2={16}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={16}
      y1={8}
      x2={8}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED FILE CODE ICON
export const FileCodeIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* File body */}
    <PureRect
      x={5}
      y={2}
      width={14}
      height={20}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* File fold corner */}
    <PureLine
      x1={14}
      y1={2}
      x2={19}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={2}
      x2={14}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={7}
      x2={19}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Simple code symbols < > */}
    <PureLine
      x1={8}
      y1={11}
      x2={10}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={8}
      y1={15}
      x2={10}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={11}
      x2={16}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={15}
      x2={16}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// IMPROVED FILE TEXT ICON
export const FileTextIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* File body */}
    <PureRect
      x={4}
      y={2}
      width={12}
      height={20}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* File corner */}
    <View
      style={{
        position: "absolute",
        left: 14,
        top: 2,
        width: 0,
        height: 0,
        borderLeftWidth: 4,
        borderTopWidth: 4,
        borderLeftColor: color,
        borderTopColor: "transparent",
      }}
    />
    <PureLine
      x1={14}
      y1={6}
      x2={18}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Text lines */}
    <PureLine
      x1={7}
      y1={10}
      x2={13}
      y2={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={7}
      y1={13}
      x2={13}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={7}
      y1={16}
      x2={10}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED FILE JSON ICON
export const FileJsonIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* File body */}
    <PureRect
      x={5}
      y={2}
      width={14}
      height={20}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* File fold corner */}
    <PureLine
      x1={14}
      y1={2}
      x2={19}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={2}
      x2={14}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={7}
      x2={19}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Simple JSON braces { } */}
    <PureLine
      x1={9}
      y1={11}
      x2={9}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={9}
      y1={11}
      x2={10}
      y2={11}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={9}
      y1={15}
      x2={10}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    <PureLine
      x1={15}
      y1={11}
      x2={15}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={11}
      x2={15}
      y2={11}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={15}
      x2={15}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED TEST TUBE ICON
export const TestTube2Icon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Test tube outline */}
    <PureRect
      x={10}
      y={2}
      width={4}
      height={18}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Cork/top */}
    <PureLine
      x1={8}
      y1={4}
      x2={16}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Liquid level */}
    <PureLine
      x1={10}
      y1={14}
      x2={14}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Liquid fill */}
    <PureRect x={11} y={15} width={2} height={4} fill={color} />
  </PureSvg>
);

// SIMPLIFIED FLASK ICON
export const FlaskConicalIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Flask neck */}
    <PureLine
      x1={10}
      y1={2}
      x2={10}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={2}
      x2={14}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Flask opening */}
    <PureLine
      x1={8}
      y1={2}
      x2={16}
      y2={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Flask body - triangle */}
    <PureLine
      x1={10}
      y1={9}
      x2={4}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={9}
      x2={20}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={21}
      x2={20}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Liquid level */}
    <PureLine
      x1={8}
      y1={16}
      x2={16}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// IMPROVED TRASH ICON
export const Trash2Icon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Trash can body */}
    <PureRect
      x={5}
      y={7}
      width={14}
      height={14}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Top rim */}
    <PureLine
      x1={3}
      y1={7}
      x2={21}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Handle */}
    <PureRect
      x={9}
      y={3}
      width={6}
      height={4}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Vertical lines */}
    <PureLine
      x1={10}
      y1={11}
      x2={10}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={11}
      x2={14}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// IMPROVED HASH ICON
export const HashIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Horizontal lines */}
    <PureLine
      x1={4}
      y1={9}
      x2={20}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={15}
      x2={20}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Vertical lines */}
    <PureLine
      x1={10}
      y1={3}
      x2={8}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={16}
      y1={3}
      x2={14}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// IMPROVED USERS ICON
export const UsersIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* First user head */}
    <PureCircle cx={9} cy={8} r={3} stroke={color} strokeWidth={strokeWidth} />
    {/* First user body */}
    <View
      style={{
        position: "absolute",
        left: 4,
        top: 14,
        width: 10,
        height: 6,
        borderRadius: 5,
        borderWidth: strokeWidth,
        borderColor: color,
        backgroundColor: "transparent",
      }}
    />
    {/* Second user head */}
    <PureCircle cx={16} cy={7} r={2} stroke={color} strokeWidth={strokeWidth} />
    {/* Second user body */}
    <View
      style={{
        position: "absolute",
        left: 13,
        top: 12,
        width: 6,
        height: 8,
        borderRadius: 3,
        borderWidth: strokeWidth,
        borderColor: color,
        backgroundColor: "transparent",
      }}
    />
  </PureSvg>
);

// SIMPLIFIED BOX ICON
export const BoxIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Box front face */}
    <PureRect
      x={4}
      y={8}
      width={16}
      height={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Box top - simple lines for 3D effect */}
    <PureLine
      x1={4}
      y1={8}
      x2={8}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={20}
      y1={8}
      x2={16}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={8}
      y1={4}
      x2={16}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Tape/opening line */}
    <PureLine
      x1={12}
      y1={4}
      x2={12}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED KEY ICON
export const KeyIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Key head */}
    <PureCircle cx={7} cy={12} r={5} stroke={color} strokeWidth={strokeWidth} />
    {/* Key hole */}
    <PureCircle cx={7} cy={12} r={1.5} fill={color} />
    {/* Key shaft */}
    <PureLine
      x1={12}
      y1={12}
      x2={21}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Simple teeth */}
    <PureLine
      x1={19}
      y1={12}
      x2={19}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={21}
      y1={12}
      x2={21}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED ROUTE ICON
export const RouteIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Start point */}
    <PureCircle cx={5} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
    {/* End point */}
    <PureCircle
      cx={19}
      cy={12}
      r={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Simple connecting line */}
    <PureLine
      x1={8}
      y1={12}
      x2={16}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Direction arrow */}
    <PureLine
      x1={13}
      y1={9}
      x2={16}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={13}
      y1={15}
      x2={16}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED TRIANGLE ALERT ICON
export const TriangleAlertIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Triangle outline */}
    <PureLine
      x1={12}
      y1={3}
      x2={3}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={3}
      x2={21}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={3}
      y1={20}
      x2={21}
      y2={20}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Exclamation mark */}
    <PureLine
      x1={12}
      y1={9}
      x2={12}
      y2={13}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureCircle cx={12} cy={16} r={1} fill={color} />
  </PureSvg>
);

// SIMPLIFIED UNLOCK ICON
export const UnlockIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Lock body */}
    <PureRect
      x={5}
      y={11}
      width={14}
      height={10}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Open shackle - not connected */}
    <PureLine
      x1={7}
      y1={11}
      x2={7}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={7}
      y1={7}
      x2={14}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Keyhole */}
    <PureCircle cx={12} cy={16} r={1} fill={color} />
  </PureSvg>
);

// SIMPLIFIED IMAGE ICON
export const ImageIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Image frame */}
    <PureRect
      x={3}
      y={3}
      width={18}
      height={18}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Sun circle */}
    <PureCircle cx={8} cy={8} r={2} fill={color} />

    {/* Simple mountain */}
    <PureLine
      x1={3}
      y1={21}
      x2={10}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={10}
      y1={14}
      x2={21}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED FILM ICON
export const FilmIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Film strip outline */}
    <PureRect
      x={5}
      y={3}
      width={14}
      height={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Film perforations - simplified */}
    <PureRect x={7} y={5} width={2} height={2} fill={color} />
    <PureRect x={7} y={17} width={2} height={2} fill={color} />
    <PureRect x={15} y={5} width={2} height={2} fill={color} />
    <PureRect x={15} y={17} width={2} height={2} fill={color} />

    {/* Center divider lines */}
    <PureLine
      x1={5}
      y1={12}
      x2={19}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED MUSIC ICON
export const MusicIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Note stem */}
    <PureLine
      x1={8}
      y1={6}
      x2={8}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Flag/beam */}
    <PureLine
      x1={8}
      y1={6}
      x2={18}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={18}
      y1={3}
      x2={18}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={8}
      y1={10}
      x2={18}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Note head */}
    <PureCircle cx={8} cy={18} r={2} fill={color} />
  </PureSvg>
);

// SIMPLIFIED TIMER ICON
export const TimerIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Clock circle */}
    <PureCircle
      cx={12}
      cy={13}
      r={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Timer button on top */}
    <PureLine
      x1={12}
      y1={2}
      x2={12}
      y2={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={9}
      y1={2}
      x2={15}
      y2={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Clock hand */}
    <PureLine
      x1={12}
      y1={13}
      x2={12}
      y2={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED SMARTPHONE ICON
export const SmartphoneIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Phone body */}
    <PureRect
      x={6}
      y={2}
      width={12}
      height={20}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Screen area indicator */}
    <PureLine
      x1={6}
      y1={5}
      x2={18}
      y2={5}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={6}
      y1={19}
      x2={18}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Home button/indicator */}
    <PureLine
      x1={10}
      y1={20.5}
      x2={14}
      y2={20.5}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED LAYERS ICON
export const LayersIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Bottom layer */}
    <PureRect
      x={5}
      y={15}
      width={14}
      height={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Middle layer */}
    <PureRect
      x={5}
      y={10}
      width={14}
      height={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Top layer */}
    <PureRect
      x={5}
      y={5}
      width={14}
      height={4}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED NAVIGATION ICON
export const NavigationIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Simple arrow pointer */}
    <PureLine
      x1={12}
      y1={2}
      x2={5}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={2}
      x2={19}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={5}
      y1={19}
      x2={12}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={19}
      y1={19}
      x2={12}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED TOUCHPAD ICON
export const TouchpadIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Trackpad outline */}
    <PureRect
      x={3}
      y={5}
      width={18}
      height={14}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Click button divider */}
    <PureLine
      x1={12}
      y1={15}
      x2={12}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// IMPROVED BAR CHART ICON
export const AlertCircleIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={8}
      x2={12}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <View
      style={{
        position: "absolute",
        left: 11,
        top: 15,
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: color,
      }}
    />
  </PureSvg>
);

export const AlertTriangleIcon = TriangleAlertIcon;

export const CheckIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={5}
      y1={12}
      x2={10}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={10}
      y1={17}
      x2={19}
      y2={7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const CheckCircleIcon = CheckCircle2Icon;

export const ChevronDownIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={6}
      y1={9}
      x2={12}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={15}
      x2={18}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const ChevronLeftIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={15}
      y1={6}
      x2={9}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={9}
      y1={12}
      x2={15}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const ChevronRightIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={9}
      y1={6}
      x2={15}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={15}
      y1={12}
      x2={9}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const ChevronUpIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={6}
      y1={15}
      x2={12}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={9}
      x2={18}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const ClockIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={6}
      x2={12}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={12}
      x2={16}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const CopyIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureRect
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
  </PureSvg>
);

export const DownloadIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={12}
      y1={3}
      x2={12}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={8}
      y1={11}
      x2={12}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={16}
      y1={11}
      x2={12}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={17}
      x2={20}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={17}
      x2={4}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={20}
      y1={17}
      x2={20}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={21}
      x2={20}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED FILTER ICON
export const FilterIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Funnel shape with lines */}
    <PureLine
      x1={4}
      y1={5}
      x2={20}
      y2={5}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={5}
      x2={10}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={20}
      y1={5}
      x2={14}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={10}
      y1={12}
      x2={10}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={14}
      y1={12}
      x2={14}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED GIT BRANCH ICON
export const GitBranchIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Main line */}
    <PureLine
      x1={6}
      y1={3}
      x2={6}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Branch line */}
    <PureLine
      x1={6}
      y1={9}
      x2={18}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={18}
      y1={9}
      x2={18}
      y2={6}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Circle nodes */}
    <PureCircle cx={6} cy={18} r={3} stroke={color} strokeWidth={strokeWidth} />
    <PureCircle cx={18} cy={6} r={3} stroke={color} strokeWidth={strokeWidth} />
    <PureCircle cx={6} cy={6} r={3} stroke={color} strokeWidth={strokeWidth} />
  </PureSvg>
);

// SIMPLIFIED LINK ICON
export const LinkIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Two chain links */}
    <PureRect
      x={8}
      y={10}
      width={8}
      height={4}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Left link */}
    <PureRect
      x={4}
      y={10}
      width={8}
      height={4}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Right link */}
    <PureRect
      x={12}
      y={10}
      width={8}
      height={4}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const PauseIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureRect x={6} y={4} width={4} height={16} rx={1} fill={color} />
    <PureRect x={14} y={4} width={4} height={16} rx={1} fill={color} />
  </PureSvg>
);

export const PlayIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <View
      style={{
        position: "absolute",
        left: 7,
        top: 4,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: color,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
      }}
    />
  </PureSvg>
);

export const PlusIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={12}
      y1={5}
      x2={12}
      y2={19}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={5}
      y1={12}
      x2={19}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const TrashIcon = Trash2Icon;

export const UploadIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={12}
      y1={15}
      x2={12}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={8}
      y1={7}
      x2={12}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={16}
      y1={7}
      x2={12}
      y2={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={17}
      x2={20}
      y2={17}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={17}
      x2={4}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={20}
      y1={17}
      x2={20}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={4}
      y1={21}
      x2={20}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// SIMPLIFIED ZAP ICON
export const ZapIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Lightning bolt shape */}
    <PureLine
      x1={13}
      y1={2}
      x2={5}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={5}
      y1={14}
      x2={11}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={11}
      y1={14}
      x2={11}
      y2={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={11}
      y1={10}
      x2={19}
      y2={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={19}
      y1={10}
      x2={11}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={11}
      y1={22}
      x2={13}
      y2={14}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={13}
      y1={14}
      x2={13}
      y2={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const UserIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureCircle cx={12} cy={7} r={4} stroke={color} strokeWidth={strokeWidth} />
    <View
      style={{
        position: "absolute",
        left: 5,
        top: 14,
        width: 14,
        height: 7,
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        borderWidth: strokeWidth,
        borderColor: color,
        borderBottomColor: "transparent",
        backgroundColor: "transparent",
      }}
    />
  </PureSvg>
);

export const LockIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureRect
      x={5}
      y={11}
      width={14}
      height={10}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <View
      style={{
        position: "absolute",
        left: 7,
        top: 4,
        width: 10,
        height: 9,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        borderWidth: strokeWidth,
        borderColor: color,
        borderBottomColor: "transparent",
        backgroundColor: "transparent",
      }}
    />
    <View
      style={{
        position: "absolute",
        left: 11,
        top: 15,
        width: 2,
        height: 3,
        backgroundColor: color,
      }}
    />
  </PureSvg>
);

// SIMPLIFIED POWER ICON
export const PowerIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Power circle */}
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Power line */}
    <PureLine
      x1={12}
      y1={2}
      x2={12}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const SearchIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureCircle
      cx={11}
      cy={11}
      r={8}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={16.5}
      y1={16.5}
      x2={21}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const InfoIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureCircle
      cx={12}
      cy={12}
      r={10}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={12}
      y1={11}
      x2={12}
      y2={16}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <View
      style={{
        position: "absolute",
        left: 11,
        top: 7,
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: color,
      }}
    />
  </PureSvg>
);

export const MinusIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    <PureLine
      x1={5}
      y1={12}
      x2={19}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

export const BarChart3Icon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Y axis */}
    <PureLine
      x1={3}
      y1={3}
      x2={3}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* X axis */}
    <PureLine
      x1={3}
      y1={21}
      x2={21}
      y2={21}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Bars */}
    <PureRect x={7} y={12} width={3} height={9} fill={color} />
    <PureRect x={12} y={8} width={3} height={13} fill={color} />
    <PureRect x={17} y={15} width={3} height={6} fill={color} />
  </PureSvg>
);

// IMPROVED HARD DRIVE ICON
export const HardDriveIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Drive body */}
    <PureRect
      x={3}
      y={6}
      width={18}
      height={12}
      rx={2}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Drive separator */}
    <PureLine
      x1={3}
      y1={12}
      x2={21}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Power LED */}
    <PureCircle cx={6} cy={15} r={1} fill={color} />
    {/* Activity LED */}
    <PureCircle cx={9} cy={15} r={0.5} fill={color} />
    {/* Cables */}
    <PureLine
      x1={18}
      y1={9}
      x2={21}
      y2={9}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={18}
      y1={15}
      x2={21}
      y2={15}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// Export aliases for convenience (without "Icon" suffix)
export const Activity = ActivityIcon;
export const AlertCircle = AlertCircleIcon;
export const AlertTriangle = AlertTriangleIcon;
export const BarChart3 = BarChart3Icon;
export const Box = BoxIcon;
export const Bug = BugIcon;
export const Check = CheckIcon;
export const CheckCircle = CheckCircleIcon;
export const CheckCircle2 = CheckCircle2Icon;
export const ChevronDown = ChevronDownIcon;
export const ChevronLeft = ChevronLeftIcon;
export const ChevronRight = ChevronRightIcon;
export const ChevronUp = ChevronUpIcon;
export const Clock = ClockIcon;
export const Cloud = CloudIcon;
export const Copy = CopyIcon;
export const Database = DatabaseIcon;
export const Download = DownloadIcon;
export const Eye = EyeIcon;
export const EyeOff = EyeOffIcon;
export const FileCode = FileCodeIcon;
export const FileJson = FileJsonIcon;
export const FileText = FileTextIcon;
export const Film = FilmIcon;
export const Filter = FilterIcon;
export const FlaskConical = FlaskConicalIcon;
export const GitBranch = GitBranchIcon;
export const Globe = GlobeIcon;
export const Hand = HandIcon;
export const HardDrive = HardDriveIcon;
export const Hash = HashIcon;
export const Image = ImageIcon;
export const Info = InfoIcon;
export const Key = KeyIcon;
export const Layers = LayersIcon;
export const Link = LinkIcon;
export const Lock = LockIcon;
export const Minus = MinusIcon;
export const Music = MusicIcon;
export const Navigation = NavigationIcon;
export const Palette = PaletteIcon;
export const Pause = PauseIcon;
export const Phone = PhoneIcon;
export const Play = PlayIcon;
export const Plus = PlusIcon;
export const Power = PowerIcon;
export const RefreshCw = RefreshCwIcon;
export const Route = RouteIcon;
export const Search = SearchIcon;
export const Server = ServerIcon;
export const Settings = SettingsIcon;
export const Shield = ShieldIcon;
export const Smartphone = SmartphoneIcon;
export const TestTube2 = TestTube2Icon;
export const Timer = TimerIcon;
export const Touchpad = TouchpadIcon;
export const Trash = TrashIcon;
export const Trash2 = Trash2Icon;
export const TriangleAlert = TriangleAlertIcon;
export const Unlock = UnlockIcon;
export const Upload = UploadIcon;
export const User = UserIcon;
export const Users = UsersIcon;
export const Volume = VolumeIcon;
export const Wifi = WifiIcon;
export const X = XIcon;
export const XCircle = XCircleIcon;
export const Zap = ZapIcon;

// Additional aliases for commonly used icons
export const Edit3 = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <PureSvg width={size} height={size} viewBox="0 0 24 24" {...props}>
    {/* Pencil outline */}
    <PureLine
      x1={12}
      y1={20}
      x2={20}
      y2={12}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={16}
      y1={8}
      x2={2}
      y2={22}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <PureLine
      x1={17.5}
      y1={15}
      x2={9}
      y2={6.5}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Pencil tip */}
    <PureRect
      x={20}
      y={2}
      width={4}
      height={4}
      rx={1}
      stroke={color}
      strokeWidth={strokeWidth}
    />

    {/* Edit marks */}
    <PureLine
      x1={2}
      y1={22}
      x2={6}
      y2={18}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </PureSvg>
);

// Type export for icon component props
export type { IconProps };
export type LucideIcon = ComponentType<IconProps>;
