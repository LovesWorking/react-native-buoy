import { memo } from "react";
import { StyleSheet, View, Text } from "react-native";
import {
  ChevronRight,
  Upload,
  Download,
  Clock,
  AlertCircle,
  ListItem,
  MethodBadge,
  TypeBadge,
  gameUIColors,
  macOSColors,
} from "@react-buoy/shared-ui";
import type { NetworkEvent } from "../types";
import { formatBytes, formatDuration } from "../utils/formatting";
import { formatRelativeTime } from "@react-buoy/shared-ui";
import { useTickEveryMinute } from "../hooks/useTickEveryMinute";
import { formatGraphQLDisplay } from "../utils/formatGraphQLVariables";

interface NetworkEventItemCompactProps {
  event: NetworkEvent;
  onPress: (event: NetworkEvent) => void;
}

// Get color based on status
function getStatusColor(status?: number, error?: string) {
  if (error) return macOSColors.semantic.error;
  if (!status) return macOSColors.semantic.warning;
  if (status >= 200 && status < 300) return macOSColors.semantic.success;
  if (status >= 300 && status < 400) return macOSColors.semantic.info;
  if (status >= 400) return macOSColors.semantic.error;
  return macOSColors.text.muted;
}

// Get content type badge with color
function getContentTypeBadge(headers: Record<string, string>) {
  const contentType =
    headers?.["content-type"] || headers?.["Content-Type"] || "";
  if (contentType.includes("json")) return "JSON";
  if (contentType.includes("xml")) return "XML";
  if (contentType.includes("html")) return "HTML";
  if (contentType.includes("text")) return "TEXT";
  if (contentType.includes("image")) return "IMG";
  if (contentType.includes("video")) return "VIDEO";
  if (contentType.includes("audio")) return "AUDIO";
  if (contentType.includes("form")) return "FORM";
  return null;
}

// Decomposed components following rule3 - Component Composition

// Status indicator component - single responsibility
function StatusIndicator({
  event,
  isPending,
  statusColor,
}: {
  event: NetworkEvent;
  isPending: boolean;
  statusColor: string;
}) {
  if (isPending) {
    return (
      <View style={styles.pendingBadge}>
        <Clock size={10} color={macOSColors.semantic.warning} />
        <Text style={styles.pendingText}>...</Text>
      </View>
    );
  }

  if (event.error) {
    return (
      <View style={styles.errorBadge}>
        <AlertCircle size={10} color={macOSColors.semantic.error} />
        <Text style={styles.errorText}>ERR</Text>
      </View>
    );
  }

  return (
    <View style={styles.statusBadge}>
      <Text style={[styles.statusText, { color: statusColor }]}>
        {String(event.status)}
      </Text>
    </View>
  );
}

