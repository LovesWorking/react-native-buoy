/**
 * RouteEventExpandedContent - Expanded view for route event details
 *
 * Shows 3 organized sections:
 * - Section A: Route Information (Template, From, To)
 * - Section B: Timing Information (Duration, Time)
 * - Section C: Parameters & Metadata (Segments, Parameters, Visit count)
 */

import { View, Text, StyleSheet } from "react-native";
import { macOSColors, InlineCopyButton } from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";
import type { RouteChangeEvent } from "../RouteObserver";

export interface RouteEventExpandedContentProps {
  event: RouteChangeEvent;
  visitNumber: number;
  routeTemplate: string | null;
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

export function RouteEventExpandedContent({
  event,
  visitNumber,
  routeTemplate,
}: RouteEventExpandedContentProps) {
  const hasParams = event.params && Object.keys(event.params).length > 0;

  return (
    <View style={styles.container}>
      {/* Section A: Route Information */}
      <View style={styles.section}>
        {/* Template (if dynamic) */}
        {routeTemplate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Template:</Text>
            <Text style={styles.detailValue}>{routeTemplate}</Text>
            <InlineCopyButton
              value={routeTemplate}
              buttonStyle={styles.copyButton}
            />
          </View>
        )}

        {/* Previous pathname */}
        {event.previousPathname && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>{event.previousPathname}</Text>
            <InlineCopyButton
              value={event.previousPathname}
              buttonStyle={styles.copyButton}
            />
          </View>
        )}

        {/* Current pathname */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>To:</Text>
          <Text style={styles.detailValue}>{event.pathname}</Text>
          <InlineCopyButton
            value={event.pathname}
            buttonStyle={styles.copyButton}
          />
        </View>
      </View>

      {/* Section B: Timing Information */}
      <View style={styles.section}>
        {/* Duration since previous */}
        {event.timeSincePrevious !== undefined && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {formatDuration(event.timeSincePrevious)}
            </Text>
          </View>
        )}

        {/* Full timestamp */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>
            {new Date(event.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Section C: Parameters & Metadata */}
      <View style={styles.section}>
        {/* Segments */}
        {event.segments && event.segments.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Segments:</Text>
            <Text style={styles.detailValue}>
              {event.segments.join(' → ')}
            </Text>
            <InlineCopyButton
              value={JSON.stringify(event.segments)}
              buttonStyle={styles.copyButton}
            />
          </View>
        )}

        {/* Parameters */}
        {hasParams && (
          <View style={styles.dataViewerContainer}>
            <View style={styles.dataViewerHeader}>
              <Text style={styles.dataViewerTitle}>
                Parameters ({Object.keys(event.params).length})
              </Text>
              <InlineCopyButton
                value={JSON.stringify(event.params, null, 2)}
                buttonStyle={styles.copyButton}
              />
            </View>
            <DataViewer
              data={event.params}
              title=""
              showTypeFilter={false}
            />
          </View>
        )}

        {/* Visit count */}
        {visitNumber > 1 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Visited:</Text>
            <Text style={styles.detailValue}>
              {visitNumber} time{visitNumber !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  section: {
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
    minWidth: 70,
  },

  detailValue: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },

  copyButton: {
    padding: 4,
    borderRadius: 4,
  },

  dataViewerContainer: {
    marginTop: 4,
  },

  dataViewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  dataViewerTitle: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    fontWeight: "600",
  },
});
