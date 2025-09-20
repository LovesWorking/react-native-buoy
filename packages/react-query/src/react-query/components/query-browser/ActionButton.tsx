import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { gameUIColors } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";

// Define the color mappings using Game UI colors
const buttonConfigs = {
  btnRefetch: {
    color: macOSColors.semantic.success,
    backgroundColor: macOSColors.semantic.successBackground,
    borderColor: macOSColors.semantic.success + "59",
    textColor: macOSColors.semantic.success,
  },
  btnInvalidate: {
    color: macOSColors.semantic.warning,
    backgroundColor: macOSColors.semantic.warningBackground,
    borderColor: macOSColors.semantic.warning + "59",
    textColor: macOSColors.semantic.warning,
  },
  btnReset: {
    color: macOSColors.text.secondary,
    backgroundColor: macOSColors.text.secondary + "26",
    borderColor: macOSColors.text.secondary + "59",
    textColor: macOSColors.text.secondary,
  },
  btnRemove: {
    color: macOSColors.semantic.error,
    backgroundColor: macOSColors.semantic.errorBackground,
    borderColor: macOSColors.semantic.error + "59",
    textColor: macOSColors.semantic.error,
  },
  btnTriggerLoading: {
    color: macOSColors.semantic.info,
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "59",
    textColor: macOSColors.semantic.info,
  },
  btnTriggerLoadiError: {
    color: macOSColors.semantic.debug,
    backgroundColor: macOSColors.semantic.debug + "26",
    borderColor: macOSColors.semantic.debug + "59",
    textColor: macOSColors.semantic.debug,
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
            ? macOSColors.text.muted + "1A"
            : config.backgroundColor,
          borderColor: disabled
            ? macOSColors.text.muted + "33"
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
          { backgroundColor: disabled ? macOSColors.text.muted : config.color },
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: disabled ? macOSColors.text.muted : config.textColor },
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    shadowColor: macOSColors.text.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
});
