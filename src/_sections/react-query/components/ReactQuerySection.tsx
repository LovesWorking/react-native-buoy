import { View } from "react-native";
import { ConsoleSection } from "../../../_components/floating-bubble/console/ConsoleSection";
import { TanstackLogo } from "./query-browser/svgs";

interface ReactQuerySectionProps {
  onPress: () => void;
  getRnBetterDevToolsSubtitle: () => string;
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
  getRnBetterDevToolsSubtitle,
}: ReactQuerySectionProps) {
  return (
    <ConsoleSection
      id="rn-better-dev-tools"
      title="React Query"
      subtitle={getRnBetterDevToolsSubtitle()}
      icon={TanstackIcon as any}
      iconColor="#00AAFF"
      iconBackgroundColor="rgba(0, 170, 255, 0.1)"
      onPress={onPress}
    />
  );
}
