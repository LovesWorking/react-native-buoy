import { FileText } from "lucide-react-native";
import { ConsoleSection } from "../../../_components/floating-bubble/DevToolsConsole/ConsoleSection";
import { SentryLogsDetailContent } from "./SentryLogsDetailContent";
import { ConsoleTransportEntry } from "../../../_components/floating-bubble/admin/logger/types";

interface SentryLogsSectionProps {
  onPress: () => void;
  getSentrySubtitle: () => string;
}

/**
 * Sentry logs section component following composition principles.
 * Encapsulates sentry-specific business logic and UI.
 */
export function SentryLogsSection({
  onPress,
  getSentrySubtitle,
}: SentryLogsSectionProps) {
  return (
    <ConsoleSection
      id="sentry-logs"
      title="Sentry Logs"
      subtitle={getSentrySubtitle()}
      icon={FileText}
      iconColor="#8B5CF6"
      iconBackgroundColor="rgba(139, 92, 246, 0.1)"
      onPress={onPress}
    />
  );
}

/**
 * Content component for sentry logs detail view.
 * Separates content rendering from section UI.
 */
export function SentryLogsContent({
  selectedEntry,
  onSelectEntry,
  showFilterView,
  onShowFilterView,
}: {
  selectedEntry: ConsoleTransportEntry | null;
  onSelectEntry: (entry: ConsoleTransportEntry | null) => void;
  showFilterView: boolean;
  onShowFilterView: (show: boolean) => void;
}) {
  return (
    <SentryLogsDetailContent
      selectedEntry={selectedEntry}
      onSelectEntry={onSelectEntry}
      showFilterView={showFilterView}
      onShowFilterView={onShowFilterView}
    />
  );
}
