import { useEffect, useState } from "react";
import { FileText } from "lucide-react-native";

import {
  getSentryEvents,
  SentryEventEntry,
} from "../../sentry/sentryEventListeners";
import { ExpandableSectionWithModal } from "../ExpandableSectionWithModal";

import { formatRelativeTime, SentryEventLogDumpModalContent } from "./log-dump";

export function SentryLogDumpSection() {
  const [entries, setEntries] = useState<SentryEventEntry[]>([]);

  // Function to calculate entries
  const calculateEntries = () => {
    const rawEntries = getSentryEvents();
    // Remove duplicates based on ID
    const uniqueEntries = rawEntries.reduce(
      (acc: SentryEventEntry[], entry: SentryEventEntry) => {
        if (
          !acc.some((existing: SentryEventEntry) => existing.id === entry.id)
        ) {
          acc.push(entry);
        }
        return acc;
      },
      [] as SentryEventEntry[]
    );

    return uniqueEntries.sort(
      (a: SentryEventEntry, b: SentryEventEntry) => b.timestamp - a.timestamp
    );
  };

  // Initialize entries on mount
  useEffect(() => {
    setEntries(calculateEntries());
  }, []);

  const refreshEntries = () => {
    setEntries(calculateEntries());
  };

  return (
    <ExpandableSectionWithModal
      icon={FileText}
      iconColor="#8B5CF6"
      iconBackgroundColor="rgba(139, 92, 246, 0.1)"
      title="Sentry Logs"
      subtitle={`${entries.length} events • Last ${
        entries.length > 0 ? formatRelativeTime(entries[0]?.timestamp) : "never"
      }`}
      showModalHeader={false}
      fullScreen={true}
      onModalOpen={refreshEntries}
    >
      {(closeModal) => <SentryEventLogDumpModalContent onClose={closeModal} />}
    </ExpandableSectionWithModal>
  );
}
