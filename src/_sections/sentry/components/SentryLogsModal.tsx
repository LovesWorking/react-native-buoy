import { useState } from "react";
import { BaseFloatingModal } from "../../../_components/floating-bubble/modal/components/BaseFloatingModal";
import { SentryLogsContent } from "./SentryLogsSection";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BackButton } from "../../../_shared/ui/components/BackButton";
import {
  ConsoleTransportEntry,
  LogType,
  LogLevel,
} from "../../../_shared/logger/types";
import { Filter, Pause, Play, FlaskConical, Trash } from "lucide-react-native";
import { useSentryEvents } from "../hooks/useSentryEvents";
import {
  clearSentryEvents,
  generateTestSentryEvents,
} from "../utils/sentryEventListeners";

interface SentryLogsModalProps {
  visible: boolean;
  onClose: () => void;
  getSentrySubtitle: () => string;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

/**
 * Specialized modal for Sentry logs following "Decompose by Responsibility"
 * Single purpose: Display sentry logs in a modal context
 */
export function SentryLogsModal({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
}: SentryLogsModalProps) {
  const [selectedEntry, setSelectedEntry] =
    useState<ConsoleTransportEntry | null>(null);
  const [showFilterView, setShowFilterView] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<LogType>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(
    new Set()
  );
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(true);

  // Get event counts
  const { entries: filteredEntries, totalCount } = useSentryEvents({
    selectedTypes,
    selectedLevels,
  });

  if (!visible) return null;

  // Handle back navigation - back to list from detail/filter view or back to main menu
  const handleBackPress = () => {
    if (selectedEntry) {
      setSelectedEntry(null);
    } else if (showFilterView) {
      setShowFilterView(false);
    } else if (onBack) {
      onBack();
    }
  };

  const generateTestLogs = () => {
    clearSentryEvents();
    setTimeout(() => {
      generateTestSentryEvents();
    }, 50);
  };

  const clearLogs = () => {
    clearSentryEvents();
  };

  const renderHeaderContent = () => {
    // Show minimal header for detail/filter views
    if (selectedEntry || showFilterView) {
      return (
        <View
          style={styles.headerContainer}
          sentry-label="ignore devtools sentry modal header"
        >
          <BackButton
            onPress={handleBackPress}
            color="#FFFFFF"
            size={16}
            sentry-label="ignore devtools sentry modal back button"
          />
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            sentry-label="ignore devtools sentry modal header text"
          >
            {selectedEntry ? "Event Details" : "Filters"}
          </Text>
        </View>
      );
    }

    // Main list view - show full action bar
    return (
      <View
        style={styles.headerContainer}
        sentry-label="ignore devtools sentry modal header"
      >
        {onBack && (
          <BackButton
            onPress={handleBackPress}
            color="#FFFFFF"
            size={16}
            sentry-label="ignore devtools sentry modal back button"
          />
        )}
        <Text
          style={styles.eventCount}
          sentry-label="ignore devtools sentry event count"
        >
          {filteredEntries.length} of {totalCount}
          {(selectedTypes.size > 0 || selectedLevels.size > 0) && " (filtered)"}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            sentry-label="ignore devtools sentry filter open"
            onPress={() => setShowFilterView(true)}
            style={[
              styles.iconButton,
              (selectedTypes.size > 0 || selectedLevels.size > 0) &&
                styles.activeFilterButton,
            ]}
            accessibilityLabel="Open filters"
          >
            <Filter
              size={16}
              color={
                selectedTypes.size > 0 || selectedLevels.size > 0
                  ? "#8B5CF6"
                  : "#9CA3AF"
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            sentry-label="ignore devtools sentry pause logging"
            onPress={() => setIsLoggingEnabled(!isLoggingEnabled)}
            style={[styles.iconButton, isLoggingEnabled && styles.activeButton]}
            accessibilityLabel={
              isLoggingEnabled ? "Pause logging" : "Resume logging"
            }
          >
            {isLoggingEnabled ? (
              <Pause size={16} color="#10B981" />
            ) : (
              <Play size={16} color="#10B981" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            sentry-label="ignore devtools sentry generate test events"
            onPress={generateTestLogs}
            style={styles.iconButton}
            accessibilityLabel="Generate test Sentry events"
          >
            <FlaskConical size={16} color="#818CF8" />
          </TouchableOpacity>
          <TouchableOpacity
            sentry-label="ignore devtools sentry clear events"
            onPress={clearLogs}
            style={styles.iconButton}
            accessibilityLabel="Clear Sentry events"
          >
            <Trash size={16} color="#F87171" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const storagePrefix = enableSharedModalDimensions
    ? "@dev_tools_console_modal"
    : "@sentry_logs_modal";

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={undefined}
    >
      <SentryLogsContent
        selectedEntry={selectedEntry}
        onSelectEntry={setSelectedEntry}
        showFilterView={showFilterView}
        onShowFilterView={setShowFilterView}
        selectedTypes={selectedTypes}
        selectedLevels={selectedLevels}
        onToggleTypeFilter={(type) => {
          setSelectedTypes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
              newSet.delete(type);
            } else {
              newSet.add(type);
            }
            return newSet;
          });
        }}
        onToggleLevelFilter={(level) => {
          setSelectedLevels((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(level)) {
              newSet.delete(level);
            } else {
              newSet.add(level);
            }
            return newSet;
          });
        }}
        isLoggingEnabled={isLoggingEnabled}
      />
    </BaseFloatingModal>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    minHeight: 32,
  },
  headerTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginLeft: 8,
  },
  eventCount: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  activeButton: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  activeFilterButton: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
});
