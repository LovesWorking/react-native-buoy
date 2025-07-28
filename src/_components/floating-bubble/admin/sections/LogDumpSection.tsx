import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { faFileText, faRefresh, faTrash, faVial, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';

import { Text } from '~/components/ui/text';

import { logger } from '~/lib/utils/logger';
import { clearEntries, getEntries } from '~/lib/utils/logger/logDump';
import { ConsoleTransportEntry, LogLevel, LogType } from '~/lib/utils/logger/types';

import { ExpandableSection } from './ExpandableSection';
import {
  EmptyFilterState,
  EmptyState,
  formatRelativeTime,
  LogDetailView,
  LogFilters,
  renderLogEntry,
} from './log-dump';
export function LogDumpSection() {
  const [selectedEntry, setSelectedEntry] = useState<ConsoleTransportEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [entries, setEntries] = useState<ConsoleTransportEntry[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<LogType>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(new Set());
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const flashListRef = useRef<FlashList<ConsoleTransportEntry>>(null);
  const insets = useSafeAreaInsets();

  // Function to calculate entries
  const calculateEntries = () => {
    const rawEntries = getEntries();
    const uniqueEntries = rawEntries.reduce((acc, entry) => {
      if (!acc.some((existing) => existing.id === entry.id)) {
        acc.push(entry);
      }
      return acc;
    }, [] as ConsoleTransportEntry[]);

    return uniqueEntries.sort((a, b) => b.timestamp - a.timestamp);
  };

  // Initialize entries on mount
  useEffect(() => {
    setEntries(calculateEntries());
  }, []);

  const selectEntry = (entry: ConsoleTransportEntry) => {
    setSelectedEntry(entry);
  };

  const goBackToList = () => {
    setSelectedEntry(null);
  };

  const scrollToBottom = () => {
    if (flashListRef.current && entries.length > 0) {
      requestAnimationFrame(() => {
        flashListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        });
      });
    }
  };

  const refreshEntries = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Only update entries when explicitly refreshing
      setEntries(calculateEntries());

      if (isModalOpen) {
        setTimeout(scrollToBottom, 100);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const openLogModal = () => {
    setIsModalOpen(true);
    bottomSheetModalRef.current?.present();
  };

  const closeLogModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null); // Reset selected entry when closing
    bottomSheetModalRef.current?.dismiss();
  };

  const toggleTypeFilter = (type: LogType) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const toggleLevelFilter = (level: LogLevel) => {
    setSelectedLevels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  };

  const getFilteredEntries = () => {
    return entries.filter((entry) => {
      const typeMatch = selectedTypes.size === 0 || selectedTypes.has(entry.type);
      const levelMatch = selectedLevels.size === 0 || selectedLevels.has(entry.level);
      return typeMatch && levelMatch;
    });
  };

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.8} />
  );

  const keyExtractor = (item: ConsoleTransportEntry, index: number) => {
    return `${item.id}-${index}-${item.timestamp}`;
  };

  // Auto-scroll when modal opens
  useEffect(() => {
    if (isModalOpen && entries.length > 0) {
      const timer = setTimeout(scrollToBottom, 200);
      return () => clearTimeout(timer);
    }
  });

  // Update generateTestLogs function
  const generateTestLogs = async () => {
    // Clear existing logs first
    clearEntries();
    setEntries([]);

    // Add new test logs with proper Sentry categories
    logger.debug('Testing debug functionality', { category: 'debug' });
    logger.error(new Error('Test error message'), { category: 'error' });
    logger.info('Generic information message');
    logger.info('GET /api/users/123', {
      category: 'xhr',
      method: 'GET',
      url: '/api/users/123',
      status: 200,
    });
    logger.info('From Inbox To Account Profile', {
      category: 'navigation',
      from: 'inbox',
      to: 'account/index',
    });
    logger.info('User authentication successful', {
      category: 'auth',
      method: 'otp',
      userId: 'user_123',
    });
    logger.info('User clicked profile button', {
      category: 'touch',
      action: 'profile_update',
      userId: '123',
    });
    logger.info('User focused on input field', {
      category: 'ui.input',
      element: 'message_input',
      screen: 'conversation',
    });
    logger.info('Redux state updated', {
      category: 'redux.action',
      action: 'SET_USER_PROFILE',
      payload: { name: 'John Doe' },
    });
    logger.info('Session replay mutation detected', {
      category: 'replay.mutations',
      mutationType: 'childList',
      target: 'conversation-list',
    });
    logger.warn('Resource usage high', { category: 'console' });

    // Add some custom events that users might have added
    logger.info('Custom payment processing started', {
      category: 'payment.processor',
      amount: 29.99,
      paymentMethod: 'stripe',
    });
    logger.info('Custom analytics event tracked', {
      category: 'custom.analytics',
      event: 'feature_usage',
      featureName: 'dark_mode_toggle',
    });
    logger.info('Custom integration webhook received', {
      category: 'webhook.integration',
      source: 'external_service',
      eventType: 'order_completed',
    });

    // Small delay to ensure all logs are processed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Refresh the view
    refreshEntries();
  };

  // Add clearLogs function
  const clearLogs = () => {
    clearEntries();
    setEntries([]); // Update the UI immediately
  };

  return (
    <>
      <ExpandableSection
        icon={faFileText}
        iconColor="#8B5CF6"
        iconBackgroundColor="bg-purple-500/10"
        title="Log Dump"
        subtitle={`${entries.length} entries • Last ${entries.length > 0 ? formatRelativeTime(entries[0]?.timestamp) : 'never'}`}
        onPress={openLogModal}
      >
        <></>
      </ExpandableSection>

      {/* Full Screen Log Viewer Modal */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={['100%']}
        index={0}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#0F0F0F' }}
        handleIndicatorStyle={{
          backgroundColor: '#6B7280',
          width: 40,
          height: 5,
        }}
        style={{ marginTop: insets.top }}
        onDismiss={closeLogModal}
      >
        {/* Show detail view or list view */}
        {selectedEntry ? (
          <LogDetailView entry={selectedEntry} onBack={goBackToList} />
        ) : (
          <>
            {/* Enhanced Header */}
            <View className="border-b border-white/[0.06] bg-black/20">
              {/* Main header */}
              <View className="flex-row items-center justify-between px-4 py-3">
                <View className="flex-row items-center space-x-3">
                  <View className="bg-purple-500/10 p-2 rounded-lg mr-2">
                    <FontAwesomeIcon icon={faFileText} size={18} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-white font-semibold text-lg">Log Dump</Text>
                    <Text className="text-gray-400 text-sm">
                      {getFilteredEntries().length} of {entries.length} entries
                      {selectedTypes.size > 0 || selectedLevels.size > 0 ? ' (filtered)' : ''}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center space-x-3 gap-2">
                  {/* Test Logs Button */}
                  <TouchableOpacity
                    sentry-label="ignore generate test logs button"
                    accessibilityRole="button"
                    accessibilityLabel="Generate test logs"
                    accessibilityHint="Generates sample logs of different types for testing"
                    onPress={generateTestLogs}
                    className="bg-indigo-500/20 p-2 rounded-lg active:bg-indigo-500/30"
                  >
                    <FontAwesomeIcon icon={faVial} size={16} color="#818CF8" />
                  </TouchableOpacity>

                  {/* Clear Logs Button */}
                  <TouchableOpacity
                    sentry-label="ignore clear logs button"
                    accessibilityRole="button"
                    accessibilityLabel="Clear logs"
                    accessibilityHint="Removes all log entries from memory"
                    onPress={clearLogs}
                    className="bg-red-500/20 p-2 rounded-lg active:bg-red-500/30"
                  >
                    <FontAwesomeIcon icon={faTrash} size={16} color="#F87171" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    sentry-label="ignore refresh logs button"
                    accessibilityRole="button"
                    accessibilityLabel="Refresh logs"
                    accessibilityHint="Refreshes the log entries to show latest data"
                    onPress={refreshEntries}
                    disabled={isRefreshing}
                    className="bg-purple-500/20 p-2 rounded-lg active:bg-purple-500/30"
                  >
                    {isRefreshing ? (
                      <ActivityIndicator size="small" color="#8B5CF6" />
                    ) : (
                      <FontAwesomeIcon icon={faRefresh} size={16} color="#8B5CF6" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    sentry-label="ignore close log viewer button"
                    accessibilityRole="button"
                    accessibilityLabel="Close log viewer"
                    accessibilityHint="Closes the log viewer and returns to the admin panel"
                    onPress={closeLogModal}
                    className="bg-gray-500/20 p-2 rounded-lg active:bg-gray-500/30"
                  >
                    <FontAwesomeIcon icon={faXmark} size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter section */}
              <LogFilters
                entries={entries}
                selectedTypes={selectedTypes}
                selectedLevels={selectedLevels}
                onToggleTypeFilter={toggleTypeFilter}
                onToggleLevelFilter={toggleLevelFilter}
              />
            </View>
            {/* Log Entries */}
            {/* ScrollView fixes Android not scrolling but removes auto scroll from both. */}
            {/* <ScrollView sentry-label="ignore log entries scroll view"> */}
            <FlashList
              ref={flashListRef}
              data={getFilteredEntries()}
              renderItem={renderLogEntry}
              extraData={{ selectEntry }}
              keyExtractor={keyExtractor}
              estimatedItemSize={100}
              inverted
              contentContainerStyle={{ paddingTop: 16 + insets.bottom, paddingBottom: 32 }}
              showsVerticalScrollIndicator
              removeClippedSubviews
              ListEmptyComponent={getFilteredEntries().length === 0 ? <EmptyState /> : <EmptyFilterState />}
              onEndReachedThreshold={0.5}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
            />
            {/* </ScrollView> */}
            <View style={{ paddingBottom: insets.bottom + 20 }} />
          </>
        )}
      </BottomSheetModal>
    </>
  );
}
