import { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Switch
} from 'react-native';
import { 
  Globe, 
  Trash2, 
  Power,
  Search,
  X,
  Filter,
  ChevronLeft
} from 'lucide-react-native';
import { BaseFloatingModal } from '../../../_components/floating-bubble/modal/components/BaseFloatingModal';
import { NetworkEventItem } from './NetworkEventItem';
import { NetworkEventDetailView } from './NetworkEventDetailView';
import { NetworkStatsSection } from './NetworkStats';
import { useNetworkEvents } from '../hooks/useNetworkEvents';
import type { NetworkEvent } from '../types';

interface NetworkModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

export function NetworkModal({
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
    toggleInterception,
    methods,
  } = useNetworkEvents();

  const [selectedEvent, setSelectedEvent] = useState<NetworkEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleEventPress = useCallback((event: NetworkEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleBack = useCallback(() => {
    if (selectedEvent) {
      setSelectedEvent(null);
    } else if (onBack) {
      onBack();
    }
  }, [selectedEvent, onBack]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    setFilter(prev => ({ ...prev, searchText: text }));
  }, [setFilter]);

  const handleStatusFilter = useCallback((status: 'all' | 'success' | 'error' | 'pending') => {
    setFilter(prev => ({ ...prev, status }));
  }, [setFilter]);

  const handleMethodFilter = useCallback((method: string) => {
    setFilter(prev => {
      const currentMethods = prev.method || [];
      const newMethods = currentMethods.includes(method)
        ? currentMethods.filter(m => m !== method)
        : [...currentMethods, method];
      return { ...prev, method: newMethods.length > 0 ? newMethods : undefined };
    });
  }, [setFilter]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {(selectedEvent || onBack) && (
          <TouchableOpacity
            sentry-label="ignore back button"
            onPress={handleBack}
            style={styles.backButton}
          >
            <ChevronLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Globe size={20} color="#8B5CF6" />
        <Text style={styles.title}>
          {selectedEvent ? 'Request Details' : 'Network Monitor'}
        </Text>
      </View>
      
      {!selectedEvent && (
        <View style={styles.headerActions}>
          <TouchableOpacity
            sentry-label="ignore toggle interception"
            onPress={toggleInterception}
            style={[styles.actionButton, isEnabled && styles.activeButton]}
          >
            <Power size={16} color={isEnabled ? '#10B981' : '#6B7280'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            sentry-label="ignore clear events"
            onPress={clearEvents}
            style={styles.actionButton}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search URL, method, error..."
          placeholderTextColor="#6B7280"
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            sentry-label="ignore clear search"
            onPress={() => handleSearch('')}
          >
            <X size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        sentry-label="ignore toggle filters"
        onPress={() => setShowFilters(!showFilters)}
        style={styles.filterToggle}
      >
        <Filter size={14} color="#9CA3AF" />
        <Text style={styles.filterToggleText}>Filters</Text>
      </TouchableOpacity>

      {/* Filter Options */}
      {showFilters && (
        <View style={styles.filterOptions}>
          {/* Status Filters */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {(['all', 'success', 'error', 'pending'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    sentry-label={`ignore ${status} filter`}
                    onPress={() => handleStatusFilter(status)}
                    style={[
                      styles.filterChip,
                      filter.status === status && styles.activeFilterChip
                    ]}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filter.status === status && styles.activeFilterChipText
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Method Filters */}
          {methods.length > 0 && (
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Method:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterChips}>
                  {methods.map(method => (
                    <TouchableOpacity
                      key={method}
                      sentry-label={`ignore ${method} filter`}
                      onPress={() => handleMethodFilter(method)}
                      style={[
                        styles.filterChip,
                        filter.method?.includes(method) && styles.activeFilterChip
                      ]}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filter.method?.includes(method) && styles.activeFilterChipText
                      ]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (selectedEvent) {
      return (
        <NetworkEventDetailView
          event={selectedEvent}
          onBack={() => setSelectedEvent(null)}
        />
      );
    }

    return (
      <>
        {renderFilters()}
        
        <NetworkStatsSection stats={stats} />
        
        {!isEnabled && (
          <View style={styles.disabledBanner}>
            <Power size={16} color="#F59E0B" />
            <Text style={styles.disabledText}>
              Network interception is disabled. Tap the power button to start capturing.
            </Text>
          </View>
        )}
        
        <ScrollView
          style={styles.eventsList}
          contentContainerStyle={styles.eventsListContent}
        >
          {events.length > 0 ? (
            events.map(event => (
              <NetworkEventItem
                key={event.id}
                event={event}
                onPress={handleEventPress}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Globe size={48} color="#6B7280" />
              <Text style={styles.emptyTitle}>No network events</Text>
              <Text style={styles.emptyText}>
                {isEnabled 
                  ? 'Network requests will appear here'
                  : 'Enable interception to start capturing'
                }
              </Text>
            </View>
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      enableSharedModalDimensions={enableSharedModalDimensions}
    >
      <View style={styles.container}>
        {renderHeader()}
        {renderContent()}
      </View>
    </BaseFloatingModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  filtersContainer: {
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  filterToggleText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  filterOptions: {
    marginTop: 8,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    width: 60,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#8B5CF6',
  },
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    margin: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  disabledText: {
    color: '#F59E0B',
    fontSize: 12,
    flex: 1,
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    padding: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
});