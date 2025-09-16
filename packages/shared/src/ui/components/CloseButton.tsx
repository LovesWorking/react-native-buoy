import { Pressable, StyleSheet } from "react-native";
import { X } from "../../icons";
import { gameUIColors } from "../gameUI/constants/gameUIColors";

interface CloseButtonProps {
  onPress: () => void;
  color?: string;
  size?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function CloseButton({
  onPress,
  color = gameUIColors.error,
  size = 16,
  accessibilityLabel = "Close",
  accessibilityHint = "Close this modal",
}: CloseButtonProps) {
  return (
    <Pressable
      sentry-label="ignore close button"
      onPress={onPress}
      style={styles.button}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <X color={color} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: gameUIColors.error + "1A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: gameUIColors.error + "33",
    marginRight: 3,
  },
});
