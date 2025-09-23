import { TouchableOpacity } from "react-native";
import { Wifi, WifiOff } from "@react-buoy/shared-ui";
import { useWifiState } from "../hooks/useWifiState";

/**
 * Small icon button that toggles React Query’s online manager, allowing developers to simulate
 * offline scenarios directly from the modal header.
 */
export function WifiToggle() {
  const { isOnline, handleWifiToggle } = useWifiState();
  return (
    <TouchableOpacity
      sentry-label={`ignore toggle WiFi ${isOnline ? "On" : "Off"}`}
      accessibilityRole="button"
      accessibilityLabel={`WiFi ${isOnline ? "On" : "Off"}`}
      accessibilityHint={`Tap to turn WiFi ${
        isOnline ? "off" : "on"
      } for React Query`}
      onPress={handleWifiToggle}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
      style={{
        paddingVertical: 6,
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        flexShrink: 0,
      }}
    >
      {isOnline ? (
        <Wifi size={16} color="#10B981" />
      ) : (
        <WifiOff size={16} color="#DC2626" />
      )}
    </TouchableOpacity>
  );
}
