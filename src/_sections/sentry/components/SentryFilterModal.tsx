import { View, StyleSheet } from "react-native";
import {
  ConsoleTransportEntry,
  LogLevel,
  LogType,
} from "../../../_shared/logger/types";
import { SentryFilterView } from "./SentryFilterView";

interface SentryFilterModalProps {
  visible: boolean;
  entries: ConsoleTransportEntry[];
  selectedTypes: Set<LogType>;
  selectedLevels: Set<LogLevel>;
  onToggleTypeFilter: (type: LogType) => void;
  onToggleLevelFilter: (level: LogLevel) => void;
  onBack: () => void;
}

/**
 * Stable modal wrapper for Sentry filter view.
 * Returns null when not visible to maintain stable component tree.
 */
export function SentryFilterModal({
  visible,
  entries,
  selectedTypes,
  selectedLevels,
  onToggleTypeFilter,
  onToggleLevelFilter,
  onBack,
}: SentryFilterModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SentryFilterView
        _entries={entries}
        selectedTypes={selectedTypes}
        selectedLevels={selectedLevels}
        onToggleTypeFilter={onToggleTypeFilter}
        onToggleLevelFilter={onToggleLevelFilter}
        _onBack={onBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1F1F1F",
  },
});
