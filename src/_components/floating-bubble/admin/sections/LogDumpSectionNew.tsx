import { useEffect, useState } from "react";
import { FileText } from "lucide-react-native";

import { ExpandableSectionWithModal } from "../ExpandableSectionWithModal";
import { getEntries } from "../logger";
import { ConsoleTransportEntry } from "../logger/types";

import { formatRelativeTime, LogDumpModalContent } from "./log-dump";

function LogDumpSectionNew() {
  const [entries, setEntries] = useState<ConsoleTransportEntry[]>([]);

  // Function to calculate entries
  const calculateEntries = () => {
    const rawEntries = getEntries();
    const uniqueEntries = rawEntries.reduce(
      (acc: ConsoleTransportEntry[], entry: ConsoleTransportEntry) => {
        if (
          !acc.some(
            (existing: ConsoleTransportEntry) => existing.id === entry.id
          )
        ) {
          acc.push(entry);
        }
        return acc;
      },
      [] as ConsoleTransportEntry[]
    );

    return uniqueEntries.sort(
      (a: ConsoleTransportEntry, b: ConsoleTransportEntry) =>
        b.timestamp - a.timestamp
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
      title="Log Dump"
      subtitle={`${entries.length} entries • Last ${
        entries.length > 0 ? formatRelativeTime(entries[0]?.timestamp) : "never"
      }`}
      showModalHeader={false}
      onModalOpen={refreshEntries}
    >
      {(closeModal) => <LogDumpModalContent onClose={closeModal} />}
    </ExpandableSectionWithModal>
  );
}
