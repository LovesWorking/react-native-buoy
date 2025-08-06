import { useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import { FlashList } from "@shopify/flash-list";

import {
  ConsoleTransportEntry,
  LogLevel,
  LogType,
} from "../../../_shared/logger/types";
import { EmptyFilterState, EmptyState } from "../../log-dump/EmptyStates";
import { SentryEventLogEntryItem } from "./SentryEventLogEntryItemCompact";
import { useSentryEvents } from "../hooks/useSentryEvents";
import { TickProvider } from "../hooks/useTickEveryMinute";
import { SentryDetailModal } from "./SentryDetailModal";
import { SentryFilterModal } from "./SentryFilterModal";

// Stable constants to prevent re-creation on every render [[memory:4875251]]
const ESTIMATED_ITEM_SIZE = 44; // Reduced for compact cards
const END_REACHED_THRESHOLD = 0.8;
const MAINTAIN_VISIBLE_CONTENT_POSITION = {
  minIndexForVisible: 0,
  autoscrollToTopThreshold: 1,
};

// Stable module-scope functions [[memory:4875251]]
const keyExtractor = (item: ConsoleTransportEntry, index: number) => {
  return `${item.id}-${index}-${item.timestamp}`;
};

const getItemType = (item: ConsoleTransportEntry) => {
  return `${item.type}-${item.level}`;
};

// Stable renderItem function using ref pattern [[memory:4875251]]
const createRenderSentryEventItem = (
  selectEntryRef: React.MutableRefObject<
    ((entry: ConsoleTransportEntry) => void) | undefined
  >
) => {
  return ({ item }: { item: ConsoleTransportEntry }) => (
    <SentryEventLogEntryItem
      entry={item}
      onSelectEntry={(entry) => selectEntryRef.current?.(entry)}
    />
  );
};

interface SentryLogsDetailContentProps {
  selectedEntry: ConsoleTransportEntry | null;
  onSelectEntry: (entry: ConsoleTransportEntry | null) => void;
  showFilterView: boolean;
  onShowFilterView: (show: boolean) => void;
  selectedTypes?: Set<LogType>;
  selectedLevels?: Set<LogLevel>;
  onToggleTypeFilter?: (type: LogType) => void;
  onToggleLevelFilter?: (level: LogLevel) => void;
  isLoggingEnabled?: boolean;
}

/**
 * Sentry logs detail content following component composition principles.
 * Single responsibility: Display and manage sentry event logs without modal chrome.
 */
function SentryLogsDetailContentInner({
  selectedEntry: externalSelectedEntry,
  onSelectEntry,
  showFilterView,
  onShowFilterView,
  selectedTypes: externalSelectedTypes,
  selectedLevels: externalSelectedLevels,
  onToggleTypeFilter: externalToggleTypeFilter,
  onToggleLevelFilter: externalToggleLevelFilter,
  isLoggingEnabled: externalIsLoggingEnabled,
}: SentryLogsDetailContentProps) {
  const panGesture = Gesture.Pan().runOnJS(true);

  // Use props if provided, otherwise use local state
  const [localSelectedTypes, setLocalSelectedTypes] = useState<Set<LogType>>(
    new Set()
  );
  const [localSelectedLevels, setLocalSelectedLevels] = useState<Set<LogLevel>>(
    new Set()
  );
  const [_localIsLoggingEnabled, _setLocalIsLoggingEnabled] = useState(true);

  const selectedTypes = externalSelectedTypes ?? localSelectedTypes;
  const selectedLevels = externalSelectedLevels ?? localSelectedLevels;
  const _isLoggingEnabled = externalIsLoggingEnabled ?? _localIsLoggingEnabled;

  const flatListRef = useRef<FlashList<ConsoleTransportEntry>>(null);

  // Use reactive hook for automatic updates [[memory:4875074]]
  const { entries: filteredEntries, totalCount } = useSentryEvents({
    selectedTypes,
    selectedLevels,
  });

  // Note: Store filter synchronization removed to prevent circular updates
  // The useSentryEvents hook already handles filtering internally

  // Use "Latest Ref" pattern [[memory:4875251]]
  const selectEntryRef = useRef<(entry: ConsoleTransportEntry) => void>(
    (entry: ConsoleTransportEntry) => {
      onSelectEntry(entry);
    }
  );
  selectEntryRef.current = (entry: ConsoleTransportEntry) => {
    onSelectEntry(entry);
  };

  // Create stable renderItem once [[memory:4875251]]
  const renderSentryEventItem = useMemo(
    () => createRenderSentryEventItem(selectEntryRef),
    []
  );

  const goBackToList = () => {
    onSelectEntry(null);
  };

  const toggleTypeFilter = (type: LogType) => {
    if (externalToggleTypeFilter) {
      externalToggleTypeFilter(type);
    } else {
      setLocalSelectedTypes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(type)) {
          newSet.delete(type);
        } else {
          newSet.add(type);
        }
        return newSet;
      });
    }
  };

  const toggleLevelFilter = (level: LogLevel) => {
    if (externalToggleLevelFilter) {
      externalToggleLevelFilter(level);
    } else {
      setLocalSelectedLevels((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(level)) {
          newSet.delete(level);
        } else {
          newSet.add(level);
        }
        return newSet;
      });
    }
  };

  // Stable component tree with modal pattern
  return (
    <View
      style={styles.container}
      sentry-label="ignore devtools sentry container"
    >
      {/* Modal components that return null when not visible */}
      <SentryDetailModal
        visible={!!externalSelectedEntry}
        entry={externalSelectedEntry}
        onBack={goBackToList}
      />

      <SentryFilterModal
        visible={showFilterView && !externalSelectedEntry}
        entries={filteredEntries}
        selectedTypes={selectedTypes}
        selectedLevels={selectedLevels}
        onToggleTypeFilter={toggleTypeFilter}
        onToggleLevelFilter={toggleLevelFilter}
        onBack={() => onShowFilterView(false)}
      />

      {/* List View - always visible when modals are not shown */}
      {!externalSelectedEntry && !showFilterView && (
        <View style={styles.listWrapper}>
          {filteredEntries.length === 0 ? (
            <View
              style={styles.emptyContainer}
              sentry-label="ignore devtools sentry empty container"
            >
              {totalCount === 0 ? <EmptyState /> : <EmptyFilterState />}
            </View>
          ) : (
            <View
              style={styles.listContainer}
              sentry-label="ignore devtools sentry list container"
            >
              <GestureDetector gesture={panGesture}>
                <FlashList
                  accessibilityLabel="Sentry logs detail content"
                  accessibilityHint="View sentry logs detail content"
                  sentry-label="ignore devtools sentry logs detail list"
                  ref={flatListRef}
                  data={filteredEntries}
                  renderItem={renderSentryEventItem}
                  keyExtractor={keyExtractor}
                  getItemType={getItemType}
                  estimatedItemSize={ESTIMATED_ITEM_SIZE}
                  inverted
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator
                  removeClippedSubviews
                  onEndReachedThreshold={END_REACHED_THRESHOLD}
                  maintainVisibleContentPosition={
                    MAINTAIN_VISIBLE_CONTENT_POSITION
                  }
                  renderScrollComponent={ScrollView}
                />
              </GestureDetector>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1F1F",
  },
  listWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },
});

// Export wrapper component with TickProvider
export function SentryLogsDetailContent(props: SentryLogsDetailContentProps) {
  return (
    <TickProvider>
      <SentryLogsDetailContentInner {...props} />
    </TickProvider>
  );
}
