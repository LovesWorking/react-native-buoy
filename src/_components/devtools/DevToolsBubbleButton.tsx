import React from "react";
import {
  TouchableOpacity,
  Platform,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { TanstackLogo } from "./svgs";

interface DevToolsBubbleButtonProps {
  onPress: () => void;
  bubbleStyle?: StyleProp<ViewStyle>;
}

export function DevToolsBubbleButton({
  onPress,
  bubbleStyle,
}: DevToolsBubbleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.touchableOpacityBase,
        Platform.OS === "ios"
          ? styles.touchableOpacityIOS
          : styles.touchableOpacityAndroid,
        bubbleStyle,
      ]}
    >
      <TanstackLogo />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchableOpacityBase: {
    position: "absolute",
    right: 1,
    zIndex: 50,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: "#A4C200",
  },
  touchableOpacityIOS: {
    bottom: 96,
  },
  touchableOpacityAndroid: {
    bottom: 64,
  },
});
