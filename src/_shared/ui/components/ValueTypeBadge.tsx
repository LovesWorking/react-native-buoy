import { View, Text, StyleSheet } from "react-native";
import { CheckCircle, XCircle } from "lucide-react-native";

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
            <CheckCircle size={10} color="#10B981" />
          ) : (
            <XCircle size={10} color="#EF4444" />
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
        return "#22D3EE";
      case "number":
        return "#3B82F6";
      case "null":
        return "#6B7280";
      case "undefined":
        return "#9CA3AF";
      case "object":
        return "#F97316";
      case "array":
        return "#10B981";
      default:
        return "#6B7280";
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
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  falseBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  trueText: {
    color: "#10B981",
  },
  falseText: {
    color: "#EF4444",
  },
  stringBadge: {
    backgroundColor: "rgba(34, 211, 238, 0.1)",
  },
  numberBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  nullBadge: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  undefinedBadge: {
    backgroundColor: "rgba(156, 163, 175, 0.1)",
  },
  objectBadge: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  arrayBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  defaultBadge: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
});
