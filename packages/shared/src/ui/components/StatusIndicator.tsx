import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Info,
  LucideIcon,
} from "../../icons";
import { gameUIColors } from "../gameUI";

export type StatusType = "success" | "error" | "warning" | "pending" | "info";

interface StatusIndicatorProps {
  status: StatusType;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  label?: string;
  showIcon?: boolean;
  animated?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  variant?: "dot" | "icon" | "badge" | "text";
}

const statusConfig: Record<
  StatusType,
  {
    color: string;
    icon: LucideIcon;
    label: string;
    bgColor: string;
  }
> = {
  success: {
    color: gameUIColors.success,
    icon: CheckCircle,
    label: "Success",
    bgColor: gameUIColors.success + "20",
  },
  error: {
    color: gameUIColors.error,
    icon: XCircle,
    label: "Error",
    bgColor: gameUIColors.error + "20",
  },
  warning: {
    color: gameUIColors.warning,
    icon: AlertCircle,
    label: "Warning",
    bgColor: gameUIColors.warning + "20",
  },
  pending: {
    color: gameUIColors.warning,
    icon: Clock,
    label: "Pending",
    bgColor: gameUIColors.warning + "20",
  },
  info: {
    color: gameUIColors.primary,
    icon: Info,
    label: "Info",
    bgColor: gameUIColors.primary + "20",
  },
};

export function StatusIndicator({
  status,
  size = "medium",
  showLabel = false,
  label,
  showIcon = true,
  animated = false,
  style,
  labelStyle,
  variant = "icon",
}: StatusIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const config = statusConfig[status];

  const sizeConfig = {
    small: { iconSize: 12, fontSize: 10, dotSize: 6, padding: 4 },
    medium: { iconSize: 16, fontSize: 12, dotSize: 8, padding: 6 },
    large: { iconSize: 20, fontSize: 14, dotSize: 10, padding: 8 },
  };

  const sizes = sizeConfig[size];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  useEffect(() => {
    if (animated && status === "pending") {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animated, status, pulseAnim]);

  if (variant === "dot") {
    return (
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizes.dotSize,
            height: sizes.dotSize,
            backgroundColor: config.color,
            transform:
              animated && status === "pending" ? [{ scale: pulseAnim }] : [],
          },
          style,
        ]}
      />
    );
  }

  if (variant === "text") {
    return (
      <Text
        style={[
          styles.text,
          { color: config.color, fontSize: sizes.fontSize },
          labelStyle,
        ]}
      >
        {displayLabel}
      </Text>
    );
  }

  if (variant === "badge") {
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: config.bgColor,
            paddingHorizontal: sizes.padding,
            paddingVertical: sizes.padding / 2,
          },
          style,
        ]}
      >
        {showIcon && <Icon size={sizes.iconSize} color={config.color} />}
        {showLabel && (
          <Text
            style={[
              styles.badgeLabel,
              { color: config.color, fontSize: sizes.fontSize },
              !showIcon && { marginLeft: 0 },
              labelStyle,
            ]}
          >
            {displayLabel}
          </Text>
        )}
      </View>
    );
  }

  // Default icon variant
  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform:
            animated && status === "pending" ? [{ scale: pulseAnim }] : [],
        },
        style,
      ]}
    >
      <Icon size={sizes.iconSize} color={config.color} />
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: config.color, fontSize: sizes.fontSize },
            labelStyle,
          ]}
        >
          {displayLabel}
        </Text>
      )}
    </Animated.View>
  );
}

interface StatusDotProps {
  status: StatusType;
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
}

StatusIndicator.Dot = function StatusDot({
  status,
  size = 8,
  animated = false,
  style,
}: StatusDotProps) {
  return (
    <StatusIndicator
      status={status}
      variant="dot"
      animated={animated}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        ...(style as any),
      }}
    />
  );
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "small" | "medium" | "large";
  showIcon?: boolean;
  style?: ViewStyle;
}

StatusIndicator.Badge = function StatusBadge({
  status,
  label,
  size = "medium",
  showIcon = true,
  style,
}: StatusBadgeProps) {
  return (
    <StatusIndicator
      status={status}
      variant="badge"
      size={size}
      showIcon={showIcon}
      showLabel={true}
      label={label}
      style={style}
    />
  );
};

interface StatusTextProps {
  status: StatusType;
  label?: string;
  size?: "small" | "medium" | "large";
  style?: TextStyle;
}

StatusIndicator.Text = function StatusText({
  status,
  label,
  size = "medium",
  style,
}: StatusTextProps) {
  return (
    <StatusIndicator
      status={status}
      variant="text"
      size={size}
      label={label}
      labelStyle={style}
    />
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontWeight: "500",
  },
  dot: {
    borderRadius: 100,
  },
  text: {
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 4,
  },
  badgeLabel: {
    fontWeight: "600",
    marginLeft: 4,
  },
});
