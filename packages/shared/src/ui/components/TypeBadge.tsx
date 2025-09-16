import { View, Text, StyleSheet } from "react-native";
import { gameUIColors } from "../gameUI";

interface TypeBadgeProps {
  type: string;
}

const getTypeConfig = (type: string) => {
  const normalizedType = type.toLowerCase();

  switch (normalizedType) {
    case "string":
      return {
        backgroundColor: "#22c55e20",
        borderColor: "#22c55e40",
        textColor: "#22c55e",
        label: "str",
      };
    case "number":
      return {
        backgroundColor: "#3b82f620",
        borderColor: "#3b82f640",
        textColor: "#3b82f6",
        label: "num",
      };
    case "boolean":
      return {
        backgroundColor: "#a855f720",
        borderColor: "#a855f740",
        textColor: "#a855f7",
        label: "bool",
      };
    case "object":
      return {
        backgroundColor: "#f97316120",
        borderColor: "#f9731640",
        textColor: "#f97316",
        label: "obj",
      };
    case "array":
      return {
        backgroundColor: "#eab30820",
        borderColor: "#eab30840",
        textColor: "#eab308",
        label: "arr",
      };
    case "function":
      return {
        backgroundColor: "#ec489920",
        borderColor: "#ec489940",
        textColor: "#ec4899",
        label: "fn",
      };
    default:
      return {
        backgroundColor: gameUIColors.muted + "20",
        borderColor: gameUIColors.muted + "40",
        textColor: gameUIColors.muted,
        label: normalizedType.slice(0, 3),
      };
  }
};

export function TypeBadge({ type }: TypeBadgeProps) {
  if (!type) return null;

  const config = getTypeConfig(type);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
