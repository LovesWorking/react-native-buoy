import { FC } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { macOSColors } from "@react-buoy/shared-ui";
import { Trash } from "@react-buoy/shared-ui";

interface ClearCacheButtonProps {
  type: "queries" | "mutations";
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Icon-only button for clearing either the query or mutation cache from the dev tools UI.
 */
const ClearCacheButton: FC<ClearCacheButtonProps> = ({
  type,
  onClear,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      sentry-label="ignore devtools clear cache button"
      style={[styles.button, disabled && styles.disabledButton]}
      onPress={onClear}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityLabel={`Clear ${type} cache`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Trash
        size={16}
        strokeWidth={2}
        color={
          disabled
            ? macOSColors.text.secondary
            : macOSColors.semantic.warning
        }
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: macOSColors.semantic.warningBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: macOSColors.semantic.warning + "33",
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: macOSColors.text.secondary + "1A",
    borderColor: macOSColors.text.secondary + "33",
  },
});

export default ClearCacheButton;