// Size indicators component - single responsibility
function SizeIndicators({
  requestSize,
  responseSize,
}: {
  requestSize?: number;
  responseSize?: number;
}) {
  if (!requestSize && !responseSize) return null;

  return (
    <View style={styles.sizeRow}>
      {requestSize ? (
        <View style={styles.sizeItem}>
          <Upload size={8} color={macOSColors.semantic.info} />
          <Text style={styles.sizeText}>{formatBytes(requestSize)}</Text>
        </View>
      ) : null}
      {responseSize ? (
        <View style={styles.sizeItem}>
          <Download size={8} color={macOSColors.semantic.success} />
          <Text style={styles.sizeText}>{formatBytes(responseSize)}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Compact list-row representation of a network event. Optimized for large lists with memoization
 * and periodic refresh via `useTickEveryMinute` to keep relative timestamps accurate.
 */
export const NetworkEventItemCompact = memo<NetworkEventItemCompactProps>(
  ({ event, onPress }) => {
    const tick = useTickEveryMinute();
    const statusColor = getStatusColor(event.status, event.error);
    const isPending = !event.status && !event.error;
    const contentType = getContentTypeBadge(event.responseHeaders);

    // Format URL for display (max 2 lines)
    let displayUrl = event.path || event.url.replace(/^https?:\/\/[^/]+/, "");

    // If this is a GraphQL request, show operation name with variables using arrow notation
    // Matches React Query pattern: ["pokemon", "Sandshrew"] → "pokemon › Sandshrew"
    if (event.requestClient === "graphql") {
      if (event.operationName) {
        // Format: GetPokemon › Sandshrew (matches React Query pattern)
        displayUrl = formatGraphQLDisplay(
          event.operationName,
          event.graphqlVariables
        );
      } else {
        // If no operation name found, just remove the redundant /graphql path
        displayUrl = displayUrl.replace(/\/graphql[^?]*/, "/graphql");
      }
    } else if (event.operationName) {
      // For non-GraphQL requests with operation names (e.g., gRPC)
      displayUrl = `${displayUrl}\n(${event.operationName})`;
    }

    // Format time with both absolute and relative
    const timeString = new Date(event.timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const relativeTime = formatRelativeTime(event.timestamp, tick);

    return (
      <ListItem
        onPress={() => onPress(event)}
        style={[styles.container, { borderLeftColor: statusColor }]}
      >
        {/* Left section: Method badge, client badge, and size indicators */}
        <View style={styles.leftSection}>
          <MethodBadge method={event.method} size="small" />
          {event.requestClient && (
            <View
              style={[
                styles.clientBadge,
                {
                  backgroundColor:
                    event.requestClient === "fetch"
                      ? "rgba(74, 144, 226, 0.15)"
                      : event.requestClient === "graphql"
                      ? "rgba(229, 53, 171, 0.15)"
                      : event.requestClient === "grpc-web"
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(147, 51, 234, 0.15)",
                },
              ]}
            >
              <Text
                style={[
                  styles.clientText,
                  {
                    color:
                      event.requestClient === "fetch"
                        ? "#4A90E2"
                        : event.requestClient === "graphql"
                        ? "#E535AB"
                        : event.requestClient === "grpc-web"
                        ? "#10B981"
                        : "#9333EA",
                  },
                ]}
              >
                {event.requestClient === "graphql"
                  ? "GQL"
                  : event.requestClient === "grpc-web"
                  ? "gRPC"
                  : event.requestClient}
              </Text>
            </View>
          )}
          <SizeIndicators
            requestSize={event.requestSize}
            responseSize={event.responseSize}
          />
        </View>

        {/* Middle section: URL (max 2 lines) */}
        <View style={styles.middleSection}>
          <Text style={styles.urlText} numberOfLines={2}>
            {displayUrl}
          </Text>
        </View>

        {/* Right section: Status, time, size in column */}
        <View style={styles.rightSection}>
          <View style={styles.rightTopRow}>
            <StatusIndicator
              event={event}
              isPending={isPending}
              statusColor={statusColor}
            />

            {/* Duration */}
            {event.duration ? (
              <Text style={styles.durationText}>
                {formatDuration(event.duration)}
              </Text>
            ) : null}

            {/* Content type badge */}
            {contentType ? <TypeBadge type={contentType} size="small" /> : null}
          </View>

          {/* Bottom row: Time and size */}
          <View style={styles.rightBottomRow}>
            <ListItem.Metadata>
              {timeString} ({relativeTime})
            </ListItem.Metadata>
          </View>
        </View>

        {/* Chevron */}
        <ChevronRight size={14} color={macOSColors.text.muted} />
      </ListItem>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    paddingLeft: 8,
    marginBottom: 4,
    marginHorizontal: 12,
    minHeight: 44,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  leftSection: {
    marginRight: 8,
    alignItems: "flex-start",
    paddingTop: 2,
  },
  middleSection: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  urlText: {
    fontSize: 12,
    color: macOSColors.text.primary,
    lineHeight: 16,
    fontFamily: "monospace",
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginRight: 4,
  },
  rightTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  rightBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: macOSColors.semantic.warning + "26",
    borderRadius: 3,
  },
  pendingText: {
    fontSize: 10,
    color: macOSColors.semantic.warning,
    fontWeight: "600",
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: macOSColors.semantic.error + "26",
    borderRadius: 3,
  },
  errorText: {
    fontSize: 10,
    color: macOSColors.semantic.error,
    fontWeight: "600",
  },
  durationText: {
    fontSize: 9,
    color: macOSColors.text.secondary,
  },
  sizeRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  sizeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sizeText: {
    fontSize: 8,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  clientBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    marginTop: 4,
  },
  clientText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
