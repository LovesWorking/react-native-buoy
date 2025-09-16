import { TouchableOpacity, StyleSheet } from "react-native";
import { Search } from "rn-better-dev-tools/icons";
import { gameUIColors } from "../gameUI";

interface HeaderSearchButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
  style?: any;
}

export function HeaderSearchButton({
  onPress,
  size = 14,
  color = gameUIColors.secondary,
  style,
}: HeaderSearchButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      activeOpacity={0.7}
    >
      <Search size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 4,
  },
});