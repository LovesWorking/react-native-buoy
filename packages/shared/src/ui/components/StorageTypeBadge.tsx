import { View, Text, StyleSheet } from "react-native";
import { Database, Lock, HardDrive } from "../../icons";
import { gameUIColors } from "../gameUI/constants/gameUIColors";

type StorageType = "async" | "mmkv" | "secure";

interface StorageTypeBadgeProps {
  type: StorageType;
  size?: "small" | "medium";
  showIcon?: boolean;
}

export function StorageTypeBadge({
  type,
  size = "small",
  showIcon = true,
}: StorageTypeBadgeProps) {
  const isSmall = size === "small";

  const getStorageColor = () => {
    switch (type) {
      case "async":
        return gameUIColors.storage;
      case "mmkv":
        return gameUIColors.success;
      case "secure":
        return gameUIColors.warning;
      default:
        return gameUIColors.muted;
    }
  };

  const getStorageText = () => {
    switch (type) {
      case "async":
        return "ASYNC";
      case "mmkv":
        return "MMKV";
      case "secure":
        return "SECURE";
    }
  };

  const getStorageIcon = () => {
    const color = getStorageColor();
    const iconSize = isSmall ? 10 : 12;

    switch (type) {
      case "async":
        return <Database size={iconSize} color={color} />;
      case "mmkv":
        return <HardDrive size={iconSize} color={color} />;
      case "secure":
        return <Lock size={iconSize} color={color} />;
      default:
        return null;
    }
  };

  const backgroundColor = getStorageColor() + "1A";

  return (
    <View style={[styles.badge, { backgroundColor }, isSmall && styles.smallBadge]}>
      {showIcon && getStorageIcon()}
      <Text
        style={[
          styles.text,
          { color: getStorageColor() },
          isSmall && styles.smallText,
        ]}
      >
        {getStorageText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 9,
  },
});
