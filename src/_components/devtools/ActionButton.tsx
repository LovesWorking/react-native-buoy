import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";

// Define the color mappings
const buttonColors = {
  btnRefetch: "#1570EF",
  btnInvalidate: "#DC6803",
  btnReset: "#475467",
  btnRemove: "#db2777",
  btnTriggerLoading: "#0891b2",
  btnTriggerLoadiError: "#ef4444",
};

const textColorMappings = {
  btnRefetch: "#1570EF",
  btnInvalidate: "#DC6803",
  btnReset: "#475467",
  btnRemove: "#db2777",
  btnTriggerLoading: "#0891b2",
  btnTriggerLoadiError: "#ef4444",
};

interface Props {
  onClick: () => void;
  text: string;
  bgColorClass: keyof typeof buttonColors;
  textColorClass: keyof typeof textColorMappings;
  disabled: boolean;
}

export default function ActionButton({
  onClick,
  text,
  textColorClass,
  bgColorClass,
  disabled,
}: Props) {
  // Map class names to actual color values
  const backgroundColor = buttonColors[bgColorClass];
  const textColor = textColorMappings[textColorClass] || "#FFFFFF"; // Default text color

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onClick}
      style={[styles.button, { opacity: disabled ? 0.6 : 1 }]}
    >
      <View style={[styles.dot, { backgroundColor: textColor }]}></View>
      <Text style={[styles.text, { opacity: disabled ? 0.6 : 1 }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    height: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    color: "#FFFFFF",
  },
});
