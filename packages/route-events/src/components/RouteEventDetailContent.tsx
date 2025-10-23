import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RouteChangeEvent } from "../RouteObserver";
import {
  formatRelativeTime,
  macOSColors,
  devToolsStorageKeys,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Navigation as NavigationIcon,
  GitBranch,
} from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";

interface RouteConversation {
  pathname: string;
  lastEvent: RouteChangeEvent;
  events: RouteChangeEvent[];
  totalNavigations: number;
}

interface RouteEventDetailContentProps {
  conversation: RouteConversation;
  selectedEventIndex?: number;
  onEventIndexChange?: (index: number) => void;
  disableInternalFooter?: boolean;
}

export function RouteEventDetailContent({
  conversation,
  selectedEventIndex = 0,
  onEventIndexChange = () => {},
  disableInternalFooter = false,
}: RouteEventDetailContentProps) {
  // Internal view state
  const [internalActiveView, setInternalActiveView] = useState<
    "current" | "diff"
  >("current");

  // Track if preferences have been loaded
  const hasLoadedPreferences = useRef(false);

  // Load saved preferences on mount
  useEffect(() => {
    if (hasLoadedPreferences.current) return;

    const loadPreferences = async () => {
      try {
        // Load detail view preference (current/diff)
        const savedDetailView = await AsyncStorage.getItem(
          devToolsStorageKeys.routeEvents.detailView()
        );
        if (savedDetailView === "current" || savedDetailView === "diff") {
          setInternalActiveView(savedDetailView);
        }

        hasLoadedPreferences.current = true;
      } catch (error) {
        console.warn("Failed to load view preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  // Save detail view preference when changed
  const handleViewChange = useCallback(async (view: "current" | "diff") => {
    setInternalActiveView(view);
    try {
      await AsyncStorage.setItem(
        devToolsStorageKeys.routeEvents.detailView(),
        view
      );
    } catch (error) {
      console.warn("Failed to save detail view preference:", error);
    }
  }, []);

  const renderRouteContent = (
    event: RouteChangeEvent,
    label: string
  ) => {
    return (
      <View style={styles.valueContent}>
        <View style={styles.valueHeader}>
          <Text style={styles.valueLabel}>{label}</Text>
        </View>
        <View style={styles.valueBox}>
          <DataViewer
            title=""
            data={{
              pathname: event.pathname,
              segments: event.segments,
              params: event.params,
              timestamp: new Date(event.timestamp).toISOString(),
            }}
            showTypeFilter={false}
          />
        </View>
      </View>
    );
  };

  // Get all events sorted by time
  const navigationItems = conversation.events.sort(
    (a, b) => a.timestamp - b.timestamp
  );
  const totalEvents = navigationItems.length;

  // Precise time HH:MM:SS.mmm
  const formatTimeWithMs = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    const ms = String(date.getMilliseconds()).padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  }, []);

  // Render current value tab
  const renderCurrentValue = () => {
    const selectedEvent = navigationItems[selectedEventIndex];
    const eventToShow = selectedEvent ?? conversation.lastEvent;

    return (
      <View style={styles.fullPageSection}>
        <View style={styles.contentCard}>
          {renderRouteContent(eventToShow, "CURRENT ROUTE STATE")}
        </View>
      </View>
    );
  };

  // Render diff tab
  const renderDiff = () => {
    if (navigationItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <AlertCircle size={32} color={macOSColors.text.muted} />
          <Text style={styles.emptyText}>No changes to display</Text>
        </View>
      );
    }

    const prevIndex = Math.max(0, selectedEventIndex - 1);
    const currentIndex = selectedEventIndex;
    const previousEvent = navigationItems[prevIndex];
    const currentEvent = navigationItems[currentIndex];

    return (
      <ScrollView style={styles.fullPageSection}>
        <View style={styles.diffContainer}>
          <View style={styles.diffSection}>
            <Text style={styles.diffSectionTitle}>PREVIOUS</Text>
            <View style={styles.contentCard}>
              {renderRouteContent(previousEvent, `Event #${prevIndex + 1}`)}
            </View>
          </View>

          <View style={styles.diffDivider} />

          <View style={styles.diffSection}>
            <Text style={styles.diffSectionTitle}>CURRENT</Text>
            <View style={styles.contentCard}>
              {renderRouteContent(currentEvent, `Event #${currentIndex + 1}`)}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <>
      <View
        style={[
          styles.contentOnly,
          {
            flex: 1,
            paddingBottom: !disableInternalFooter && totalEvents > 1 ? 80 : 0,
          },
        ]}
      >
        {/* Toggle Cards for View Selection */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleCard,
              internalActiveView === "current" && styles.viewToggleCardActive,
            ]}
            onPress={() => handleViewChange("current")}
            activeOpacity={0.8}
          >
            <View style={styles.viewToggleContent}>
              <NavigationIcon
                size={16}
                color={
                  internalActiveView === "current"
                    ? macOSColors.semantic.info
                    : macOSColors.text.secondary
                }
              />
              <Text
                style={[
                  styles.viewToggleLabel,
                  internalActiveView === "current" &&
                    styles.viewToggleLabelActive,
                ]}
              >
                CURRENT STATE
              </Text>
            </View>
            <Text
              style={[
                styles.viewToggleDescription,
                internalActiveView === "current" && {
                  color: macOSColors.text.primary,
                },
              ]}
            >
              View the current route state
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewToggleCard,
              internalActiveView === "diff" && styles.viewToggleCardActive,
            ]}
            onPress={() => handleViewChange("diff")}
            activeOpacity={0.8}
          >
            <View style={styles.viewToggleContent}>
              <GitBranch
                size={16}
                color={
                  internalActiveView === "diff"
                    ? macOSColors.semantic.success
                    : macOSColors.text.secondary
                }
              />
              <Text
                style={[
                  styles.viewToggleLabel,
                  internalActiveView === "diff" && styles.viewToggleLabelActive,
                ]}
              >
                DIFF VIEW
              </Text>
            </View>
            <Text
              style={[
                styles.viewToggleDescription,
                internalActiveView === "diff" && {
                  color: macOSColors.text.primary,
                },
              ]}
            >
              Compare changes between events
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on selected view */}
        {internalActiveView === "current" && renderCurrentValue()}
        {internalActiveView === "diff" && renderDiff()}
      </View>

      {/* Bottom Navigation - Fixed at bottom */}
      {totalEvents > 1 && !disableInternalFooter && (
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            onPress={() =>
              onEventIndexChange(Math.max(0, selectedEventIndex - 1))
            }
            disabled={selectedEventIndex === 0}
            style={[
              styles.navButton,
              selectedEventIndex === 0 && styles.navButtonDisabled,
            ]}
          >
            <ChevronLeft
              size={20}
              color={
                selectedEventIndex === 0
                  ? macOSColors.text.muted
                  : macOSColors.text.primary
              }
            />
            <Text
              style={[
                styles.navButtonText,
                selectedEventIndex === 0 && styles.navButtonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.eventCounterContainer}>
            <Text style={styles.eventCounter}>
              Event {selectedEventIndex + 1} of {totalEvents}
            </Text>
            <Text style={styles.eventTimestamp}>
              {formatRelativeTime(
                new Date(navigationItems[selectedEventIndex]?.timestamp)
              )}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              onEventIndexChange(
                Math.min(totalEvents - 1, selectedEventIndex + 1)
              )
            }
            disabled={selectedEventIndex === totalEvents - 1}
            style={[
              styles.navButton,
              selectedEventIndex === totalEvents - 1 &&
                styles.navButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.navButtonText,
                selectedEventIndex === totalEvents - 1 &&
                  styles.navButtonTextDisabled,
              ]}
            >
              Next
            </Text>
            <ChevronRight
              size={20}
              color={
                selectedEventIndex === totalEvents - 1
                  ? macOSColors.text.muted
                  : macOSColors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// External footer component to be rendered by the modal outside the ScrollView
export function RouteEventDetailFooter({
  conversation,
  selectedEventIndex = 0,
  onEventIndexChange = () => {},
}: {
  conversation: RouteConversation;
  selectedEventIndex?: number;
  onEventIndexChange?: (index: number) => void;
}) {
  const navigationItems = conversation.events.sort(
    (a, b) => a.timestamp - b.timestamp
  );
  const totalEvents = navigationItems.length;

  if (totalEvents <= 1) return null;

  return (
    <View style={styles.externalFooterBar}>
      <TouchableOpacity
        onPress={() => onEventIndexChange(Math.max(0, selectedEventIndex - 1))}
        disabled={selectedEventIndex === 0}
        style={[
          styles.navButton,
          selectedEventIndex === 0 && styles.navButtonDisabled,
        ]}
      >
        <ChevronLeft
          size={20}
          color={
            selectedEventIndex === 0
              ? macOSColors.text.muted
              : macOSColors.text.primary
          }
        />
        <Text
          style={[
            styles.navButtonText,
            selectedEventIndex === 0 && styles.navButtonTextDisabled,
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.eventCounterContainer}>
        <Text style={styles.eventCounter}>
          Event {selectedEventIndex + 1} of {totalEvents}
        </Text>
        <Text style={styles.eventTimestamp}>
          {formatRelativeTime(new Date(navigationItems[selectedEventIndex]?.timestamp))}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          onEventIndexChange(Math.min(totalEvents - 1, selectedEventIndex + 1))
        }
        disabled={selectedEventIndex === totalEvents - 1}
        style={[
          styles.navButton,
          selectedEventIndex === totalEvents - 1 && styles.navButtonDisabled,
        ]}
      >
        <Text
          style={[
            styles.navButtonText,
            selectedEventIndex === totalEvents - 1 &&
              styles.navButtonTextDisabled,
          ]}
        >
          Next
        </Text>
        <ChevronRight
          size={20}
          color={
            selectedEventIndex === totalEvents - 1
              ? macOSColors.text.muted
              : macOSColors.text.primary
          }
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contentOnly: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: macOSColors.background.base,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  externalFooterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: macOSColors.background.base,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  fullPageSection: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  valueContent: {
    marginTop: 4,
  },
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  valueBox: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.input,
    padding: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: macOSColors.background.card,
    minWidth: 100,
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  navButtonTextDisabled: {
    color: macOSColors.text.muted,
  },
  eventCounterContainer: {
    alignItems: "center",
  },
  eventCounter: {
    fontSize: 14,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  eventTimestamp: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    marginTop: 2,
  },
  contentCard: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },

  // View Toggle Cards
  viewToggleContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: macOSColors.background.base,
  },
  viewToggleCard: {
    flex: 1,
    backgroundColor: macOSColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 14,
    gap: 8,
  },
  viewToggleCardActive: {
    borderWidth: 1.5,
    borderColor: macOSColors.semantic.info,
    backgroundColor: macOSColors.semantic.infoBackground + "30",
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  viewToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewToggleLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: macOSColors.text.secondary,
    textTransform: "uppercase",
  },
  viewToggleLabelActive: {
    color: macOSColors.text.primary,
  },
  viewToggleDescription: {
    fontSize: 11,
    color: macOSColors.text.muted,
    lineHeight: 16,
  },

  // Diff view styles
  diffContainer: {
    gap: 16,
  },
  diffSection: {
    gap: 8,
  },
  diffSectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  diffDivider: {
    height: 1,
    backgroundColor: macOSColors.border.default,
    marginVertical: 8,
  },
});
