/**
 * RenderHistoryViewer
 *
 * Displays render history for a component with event stepping.
 * Allows navigating through render events chronologically.
 * Shows current state view or diff view between renders.
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import {
  macOSColors,
  Clock,
  GitBranch,
  Database,
  formatRelativeTime,
  SectionHeader,
  EventStepperFooter,
} from "@react-buoy/shared-ui";
import { TreeDiffViewer } from "@react-buoy/shared-ui/dataViewer";
import type { TrackedRender, RenderEvent } from "../utils/RenderTracker";
import { RenderCauseBadge, EnhancedCauseDisplay, CAUSE_CONFIG } from "./RenderCauseBadge";

interface RenderHistoryViewerProps {
  render: TrackedRender;
  /** If true, use external footer (modal provides it) */
  disableInternalFooter?: boolean;
  /** Selected event index (0 = oldest) */
  selectedEventIndex?: number;
  /** Callback when event index changes */
  onEventIndexChange?: (index: number) => void;
}

/**
 * Format timestamp with milliseconds
 */
function formatTimeWithMs(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + `.${date.getMilliseconds().toString().padStart(3, "0")}`;
}

/**
 * Main RenderHistoryViewer component
 */
export function RenderHistoryViewer({
  render,
  disableInternalFooter = false,
  selectedEventIndex: externalIndex,
  onEventIndexChange: externalOnChange,
}: RenderHistoryViewerProps) {
  // Internal state for event index when not controlled externally
  const [internalIndex, setInternalIndex] = useState(0);

  // Use external or internal state
  const selectedEventIndex = externalIndex ?? internalIndex;
  const onEventIndexChange = externalOnChange ?? setInternalIndex;

  // View mode: "current" shows selected event, "diff" shows comparison
  const [activeView, setActiveView] = useState<"current" | "diff">("current");

  // Get events sorted by timestamp (oldest first)
  const events = useMemo(() => {
    if (!render.renderHistory || render.renderHistory.length === 0) {
      return [];
    }
    return [...render.renderHistory].sort((a, b) => a.timestamp - b.timestamp);
  }, [render.renderHistory]);

  const totalEvents = events.length;
  const currentEvent = events[selectedEventIndex];
  const previousEvent = selectedEventIndex > 0 ? events[selectedEventIndex - 1] : null;

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    if (selectedEventIndex > 0) {
      onEventIndexChange(selectedEventIndex - 1);
    }
  }, [selectedEventIndex, onEventIndexChange]);

  const goToNext = useCallback(() => {
    if (selectedEventIndex < totalEvents - 1) {
      onEventIndexChange(selectedEventIndex + 1);
    }
  }, [selectedEventIndex, totalEvents, onEventIndexChange]);

  // If no history, show empty state
  if (totalEvents === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Clock size={32} color={macOSColors.text.muted} />
        <Text style={styles.emptyTitle}>No Render History</Text>
        <Text style={styles.emptyText}>
          Enable render history tracking in settings to see render events here.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingBottom: !disableInternalFooter && totalEvents > 1 ? 80 : 0,
          },
        ]}
      >
        {/* View Toggle Cards */}
        <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggleCard,
            activeView === "current" && styles.viewToggleCardActive,
          ]}
          onPress={() => setActiveView("current")}
          activeOpacity={0.8}
        >
          <View style={styles.viewToggleContent}>
            <Database
              size={16}
              color={
                activeView === "current"
                  ? macOSColors.semantic.info
                  : macOSColors.text.secondary
              }
            />
            <Text
              style={[
                styles.viewToggleLabel,
                activeView === "current" && styles.viewToggleLabelActive,
              ]}
            >
              CURRENT STATE
            </Text>
          </View>
          <Text
            style={[
              styles.viewToggleDescription,
              activeView === "current" && { color: macOSColors.text.primary },
            ]}
          >
            View render #{currentEvent?.renderNumber ?? 0} details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewToggleCard,
            activeView === "diff" && styles.viewToggleCardActive,
          ]}
          onPress={() => setActiveView("diff")}
          activeOpacity={0.8}
          disabled={!previousEvent}
        >
          <View style={styles.viewToggleContent}>
            <GitBranch
              size={16}
              color={
                activeView === "diff"
                  ? macOSColors.semantic.info
                  : macOSColors.text.secondary
              }
            />
            <Text
              style={[
                styles.viewToggleLabel,
                activeView === "diff" && styles.viewToggleLabelActive,
                !previousEvent && styles.viewToggleLabelDisabled,
              ]}
            >
              DIFF VIEW
            </Text>
          </View>
          <Text
            style={[
              styles.viewToggleDescription,
              activeView === "diff" && { color: macOSColors.text.primary },
              !previousEvent && { color: macOSColors.text.muted },
            ]}
          >
            {previousEvent
              ? `Compare render #${previousEvent.renderNumber} → #${currentEvent?.renderNumber}`
              : "Need 2+ events to compare"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeView === "current" ? (
          <CurrentStateView event={currentEvent} render={render} />
        ) : (
          <DiffView
            previousEvent={previousEvent}
            currentEvent={currentEvent}
            render={render}
          />
        )}
      </ScrollView>
      </View>

      {/* Event Stepping Footer */}
      {!disableInternalFooter && (
        <EventStepperFooter
          currentIndex={selectedEventIndex}
          totalItems={totalEvents}
          onPrevious={goToPrevious}
          onNext={goToNext}
          itemLabel="Render"
          subtitle={formatRelativeTime(new Date(currentEvent?.timestamp ?? Date.now()))}
        />
      )}
    </>
  );
}

