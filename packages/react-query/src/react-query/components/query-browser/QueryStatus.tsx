import { FC } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { gameUIColors } from "@monorepo/shared";
import { macOSColors } from "@monorepo/shared";

interface QueryStatusProps {
  label: string;
  color: "green" | "yellow" | "gray" | "blue" | "purple" | "red";
  count: number;
  showLabel?: boolean;
  isActive?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  onTouchStart?: (event: GestureResponderEvent) => void;
}

type ColorName = "green" | "yellow" | "gray" | "blue" | "purple" | "red";

const QueryStatus: FC<QueryStatusProps> = ({
  label,
  color,
  count,
  showLabel = true,
  isActive = false,
  onPress,
  onTouchStart,
}) => {
  // Game UI color mapping for status indicators - matching ActionButton style
  const getStatusColors = (colorName: ColorName) => {
    const colorMap = {
      green: {
        bg: macOSColors.semantic.successBackground,
        border: macOSColors.semantic.success + "59",
        dot: macOSColors.semantic.success,
        text: macOSColors.semantic.success,
      },
      yellow: {
        bg: macOSColors.semantic.warningBackground,
        border: macOSColors.semantic.warning + "59",
        dot: macOSColors.semantic.warning,
        text: macOSColors.semantic.warning,
      },
      blue: {
        bg: macOSColors.semantic.infoBackground,
        border: macOSColors.semantic.info + "59",
        dot: macOSColors.semantic.info,
        text: macOSColors.semantic.info,
      },
      purple: {
        bg: macOSColors.semantic.debug + "26",
        border: macOSColors.semantic.debug + "59",
        dot: macOSColors.semantic.debug,
        text: macOSColors.semantic.debug,
      },
      red: {
        bg: macOSColors.semantic.errorBackground,
        border: macOSColors.semantic.error + "59",
        dot: macOSColors.semantic.error,
        text: macOSColors.semantic.error,
      },
      gray: {
        bg: macOSColors.text.muted + "26",
        border: macOSColors.text.muted + "59",
        dot: macOSColors.text.muted,
        text: macOSColors.text.muted,
      },
    };
    return colorMap[colorName] || colorMap.gray;
  };

  const statusColors = getStatusColors(color);

  return (
    <TouchableOpacity
      sentry-label="ignore devtools query status"
      style={[
        styles.queryStatusTag,
        isActive && {
          backgroundColor: statusColors.dot + "15",
          borderColor: statusColors.dot + "40",
        },
      ]}
      disabled={!onPress}
      onPress={onPress}
      onPressIn={onTouchStart}
      activeOpacity={0.7}
    >
      <View style={[styles.dot, { backgroundColor: statusColors.dot }]} />
      {showLabel && (
        <Text style={[styles.label]} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
      )}

      {count > 0 && (
        <Text
          style={[styles.count, { color: statusColors.dot }]}
          numberOfLines={1}
        >
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  queryStatusTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    height: 26,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: macOSColors.text.secondary,
    fontFamily: "system",
  },
  count: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    marginLeft: "auto",
    fontFamily: "system",
  },
});

export default QueryStatus;
