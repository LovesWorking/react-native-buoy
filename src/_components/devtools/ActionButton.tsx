import { TouchableOpacity, Text, View, StyleSheet } from "react-native";

// Define the color mappings following the app's design system
const buttonConfigs = {
  btnRefetch: {
    color: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    textColor: "#10B981",
  },
  btnInvalidate: {
    color: "#F59E0B",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.2)",
    textColor: "#F59E0B",
  },
  btnReset: {
    color: "#6B7280",
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderColor: "rgba(107, 114, 128, 0.2)",
    textColor: "#6B7280",
  },
  btnRemove: {
    color: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    textColor: "#EF4444",
  },
  btnTriggerLoading: {
    color: "#0EA5E9",
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderColor: "rgba(14, 165, 233, 0.2)",
    textColor: "#0EA5E9",
  },
  btnTriggerLoadiError: {
    color: "#F97316",
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderColor: "rgba(249, 115, 22, 0.2)",
    textColor: "#F97316",
  },
};

interface Props {
  onClick: () => void;
  text: string;
  bgColorClass: keyof typeof buttonConfigs;
  _textColorClass: keyof typeof buttonConfigs;
  disabled: boolean;
}

export default function ActionButton({
  onClick,
  text,
  _textColorClass,
  bgColorClass,
  disabled,
}: Props) {
  // Get the button configuration
  const config = buttonConfigs[bgColorClass];

  return (
    <TouchableOpacity
      sentry-label="ignore devtools action button"
      disabled={disabled}
      onPress={onClick}
      style={[
        styles.button,
        {
          backgroundColor: disabled
            ? "rgba(107, 114, 128, 0.1)"
            : config.backgroundColor,
          borderColor: disabled
            ? "rgba(107, 114, 128, 0.2)"
            : config.borderColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled }}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: disabled ? "#6B7280" : config.color },
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: disabled ? "#6B7280" : config.textColor },
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6, // rectangular button shape
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 32,
    minWidth: 80,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
