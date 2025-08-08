import { useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  TextInput
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ScrollView } from 'react-native-gesture-handler';
import { 
  Globe, 
  Trash2, 
  Power,
  Search,
  X,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react-native';
import { BaseFloatingModal } from '../../../_components/floating-bubble/modal/components/BaseFloatingModal';
import { BackButton } from '../../../_shared/ui/components/BackButton';
import { devToolsStorageKeys } from '../../../_shared/storage/devToolsStorageKeys';
import { NetworkEventItemCompact } from './NetworkEventItemCompact';
import { NetworkFilterView } from './NetworkFilterView';
import { TickProvider } from '../../sentry/hooks/useTickEveryMinute';
import { NetworkEventDetailView } from './NetworkEventDetailView';
import { useNetworkEvents } from '../hooks/useNetworkEvents';
import type { NetworkEvent } from '../types';

interface NetworkModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}


// Decompose by Responsibility: Extract empty state component
function EmptyState({ isEnabled }: { isEnabled: boolean }) {
  return (
    <View style={styles.emptyState}>
      <Globe size={32} color="#374151" />
      <Text style={styles.emptyTitle}>No network events</Text>
      <Text style={styles.emptyText}>
        {isEnabled 
          ? 'Network requests will appear here'
          : 'Enable interception to start capturing'
        }
      </Text>
    </View>
  );
}

