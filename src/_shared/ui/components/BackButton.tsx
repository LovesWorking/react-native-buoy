import { Pressable, StyleSheet } from "react-native";
import { ChevronLeft } from "lucide-react-native";

interface BackButtonProps {
  onPress: () => void;
  color?: string;
  size?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function BackButton({
  onPress,
  color = "#FFFFFF",
  size = 16,
  accessibilityLabel = "Go back",
  accessibilityHint = "Return to previous screen",
}: BackButtonProps) {
  return (
    <Pressable
      sentry-label="ignore back button"
      onPress={onPress}
      style={styles.button}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <ChevronLeft color={color} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)",
  },
});
