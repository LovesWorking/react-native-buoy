/**
 * RenderDetailView
 *
 * Minimal, glanceable view for render details.
 * Design principle: Dev should understand WHY in 3 seconds.
 *
 * Layout:
 * - Header: Component name + native type
 * - Answer Card: Cause badges + hook change (THE answer)
 * - History Row: Compact inline navigation
 */

import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import {
  macOSColors,
  CopyButton,
  formatRelativeTime,
} from "@react-buoy/shared-ui";
import { TreeDiffViewer } from "@react-buoy/shared-ui/dataViewer";
import type { TrackedRender } from "../utils/RenderTracker";
import { CAUSE_CONFIG, COMPONENT_CAUSE_CONFIG } from "./RenderCauseBadge";

/**
 * Format component render data for clipboard
 */
function formatRenderDetailForClipboard(render: TrackedRender): string {
  const lines: string[] = [];

  lines.push(`${render.componentName || render.displayName} (${render.viewType})`);
  lines.push(`Renders: ${render.renderCount}`);

  if (render.lastRenderCause) {
    const cause = render.lastRenderCause;
    if (cause.componentCause) {
      lines.push(`Cause: ${cause.componentCause.toUpperCase()} → ${cause.type.toUpperCase()}`);
    } else {
      lines.push(`Cause: ${cause.type.toUpperCase()}`);
    }
    if (cause.hookChanges?.length) {
      for (const hook of cause.hookChanges) {
        lines.push(`  ${hook.type}[${hook.index}]: ${hook.previousValue} → ${hook.currentValue}`);
      }
    }
  }

  if (render.renderHistory?.length) {
    lines.push(`\nHistory (${render.renderHistory.length} events):`);
    for (const event of render.renderHistory) {
      const causeStr = event.cause.componentCause
        ? `${event.cause.componentCause.toUpperCase()} → ${event.cause.type.toUpperCase()}`
        : event.cause.type.toUpperCase();
      lines.push(`  #${event.renderNumber}: ${causeStr}`);
    }
  }

  return lines.join("\n");
}

interface RenderDetailViewProps {
  render: TrackedRender;
  /** If true, do not render the internal footer in history view */
  disableInternalFooter?: boolean;
  /** Selected event index for history view (controlled) */
  selectedEventIndex?: number;
  /** Callback when event index changes in history view */
  onEventIndexChange?: (index: number) => void;
}

// Re-export footer for backward compatibility
export { RenderHistoryFooter } from "./RenderHistoryViewer";

