import { View } from "react-native";
import { CyberpunkSectionButton } from "@react-buoy/shared-ui";
import { TanstackLogo } from "./query-browser/svgs";
import { gameUIColors } from "@react-buoy/shared-ui";

interface ReactQuerySectionProps {
  onPress: () => void;
  getReactBuoySubtitle: () => string;
}

// Component definition moved outside render to prevent recreation on every render
const TanstackIcon = () => (
  <View style={{ width: 24, height: 24 }}>
    <TanstackLogo />
  </View>
);

/**
 * React Query section component following composition principles.
 * Encapsulates React Query specific business logic and UI.
 */
export function ReactQuerySection({
  onPress,
  getReactBuoySubtitle,
}: ReactQuerySectionProps) {
  // Format subtitle to be shorter: "45 queries • 10 mutations" → "45Q • 10M"
  const formatSubtitle = () => {
    const full = getReactBuoySubtitle();
    const match = full.match(/(\d+) queries • (\d+) mutations/);
    if (match) {
      return `${match[1]}Q • ${match[2]}M`;
    }
    return "No data";
  };

  return (
    <CyberpunkSectionButton
      id="react-buoy-dev-tools"
      title="QUERY"
      subtitle={formatSubtitle()}
      icon={TanstackIcon as React.ComponentType<{ size?: number; color?: string }>}
      iconColor={gameUIColors.critical}
      iconBackgroundColor={gameUIColors.critical + "1A"}
      onPress={onPress}
      index={1}
    />
  );
}