function NetworkModalInner({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
}: NetworkModalProps) {
  const {
    events,
    stats,
    filter,
    setFilter,
    clearEvents,
    isEnabled,
    toggleInterception
  } = useNetworkEvents();

  const [selectedEvent, setSelectedEvent] = useState<NetworkEvent | null>(null);
  const [showFilterView, setShowFilterView] = useState(false);
  const [searchText, setSearchText] = useState('');
  const flatListRef = useRef<FlashList<NetworkEvent>>(null);

  // Simple handlers - no useCallback needed per rule2
  const handleEventPress = (event: NetworkEvent) => {
    setSelectedEvent(event);
  };

  const handleBack = () => {
    setSelectedEvent(null);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    setFilter(prev => ({ ...prev, searchText: text }));
  };

  // FlashList optimization - only keep what's needed for FlashList performance
  const ESTIMATED_ITEM_SIZE = 52;
  const keyExtractor = (item: NetworkEvent) => item.id;
  const getItemType = () => 'network-event';
  
  // Keep renderItem memoized for FlashList performance (justified by FlashList docs)
  const renderItem = useMemo(() => {
    return ({ item }: { item: NetworkEvent }) => (
      <NetworkEventItemCompact
        event={item}
        onPress={handleEventPress}
      />
    );
  }, []);  // Empty deps OK - handleEventPress defined inline

  // Compact header with actions (like Sentry/Storage modals)
  const renderHeaderContent = () => {
    if (showFilterView) {
      return (
        <View style={styles.headerContainer}>
          <BackButton onPress={() => setShowFilterView(false)} />
          <Text style={styles.headerTitle}>Filters</Text>
        </View>
      );
    }

    return (
      <View style={styles.headerContainer}>
        {(selectedEvent || onBack) ? (
          <BackButton onPress={selectedEvent ? handleBack : onBack!} />
        ) : null}
        
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>{events.length}</Text>
          {isEnabled ? <View style={styles.listeningIndicator} /> : null}
        </View>
        
        {/* Action buttons in header */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            sentry-label="ignore filter"
            onPress={() => setShowFilterView(true)}
            style={[
              styles.headerActionButton,
              (filter.status || filter.method || filter.contentType) && styles.activeFilterButton
            ]}
          >
            <Filter size={14} color={
              (filter.status || filter.method || filter.contentType) ? "#8B5CF6" : "#6B7280"
            } />
          </TouchableOpacity>

          <TouchableOpacity
            sentry-label="ignore toggle interception"
            onPress={toggleInterception}
            style={[
              styles.headerActionButton,
              isEnabled ? styles.startButton : styles.stopButton
            ]}
          >
            <Power size={14} color={isEnabled ? "#10B981" : "#EF4444"} />
          </TouchableOpacity>

          <TouchableOpacity
            sentry-label="ignore clear events"
            onPress={clearEvents}
            style={styles.headerActionButton}
            disabled={events.length === 0}
          >
            <Trash2 size={14} color={events.length > 0 ? "#6B7280" : "#374151"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Search size={14} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search URL, method, error..."
        placeholderTextColor="#6B7280"
        value={searchText}
        onChangeText={handleSearch}
        sentry-label="ignore network search"
        accessibilityLabel="Search network requests"
      />
      {searchText.length > 0 ? (
        <TouchableOpacity onPress={() => handleSearch('')} sentry-label="ignore clear search">
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const storagePrefix = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.network.modal();

  if (!visible) return null;

  // Show detail view if an event is selected
  if (selectedEvent) {
    return (
      <BaseFloatingModal
        visible={visible}
        onClose={onClose}
        storagePrefix={storagePrefix}
        showToggleButton={true}
        customHeaderContent={renderHeaderContent()}
        headerSubtitle={undefined}
      >
        <View style={styles.container}>
          <NetworkEventDetailView
            event={selectedEvent}
            onBack={handleBack}
          />
        </View>
      </BaseFloatingModal>
    );
  }

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={undefined}
    >
      <View style={styles.container}>
        {/* Show filter view if active */}
        {showFilterView ? (
          <NetworkFilterView
            events={events}
            filter={filter}
            onFilterChange={setFilter}
            onClose={() => setShowFilterView(false)}
          />
        ) : (
          <>
            {renderSearchBar()}
        
        {/* Compact stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statChip}>
            <CheckCircle size={12} color="#10B981" />
            <Text style={styles.statValue}>{stats.successfulRequests}</Text>
            <Text style={styles.statLabel}>OK</Text>
          </View>
          <View style={styles.statChip}>
            <XCircle size={12} color="#EF4444" />
            <Text style={[styles.statValue, styles.errorText]}>{stats.failedRequests}</Text>
            <Text style={styles.statLabel}>ERR</Text>
          </View>
          <View style={styles.statChip}>
            <Clock size={12} color="#F59E0B" />
            <Text style={[styles.statValue, styles.pendingText]}>{stats.pendingRequests}</Text>
            <Text style={styles.statLabel}>WAIT</Text>
          </View>
            </View>
            
            {!isEnabled ? (
              <View style={styles.disabledBanner}>
                <Power size={14} color="#F59E0B" />
                <Text style={styles.disabledText}>
                  Network interception is disabled
                </Text>
              </View>
            ) : null}
            
            {/* Use FlashList for performance */}
            {events.length > 0 ? (
              <FlashList
                ref={flatListRef}
                data={events}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                getItemType={getItemType}
                estimatedItemSize={ESTIMATED_ITEM_SIZE}
                inverted
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator
                removeClippedSubviews
                onEndReachedThreshold={0.8}
                renderScrollComponent={ScrollView}
                sentry-label="ignore network events list"
              />
            ) : (
              <EmptyState isEnabled={isEnabled} />
            )}
          </>
        )}
      </View>
    </BaseFloatingModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  // Compact header styles matching Sentry/Storage modals
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    minHeight: 32,
    paddingLeft: 4,
  },
  headerTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerStatsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  listeningIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  headerActionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  stopButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  activeFilterButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  // Search bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 6,
  },
  // Stats bar
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  errorText: {
    color: '#EF4444',
  },
  pendingText: {
    color: '#F59E0B',
  },
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  disabledText: {
    color: '#F59E0B',
    fontSize: 11,
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});

// Export with TickProvider wrapper
export function NetworkModal(props: NetworkModalProps) {
  return (
    <TickProvider>
      <NetworkModalInner {...props} />
    </TickProvider>
  );
}