import { TouchableOpacity, StyleSheet } from "react-native";
import { Svg, Path } from "react-native-svg";

interface NetworkToggleButtonProps {
  isOffline: boolean;
  onToggle: () => void;
}

const NetworkToggleButton: React.FC<NetworkToggleButtonProps> = ({
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
      {isOffline ? <OfflineIcon /> : <WifiIcon />}
    </TouchableOpacity>
  );
};

// Wifi icon component
const WifiIcon = () => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={0}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path
      fill="#10B981"
      d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"
    />
  </Svg>
);

// Offline icon component
const OfflineIcon = () => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={0}
  >
    <Path
      fill="#EF4444"
      d="M24 8.98A16.88 16.88 0 0 0 12 4C7.31 4 3.07 5.9 0 8.98L12 21v-9h8.99L24 8.98zM19.59 14l-2.09 2.09L15.41 14 14 15.41l2.09 2.09L14 19.59 15.41 21l2.09-2.08L19.59 21 21 19.59l-2.08-2.09L21 15.41 19.59 14z"
    />
  </Svg>
);

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
