import { TouchableOpacity } from "react-native";
import { Wifi, WifiOff } from "lucide-react-native";
import { useWifiState } from "../hooks/useWifiState";

interface WifiToggleProps {
  isDragging: boolean;
}

export function WifiToggle({ isDragging }: WifiToggleProps) {
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
      disabled={isDragging}
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
