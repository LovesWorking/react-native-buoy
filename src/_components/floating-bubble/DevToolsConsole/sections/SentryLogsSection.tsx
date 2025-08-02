import React from "react";
import { FileText } from "lucide-react-native";
import { ConsoleSection } from "../ConsoleSection";
import { SentryEventLogDumpModalContent } from "../../admin/sections/log-dump/SentryEventLogDumpModalContent";

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
export function SentryLogsContent({ onClose }: { onClose: () => void }) {
  return <SentryEventLogDumpModalContent onClose={onClose} />;
}
