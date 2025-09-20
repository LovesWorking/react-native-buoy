import { FC } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Wifi, WifiOff } from "@react-buoy/shared-ui";
import { gameUIColors } from "@react-buoy/shared-ui";

interface NetworkToggleButtonProps {
  isOffline: boolean;
  onToggle: () => void;
}

const NetworkToggleButton: FC<NetworkToggleButtonProps> = ({
  isOffline,
  onToggle,
}) => {
  return (
    <TouchableOpacity
      sentry-label="ignore devtools network toggle button"
      style={[styles.button, isOffline && styles.offlineButton]}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityLabel={
        isOffline ? "Unset offline mocking behavior" : "Mock offline behavior"
      }
      accessibilityRole="button"
      accessibilityState={{ selected: isOffline }}
    >
      {isOffline ? (
        <WifiOff size={16} color={gameUIColors.error} strokeWidth={2} />
      ) : (
        <Wifi size={16} color={gameUIColors.success} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  offlineButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
});

export default NetworkToggleButton;
