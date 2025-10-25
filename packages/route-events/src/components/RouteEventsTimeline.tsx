/**
 * RouteEventsTimeline - Chronological timeline of route navigation events
 *
 * Shows events in the order they happened (most recent first),
 * providing a clear history of navigation actions.
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  macOSColors,
  formatRelativeTime,
  Navigation,
  ChevronDown,
  ChevronRight,
  InlineCopyButton,
} from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";
import type { RouteChangeEvent } from "../RouteObserver";

interface RouteEventsTimelineProps {
  events: RouteChangeEvent[];
}

// Get icon and color for different navigation types
function getEventIcon(event: RouteChangeEvent) {
  const { pathname } = event;

  // Going to home/root
  if (pathname === "/") {
    return { icon: Navigation, color: macOSColors.semantic.success };
  }

  // Default navigation
  return { icon: Navigation, color: macOSColors.semantic.info };
}

// Get event type label
function getEventType(event: RouteChangeEvent): string {
  const { pathname } = event;

  if (pathname === "/") {
    return "Home";
  }

  return "Navigate";
}

// Format duration in milliseconds to human-readable string
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

export function RouteEventsTimeline({
  events,
}: RouteEventsTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const renderEventItem = (item: RouteChangeEvent, index: number) => {
      const { icon: Icon, color } = getEventIcon(item);
      const eventType = getEventType(item);
      const hasParams = item.params && Object.keys(item.params).length > 0;
      const isExpanded = expandedIndex === index;

      return (
        <View style={styles.eventItem}>
          {/* Compact row - always visible */}
          <TouchableOpacity
            onPress={() => handleToggleExpand(index)}
            style={styles.eventRow}
            activeOpacity={0.7}
          >
            {/* Expand indicator */}
            <View style={styles.expandIndicator}>
              {isExpanded ? (
                <ChevronDown size={14} color={macOSColors.text.secondary} />
              ) : (
                <ChevronRight size={14} color={macOSColors.text.secondary} />
              )}
            </View>

            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: color + "15" }]}>
              <Icon size={12} color={color} />
            </View>

            {/* Pathname with copy button */}
            <View style={styles.pathnameContainer}>
              <Text style={styles.pathname} numberOfLines={1}>
                {item.pathname}
              </Text>
              <InlineCopyButton
                value={item.pathname}
                buttonStyle={styles.copyButton}
              />
            </View>

            {/* Param count badge */}
            {hasParams && (
              <View style={styles.paramBadge}>
                <Text style={styles.paramBadgeText}>
                  {Object.keys(item.params).length} param{Object.keys(item.params).length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Time since previous badge */}
            {item.timeSincePrevious !== undefined && (
              <View style={styles.timeSinceBadge}>
                <Text style={styles.timeSinceBadgeText}>
                  +{formatDuration(item.timeSincePrevious)}
                </Text>
              </View>
            )}

            {/* Timestamp */}
            <Text style={styles.timestamp}>
              {formatRelativeTime(new Date(item.timestamp))}
            </Text>
          </TouchableOpacity>

          {/* Expanded details */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Previous pathname */}
              {item.previousPathname && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From:</Text>
                  <Text style={styles.detailValue}>{item.previousPathname}</Text>
                  <InlineCopyButton
                    value={item.previousPathname}
                    buttonStyle={styles.copyButton}
                  />
                </View>
              )}

              {/* Pathname with copy */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>To:</Text>
                <Text style={styles.detailValue}>{item.pathname}</Text>
                <InlineCopyButton
                  value={item.pathname}
                  buttonStyle={styles.copyButton}
                />
              </View>

              {/* Time since previous */}
              {item.timeSincePrevious !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>
                    {formatDuration(item.timeSincePrevious)}
                  </Text>
                </View>
              )}

              {/* Segments with copy */}
              {item.segments && item.segments.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Segments:</Text>
                  <Text style={styles.detailValue}>
                    {item.segments.join(' → ')}
                  </Text>
                  <InlineCopyButton
                    value={JSON.stringify(item.segments)}
                    buttonStyle={styles.copyButton}
                  />
                </View>
              )}

              {/* Event type */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{eventType}</Text>
              </View>

              {/* Timestamp */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>

              {/* Params viewer */}
              {hasParams && (
                <View style={styles.dataViewerContainer}>
                  <DataViewer
                    data={item.params}
                    title="Parameters"
                    showTypeFilter={false}
                  />
                </View>
              )}

              {/* Copy full event button */}
              <View style={styles.copyFullEventRow}>
                <InlineCopyButton
                  value={JSON.stringify(item, null, 2)}
                  buttonStyle={styles.copyFullEventButton}
                />
                <Text style={styles.copyFullEventText}>Copy Full Event</Text>
              </View>
            </View>
          )}
        </View>
      );
  };

  if (events.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Navigation size={48} color={macOSColors.text.muted} />
        <Text style={styles.emptyTitle}>No events yet</Text>
        <Text style={styles.emptySubtitle}>
          Navigation events will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      {events.map((item, index) => (
        <View key={`event-${index}-${item.timestamp}`}>
          {renderEventItem(item, index)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },

  eventItem: {
    marginBottom: 6,
    marginHorizontal: 16,
  },

  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    gap: 8,
  },

  expandIndicator: {
    width: 20,
    alignItems: "center",
  },

  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  pathnameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },

  pathname: {
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },

  copyButton: {
    padding: 4,
    borderRadius: 4,
  },

  paramBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: macOSColors.semantic.infoBackground,
  },

  paramBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: macOSColors.semantic.info,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  timeSinceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: macOSColors.semantic.successBackground,
  },

  timeSinceBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: macOSColors.semantic.success,
    fontFamily: "monospace",
  },

  timestamp: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },

  expandedContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -6,
    gap: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detailLabel: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    fontWeight: "600",
    minWidth: 60,
  },

  detailValue: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },

  dataViewerContainer: {
    marginTop: 4,
  },

  copyFullEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
  },

  copyFullEventButton: {
    padding: 6,
    borderRadius: 4,
  },

  copyFullEventText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  emptyTitle: {
    color: macOSColors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  emptySubtitle: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "monospace",
  },
});
