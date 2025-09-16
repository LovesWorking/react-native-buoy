import { View, Text, StyleSheet } from "react-native";
import { CheckCircle, XCircle } from "rn-better-dev-tools/icons";
import { gameUIColors } from "../gameUI/constants/gameUIColors";

type ValueType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "undefined"
  | "object"
  | "array";

interface ValueTypeBadgeProps {
  type: ValueType;
  value?: unknown;
  size?: "small" | "medium";
  showIcon?: boolean;
}

export function ValueTypeBadge({
  type,
  value,
  size = "small",
  showIcon = false,
}: ValueTypeBadgeProps) {
  const isSmall = size === "small";

  // Special handling for booleans
  if (type === "boolean" && value !== undefined) {
    const isTrue = value === true;
    return (
      <View
        style={[
          styles.badge,
          isTrue ? styles.trueBadge : styles.falseBadge,
          isSmall && styles.smallBadge,
        ]}
      >
        {showIcon &&
          (isTrue ? (
            <CheckCircle size={10} color={gameUIColors.success} />
          ) : (
            <XCircle size={10} color={gameUIColors.error} />
          ))}
        <Text
          style={[
            styles.badgeText,
            isTrue ? styles.trueText : styles.falseText,
            isSmall && styles.smallText,
          ]}
        >
          {isTrue ? "TRUE" : "FALSE"}
        </Text>
      </View>
    );
  }

  // Handling for other types
  const getTypeStyle = () => {
    switch (type) {
      case "string":
        return styles.stringBadge;
      case "number":
        return styles.numberBadge;
      case "null":
        return styles.nullBadge;
      case "undefined":
        return styles.undefinedBadge;
      case "object":
        return styles.objectBadge;
      case "array":
        return styles.arrayBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getTypeText = () => {
    switch (type) {
      case "string":
        return "STRING";
      case "number":
        return "NUMBER";
      case "null":
        return "NULL";
      case "undefined":
        return "UNDEFINED";
      case "object":
        return "OBJECT";
      case "array":
        return "ARRAY";
      default:
        return type.toUpperCase();
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "string":
        return gameUIColors.dataTypes.string;
      case "number":
        return gameUIColors.dataTypes.number;
      case "null":
        return gameUIColors.dataTypes.null;
      case "undefined":
        return gameUIColors.dataTypes.undefined;
      case "object":
        return gameUIColors.dataTypes.object;
      case "array":
        return gameUIColors.dataTypes.array;
      default:
        return gameUIColors.muted;
    }
  };

  return (
    <View style={[styles.badge, getTypeStyle(), isSmall && styles.smallBadge]}>
      <Text
        style={[
          styles.typeText,
          { color: getTypeColor() },
          isSmall && styles.smallText,
        ]}
      >
        {getTypeText()}
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
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 9,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  trueBadge: {
    backgroundColor: gameUIColors.success + "1A",
  },
  falseBadge: {
    backgroundColor: gameUIColors.error + "1A",
  },
  trueText: {
    color: gameUIColors.success,
  },
  falseText: {
    color: gameUIColors.error,
  },
  stringBadge: {
    backgroundColor: gameUIColors.dataTypes.string + "1A",
  },
  numberBadge: {
    backgroundColor: gameUIColors.dataTypes.number + "1A",
  },
  nullBadge: {
    backgroundColor: gameUIColors.dataTypes.null + "1A",
  },
  undefinedBadge: {
    backgroundColor: gameUIColors.dataTypes.undefined + "1A",
  },
  objectBadge: {
    backgroundColor: gameUIColors.dataTypes.object + "1A",
  },
  arrayBadge: {
    backgroundColor: gameUIColors.dataTypes.array + "1A",
  },
  defaultBadge: {
    backgroundColor: gameUIColors.muted + "1A",
  },
});