/**
 * Current State View - shows details of the selected render event
 */
function CurrentStateView({
  event,
  render,
}: {
  event: RenderEvent | undefined;
  render: TrackedRender;
}) {
  if (!event) {
    return (
      <View style={styles.noEventContainer}>
        <Text style={styles.noEventText}>No event selected</Text>
      </View>
    );
  }

  const causeConfig = CAUSE_CONFIG[event.cause.type];

  return (
    <View style={styles.currentStateContainer}>
      {/* Event Header */}
      <View style={styles.eventHeader}>
        <View style={styles.eventHeaderLeft}>
          <Text style={styles.eventTitle}>Render #{event.renderNumber}</Text>
          <Text style={styles.eventTime}>{formatTimeWithMs(event.timestamp)}</Text>
        </View>
        <View style={[styles.eventBadge, { backgroundColor: render.color + "30" }]}>
          <View style={[styles.eventBadgeDot, { backgroundColor: render.color }]} />
          <Text style={[styles.eventBadgeText, { color: render.color }]}>
            {event.cause.type.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Cause Section - Phase 5: Enhanced display */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Clock} color={causeConfig.color} size={12} />
          <SectionHeader.Title>WHY DID THIS RENDER?</SectionHeader.Title>
        </SectionHeader>
        <View style={styles.sectionContent}>
          <EnhancedCauseDisplay cause={event.cause} nativeType={render.viewType} />
        </View>
      </View>

      {/* Captured Props (if available) */}
      {event.capturedProps && Object.keys(event.capturedProps).length > 0 && (
        <View style={styles.section}>
          <SectionHeader>
            <SectionHeader.Icon icon={Database} color={macOSColors.semantic.info} size={12} />
            <SectionHeader.Title>CAPTURED PROPS</SectionHeader.Title>
          </SectionHeader>
          <View style={styles.sectionContent}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.propsScrollView}
            >
              <Text style={styles.propsJson}>
                {JSON.stringify(event.capturedProps, null, 2)}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Diff mode types
 */
type DiffMode = "props" | "state" | "cause";

/**
 * Diff View - shows comparison between two render events
 */
function DiffView({
  previousEvent,
  currentEvent,
  render,
}: {
  previousEvent: RenderEvent | null;
  currentEvent: RenderEvent | undefined;
  render: TrackedRender;
}) {
  // Diff mode tab state
  const [diffMode, setDiffMode] = useState<DiffMode>("props");

  if (!previousEvent || !currentEvent) {
    return (
      <View style={styles.noEventContainer}>
        <Text style={styles.noEventText}>
          Select an event with a previous event to compare
        </Text>
      </View>
    );
  }

  const prevCauseConfig = CAUSE_CONFIG[previousEvent.cause.type];
  const currCauseConfig = CAUSE_CONFIG[currentEvent.cause.type];

  // Check what data is available for diff
  const hasPropsData = previousEvent.capturedProps && currentEvent.capturedProps;
  const hasStateData = previousEvent.capturedState && currentEvent.capturedState;

  return (
    <View style={styles.diffContainer}>
      {/* Compare Bar */}
      <View style={styles.compareBar}>
        {/* PREV side */}
        <View style={styles.compareSide}>
          <View style={styles.compareLabelRow}>
            <Text style={[styles.compareLabel, { color: macOSColors.semantic.warning }]}>
              PREV
            </Text>
            <View
              style={[
                styles.compareActionBadge,
                { backgroundColor: `${prevCauseConfig.color}20` },
              ]}
            >
              <Text style={[styles.compareActionText, { color: prevCauseConfig.color }]}>
                {previousEvent.cause.type.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.compareMeta}>
            <Text style={styles.compareIndex}>
              #{previousEvent.renderNumber}
            </Text>
            <Text style={styles.compareTime}>
              {formatTimeWithMs(previousEvent.timestamp)}
            </Text>
          </View>
        </View>

        <View style={styles.compareDivider}>
          <Text style={styles.compareArrow}>→</Text>
        </View>

        {/* CUR side */}
        <View style={styles.compareSide}>
          <View style={styles.compareLabelRow}>
            <Text style={[styles.compareLabel, { color: macOSColors.semantic.success }]}>
              CUR
            </Text>
            <View
              style={[
                styles.compareActionBadge,
                { backgroundColor: `${currCauseConfig.color}20` },
              ]}
            >
              <Text style={[styles.compareActionText, { color: currCauseConfig.color }]}>
                {currentEvent.cause.type.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.compareMeta}>
            <Text style={styles.compareIndex}>
              #{currentEvent.renderNumber}
            </Text>
            <Text style={styles.compareTime}>
              {formatTimeWithMs(currentEvent.timestamp)}
            </Text>
          </View>
        </View>
      </View>

      {/* Diff Mode Tabs */}
      <View style={styles.diffModeTabs}>
        <TouchableOpacity
          style={[styles.diffModeTab, diffMode === "cause" && styles.diffModeTabActive]}
          onPress={() => setDiffMode("cause")}
          activeOpacity={0.7}
        >
          <Text style={[styles.diffModeTabText, diffMode === "cause" && styles.diffModeTabTextActive]}>
            CAUSE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.diffModeTab,
            diffMode === "props" && styles.diffModeTabActive,
            !hasPropsData && styles.diffModeTabDisabled,
          ]}
          onPress={() => hasPropsData && setDiffMode("props")}
          activeOpacity={hasPropsData ? 0.7 : 1}
        >
          <Text
            style={[
              styles.diffModeTabText,
              diffMode === "props" && styles.diffModeTabTextActive,
              !hasPropsData && styles.diffModeTabTextDisabled,
            ]}
          >
            PROPS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.diffModeTab,
            diffMode === "state" && styles.diffModeTabActive,
            !hasStateData && styles.diffModeTabDisabled,
          ]}
          onPress={() => hasStateData && setDiffMode("state")}
          activeOpacity={hasStateData ? 0.7 : 1}
        >
          <Text
            style={[
              styles.diffModeTabText,
              diffMode === "state" && styles.diffModeTabTextActive,
              !hasStateData && styles.diffModeTabTextDisabled,
            ]}
          >
            STATE
          </Text>
        </TouchableOpacity>
      </View>

      {/* Diff Content based on mode - Phase 5: Enhanced display */}
      {diffMode === "cause" && (
        <View style={styles.diffSummary}>
          <EnhancedCauseDisplay cause={currentEvent.cause} nativeType={render.viewType} />
        </View>
      )}

      {diffMode === "props" && (
        <View style={styles.treeDiffContainer}>
          {hasPropsData ? (
            <TreeDiffViewer
              oldValue={previousEvent.capturedProps}
              newValue={currentEvent.capturedProps}
              theme="dark"
              showUnchanged={true}
            />
          ) : (
            <View style={styles.noDiffData}>
              <Text style={styles.noDiffDataTitle}>Props Not Captured</Text>
              <Text style={styles.noDiffDataText}>
                Enable "Capture Props on Render" in settings to see props diff.
              </Text>
            </View>
          )}
        </View>
      )}

      {diffMode === "state" && (
        <View style={styles.treeDiffContainer}>
          {hasStateData ? (
            <TreeDiffViewer
              oldValue={previousEvent.capturedState}
              newValue={currentEvent.capturedState}
              theme="dark"
              showUnchanged={true}
            />
          ) : (
            <View style={styles.noDiffData}>
              <Text style={styles.noDiffDataTitle}>State Not Captured</Text>
              <Text style={styles.noDiffDataText}>
                Enable "Capture State on Render" in settings to see state diff.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * External footer component for modal integration
 */
export function RenderHistoryFooter({
  render,
  selectedEventIndex = 0,
  onEventIndexChange = () => {},
}: {
  render: TrackedRender;
  selectedEventIndex?: number;
  onEventIndexChange?: (index: number) => void;
}) {
  const events = useMemo(() => {
    if (!render.renderHistory || render.renderHistory.length === 0) {
      return [];
    }
    return [...render.renderHistory].sort((a, b) => a.timestamp - b.timestamp);
  }, [render.renderHistory]);

  const totalEvents = events.length;
  const currentEvent = events[selectedEventIndex];

  const goToPrevious = useCallback(() => {
    onEventIndexChange(Math.max(0, selectedEventIndex - 1));
  }, [selectedEventIndex, onEventIndexChange]);

  const goToNext = useCallback(() => {
    onEventIndexChange(Math.min(totalEvents - 1, selectedEventIndex + 1));
  }, [selectedEventIndex, totalEvents, onEventIndexChange]);

  return (
    <EventStepperFooter
      currentIndex={selectedEventIndex}
      totalItems={totalEvents}
      onPrevious={goToPrevious}
      onNext={goToNext}
      itemLabel="Render"
      subtitle={currentEvent ? formatRelativeTime(new Date(currentEvent.timestamp)) : undefined}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: macOSColors.text.primary,
  },
  emptyText: {
    fontSize: 13,
    color: macOSColors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
  },
  viewToggleContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  viewToggleCard: {
    flex: 1,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 10,
    gap: 4,
  },
  viewToggleCardActive: {
    borderColor: macOSColors.semantic.info,
    backgroundColor: `${macOSColors.semantic.info}10`,
  },
  viewToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewToggleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: macOSColors.text.secondary,
    letterSpacing: 0.5,
  },
  viewToggleLabelActive: {
    color: macOSColors.semantic.info,
  },
  viewToggleLabelDisabled: {
    color: macOSColors.text.muted,
  },
  viewToggleDescription: {
    fontSize: 11,
    color: macOSColors.text.muted,
    marginTop: 2,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingTop: 0,
  },
  noEventContainer: {
    padding: 24,
    alignItems: "center",
  },
  noEventText: {
    fontSize: 13,
    color: macOSColors.text.muted,
  },
  currentStateContainer: {
    gap: 12,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 12,
  },
  eventHeaderLeft: {
    gap: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: macOSColors.text.primary,
  },
  eventTime: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
  eventBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  eventBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  section: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    overflow: "hidden",
  },
  sectionContent: {
    padding: 12,
    paddingTop: 8,
  },
  causeContainer: {
    marginBottom: 12,
  },
  changedList: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  changedListTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    marginBottom: 6,
  },
  changedItem: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    marginBottom: 3,
    paddingLeft: 8,
  },
  propsScrollView: {
    maxHeight: 150,
  },
  propsJson: {
    fontSize: 11,
    fontFamily: "monospace",
    color: macOSColors.text.primary,
    backgroundColor: macOSColors.background.input,
    padding: 10,
    borderRadius: 6,
  },
  diffContainer: {
    gap: 12,
  },
  compareBar: {
    flexDirection: "row",
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 10,
  },
  compareSide: {
    flex: 1,
    gap: 4,
  },
  compareLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compareLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  compareActionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compareActionText: {
    fontSize: 9,
    fontWeight: "600",
  },
  compareMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compareIndex: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.primary,
  },
  compareTime: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
  compareDivider: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  compareArrow: {
    fontSize: 16,
    color: macOSColors.text.muted,
  },
  diffSummary: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 12,
  },
  diffSummaryTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    marginBottom: 8,
  },
  diffChanges: {
    gap: 4,
  },
  diffChangeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diffChangeIcon: {
    fontSize: 12,
    fontWeight: "700",
    color: macOSColors.semantic.warning,
    fontFamily: "monospace",
  },
  diffChangeKey: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  diffNoChanges: {
    fontSize: 12,
    color: macOSColors.text.muted,
    fontStyle: "italic",
  },
  diffPlaceholder: {
    fontSize: 12,
    color: macOSColors.text.muted,
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
  },
  // Diff mode tabs
  diffModeTabs: {
    flexDirection: "row",
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 4,
    gap: 4,
  },
  diffModeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  diffModeTabActive: {
    backgroundColor: macOSColors.semantic.info + "20",
  },
  diffModeTabDisabled: {
    opacity: 0.4,
  },
  diffModeTabText: {
    fontSize: 10,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    letterSpacing: 0.5,
  },
  diffModeTabTextActive: {
    color: macOSColors.semantic.info,
  },
  diffModeTabTextDisabled: {
    color: macOSColors.text.muted,
  },
  // Cause diff styles
  causeDiffContainer: {
    gap: 8,
    marginBottom: 12,
  },
  causeDiffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  causeDiffLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    minWidth: 80,
  },
  causeDiffValue: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  diffChangesTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    marginBottom: 6,
  },
  // Tree diff container
  treeDiffContainer: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    overflow: "hidden",
    minHeight: 150,
  },
  noDiffData: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  noDiffDataTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.text.primary,
  },
  noDiffDataText: {
    fontSize: 12,
    color: macOSColors.text.muted,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default RenderHistoryViewer;
