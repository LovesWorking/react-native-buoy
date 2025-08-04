import { FlaskConical } from "lucide-react-native";
import { ConsoleSection } from "../../../_components/floating-bubble/DevToolsConsole/ConsoleSection";

interface ReactQuerySectionProps {
  onPress: () => void;
  getRnBetterDevToolsSubtitle: () => string;
}

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
      title="RN Better Dev Tools"
      subtitle={getRnBetterDevToolsSubtitle()}
      icon={FlaskConical}
      iconColor="#F59E0B"
      iconBackgroundColor="rgba(245, 158, 11, 0.1)"
      onPress={onPress}
    />
  );
}