export function RenderDetailView({
  render,
  disableInternalFooter = false,
  selectedEventIndex: externalIndex,
  onEventIndexChange: externalOnChange,
}: RenderDetailViewProps) {
  // Internal state for event index when not controlled externally
  const [internalIndex, setInternalIndex] = useState(0);

  // Use external or internal state
  const selectedEventIndex = externalIndex ?? internalIndex;
  const onEventIndexChange = externalOnChange ?? setInternalIndex;

  // Get events sorted by timestamp (oldest first)
  const events = useMemo(() => {
    if (!render.renderHistory || render.renderHistory.length === 0) {
      return [];
    }
    return [...render.renderHistory].sort((a, b) => a.timestamp - b.timestamp);
  }, [render.renderHistory]);

  const totalEvents = events.length;
  const currentEvent = events[selectedEventIndex];

  // Use current event's cause if available, otherwise fall back to lastRenderCause
  const displayCause = currentEvent?.cause || render.lastRenderCause;

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

  // Memoize copy data
  const copyData = useMemo(() => formatRenderDetailForClipboard(render), [render]);

  // Get component name (prefer componentName, fall back to displayName)
  const componentName = render.componentName || render.displayName;
  const nativeType = render.viewType;

  // Calculate render stats
  const renderDuration = render.lastRenderTime - render.firstRenderTime;
  const rendersPerSec = renderDuration > 0
    ? (render.renderCount / (renderDuration / 1000)).toFixed(1)
    : render.renderCount.toString();

  return (
    <View style={styles.container}>
      {/* Header: Component name + native type + copy button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.componentName} numberOfLines={1}>
            {componentName}
          </Text>
          <View style={styles.nativeTypeBadge}>
            <Text style={styles.nativeTypeText}>{nativeType}</Text>
          </View>
        </View>
        <CopyButton value={copyData} size={14} />
      </View>

      {/* Scrollable content area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Answer Card: THE answer to "why did this render?" */}
        {displayCause && (
          <AnswerCard
            cause={displayCause}
            renderNumber={currentEvent?.renderNumber}
          />
        )}

        {/* Details Section: Identifiers + Stats */}
        <DetailsSection render={render} rendersPerSec={rendersPerSec} />
      </ScrollView>

      {/* History Row: Compact inline navigation (sticky at bottom) */}
      {totalEvents > 0 && !disableInternalFooter && (
        <HistoryRow
          currentIndex={selectedEventIndex}
          totalEvents={totalEvents}
          timestamp={currentEvent?.timestamp}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}
    </View>
  );
}

/**
 * AnswerCard - The hero section showing WHY the component rendered
 * Design: Single badge + what changed below it
 */
function AnswerCard({
  cause,
  renderNumber,
}: {
  cause: NonNullable<TrackedRender["lastRenderCause"]>;
  renderNumber?: number;
}) {
  // Use component cause if available, otherwise native cause
  const displayCauseType = cause.componentCause || cause.type;
  const config = cause.componentCause
    ? COMPONENT_CAUSE_CONFIG[cause.componentCause]
    : CAUSE_CONFIG[cause.type];

  const hasHookChanges = cause.hookChanges && cause.hookChanges.length > 0;
  const hasChangedKeys = cause.changedKeys && cause.changedKeys.length > 0;

  // Get contextual label based on cause type
  const getLabel = () => {
    if (cause.type === "mount") return "First render";
    if (displayCauseType === "parent") return "Triggered by";
    return "Changed:";
  };

  return (
    <View style={styles.answerCard}>
      {/* Label: [BADGE] */}
      <View style={styles.causeBadgeRow}>
        <Text style={styles.causeLabel}>{getLabel()}</Text>
        <View style={[styles.causeBadgeLarge, { backgroundColor: config.color + "20" }]}>
          <Text style={[styles.causeBadgeLargeText, { color: config.color }]}>
            {config.label.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Hook Changes - show the actual diff */}
      {hasHookChanges && (
        <View style={styles.hookChangesContainer}>
          {cause.hookChanges!.map((hook, index) => {
            const hookKey = `${hook.type}[${hook.index}]`;
            const oldValue = { [hookKey]: hook.previousValue };
            const newValue = { [hookKey]: hook.currentValue };

            return (
              <View key={index} style={styles.hookDiffContainer}>
                <TreeDiffViewer
                  oldValue={oldValue}
                  newValue={newValue}
                  theme="dark"
                  showUnchanged={false}
                />
              </View>
            );
          })}
        </View>
      )}

      {/* Props changes (when no hook changes) */}
      {!hasHookChanges && hasChangedKeys && (
        <View style={styles.propsChangesContainer}>
          {cause.changedKeys!.filter(k => !k.includes("(ref only)")).slice(0, 5).map((key, index) => (
            <View key={index} style={styles.propChangeChip}>
              <Text style={styles.propChangeText}>{key}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * DetailsSection - Component identifiers, measurements, and stats
 * Helps devs find the component in their codebase
 */
function DetailsSection({
  render,
  rendersPerSec,
}: {
  render: TrackedRender;
  rendersPerSec: string;
}) {
  const hasIdentifiers = render.testID || render.nativeID || render.accessibilityLabel;
  const hasMeasurements = render.measurements;

  return (
    <View style={styles.detailsSection}>
      {/* Identifiers - help find in codebase */}
      {hasIdentifiers && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsCardTitle}>Identifiers</Text>
          {render.testID && (
            <DetailRow label="testID" value={render.testID} />
          )}
          {render.nativeID && (
            <DetailRow label="nativeID" value={render.nativeID} />
          )}
          {render.accessibilityLabel && (
            <DetailRow label="a11y" value={render.accessibilityLabel} />
          )}
        </View>
      )}

      {/* Stats Row - compact horizontal stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: render.color }]}>
            {render.renderCount}
          </Text>
          <Text style={styles.statLabel}>renders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{rendersPerSec}</Text>
          <Text style={styles.statLabel}>/sec</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{render.nativeTag}</Text>
          <Text style={styles.statLabel}>tag</Text>
        </View>
      </View>

      {/* Measurements - position/size */}
      {hasMeasurements && (
        <View style={styles.measurementsRow}>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementLabel}>x</Text>
            <Text style={styles.measurementValue}>
              {Math.round(render.measurements!.x)}
            </Text>
          </View>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementLabel}>y</Text>
            <Text style={styles.measurementValue}>
              {Math.round(render.measurements!.y)}
            </Text>
          </View>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementLabel}>w</Text>
            <Text style={styles.measurementValue}>
              {Math.round(render.measurements!.width)}
            </Text>
          </View>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementLabel}>h</Text>
            <Text style={styles.measurementValue}>
              {Math.round(render.measurements!.height)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * DetailRow - Single row for identifier display
 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/**
 * HistoryRow - Compact inline navigation for render history
 */
function HistoryRow({
  currentIndex,
  totalEvents,
  timestamp,
  onPrevious,
  onNext,
}: {
  currentIndex: number;
  totalEvents: number;
  timestamp?: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalEvents - 1;
  const relativeTime = timestamp
    ? formatRelativeTime(new Date(timestamp))
    : "now";

  return (
    <View style={styles.historyRow}>
      <Text style={styles.historyLabel}>History</Text>

      <View style={styles.historyNav}>
        <TouchableOpacity
          style={[styles.historyNavButton, !canGoPrevious && styles.historyNavButtonDisabled]}
          onPress={onPrevious}
          disabled={!canGoPrevious}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.historyNavButtonText, !canGoPrevious && styles.historyNavButtonTextDisabled]}>
            ◀
          </Text>
        </TouchableOpacity>

        <Text style={styles.historyIndex}>
          {currentIndex + 1}/{totalEvents}
        </Text>

        <TouchableOpacity
          style={[styles.historyNavButton, !canGoNext && styles.historyNavButtonDisabled]}
          onPress={onNext}
          disabled={!canGoNext}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.historyNavButtonText, !canGoNext && styles.historyNavButtonTextDisabled]}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.historyTime}>{relativeTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
    paddingBottom: 0,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 80,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  componentName: {
    fontSize: 18,
    fontWeight: "700",
    color: macOSColors.text.primary,
    flexShrink: 1,
  },
  nativeTypeBadge: {
    backgroundColor: macOSColors.background.input,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  nativeTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },

  // Answer Card
  answerCard: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 12,
    gap: 6,
  },
  causeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  causeBadgeLarge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  causeBadgeLargeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  causeLabel: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    fontWeight: "500",
  },
  hookChangesContainer: {
    gap: 6,
  },
  hookDiffContainer: {
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    overflow: "hidden",
  },
  propsChangesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  propChangeChip: {
    backgroundColor: macOSColors.background.input,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  propChangeText: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },

  // History Row
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default + "60",
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.secondary,
  },
  historyNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyNavButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  historyNavButtonDisabled: {
    opacity: 0.4,
  },
  historyNavButtonText: {
    fontSize: 12,
    color: macOSColors.text.primary,
  },
  historyNavButtonTextDisabled: {
    color: macOSColors.text.muted,
  },
  historyIndex: {
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    minWidth: 40,
    textAlign: "center",
  },
  historyTime: {
    fontSize: 12,
    color: macOSColors.text.muted,
  },

  // Details Section
  detailsSection: {
    gap: 10,
  },
  detailsCard: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 12,
    gap: 6,
  },
  detailsCardTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: macOSColors.text.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    minWidth: 55,
  },
  detailValue: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  statLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: macOSColors.border.default,
    marginHorizontal: 12,
  },

  // Measurements Row
  measurementsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  measurementItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  measurementLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: macOSColors.text.muted,
    textTransform: "uppercase",
  },
  measurementValue: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
});

export default RenderDetailView;
