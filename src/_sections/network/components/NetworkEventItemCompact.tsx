import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { ChevronRight, Upload, Download, Clock, AlertCircle } from "lucide-react-native";
import type { NetworkEvent } from "../types";
import { formatBytes, formatDuration } from "../utils/formatting";
import { formatRelativeTime } from "../../sentry/utils/formatRelativeTime";
import { useTickEveryMinute } from "../../sentry/hooks/useTickEveryMinute";

interface NetworkEventItemCompactProps {
  event: NetworkEvent;
  onPress: (event: NetworkEvent) => void;
}

// Get color based on status
function getStatusColor(status?: number, error?: string) {
  if (error) return "#EF4444";
  if (!status) return "#F59E0B";
  if (status >= 200 && status < 300) return "#10B981";
  if (status >= 300 && status < 400) return "#3B82F6";
  if (status >= 400) return "#EF4444";
  return "#6B7280";
}

// Get method color
function getMethodColor(method: string) {
  switch (method) {
    case "GET": return "#10B981";
    case "POST": return "#3B82F6";
    case "PUT": return "#F59E0B";
    case "DELETE": return "#EF4444";
    case "PATCH": return "#8B5CF6";
    default: return "#6B7280";
  }
}

// Get content type badge with color
function getContentTypeBadge(headers: Record<string, string>) {
  const contentType = headers?.["content-type"] || headers?.["Content-Type"] || "";
  if (contentType.includes("json")) return { type: "JSON", color: "#3B82F6" };
  if (contentType.includes("xml")) return { type: "XML", color: "#8B5CF6" };
  if (contentType.includes("html")) return { type: "HTML", color: "#F59E0B" };
  if (contentType.includes("text")) return { type: "TEXT", color: "#10B981" };
  if (contentType.includes("image")) return { type: "IMG", color: "#EF4444" };
  if (contentType.includes("video")) return { type: "VIDEO", color: "#EC4899" };
  if (contentType.includes("audio")) return { type: "AUDIO", color: "#6366F1" };
  if (contentType.includes("form")) return { type: "FORM", color: "#14B8A6" };
  return null;
}

// Decomposed components following rule3 - Component Composition

// Status indicator component - single responsibility
function StatusIndicator({ event, isPending, statusColor }: {
  event: NetworkEvent;
  isPending: boolean;
  statusColor: string;
}) {
  if (isPending) {
    return (
      <View style={styles.pendingBadge}>
        <Clock size={10} color="#F59E0B" />
        <Text style={styles.pendingText}>...</Text>
      </View>
    );
  }
  
  if (event.error) {
    return (
      <View style={styles.errorBadge}>
        <AlertCircle size={10} color="#EF4444" />
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
function SizeIndicators({ requestSize, responseSize }: {
  requestSize?: number;
  responseSize?: number;
}) {
  if (!requestSize && !responseSize) return null;
  
  return (
    <View style={styles.sizeRow}>
      {requestSize ? (
        <View style={styles.sizeItem}>
          <Upload size={8} color="#3B82F6" />
          <Text style={styles.sizeText}>{formatBytes(requestSize)}</Text>
        </View>
      ) : null}
      {responseSize ? (
        <View style={styles.sizeItem}>
          <Download size={8} color="#10B981" />
          <Text style={styles.sizeText}>{formatBytes(responseSize)}</Text>
        </View>
      ) : null}
    </View>
  );
}

// Compact network event item following Sentry pattern
export const NetworkEventItemCompact = React.memo<NetworkEventItemCompactProps>(
  ({ event, onPress }) => {
    const tick = useTickEveryMinute();
    const statusColor = getStatusColor(event.status, event.error);
    const methodColor = getMethodColor(event.method);
    const isPending = !event.status && !event.error;
    const contentType = getContentTypeBadge(event.responseHeaders);
    
    // Format URL for display (max 2 lines)
    const displayUrl = event.path || event.url.replace(/^https?:\/\/[^/]+/, "");
    
    // Format time with both absolute and relative
    const timeString = new Date(event.timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
    const relativeTime = formatRelativeTime(event.timestamp, tick);

    return (
      <TouchableOpacity
        sentry-label="ignore network event item"
        onPress={() => onPress(event)}
        style={[styles.container, { borderLeftColor: statusColor }]}
      >
        {/* Left section: Method badge and size indicators */}
        <View style={styles.leftSection}>
          <View style={[styles.methodBadge, { backgroundColor: `${methodColor}15` }]}>
            <Text style={[styles.methodText, { color: methodColor }]}>
              {event.method}
            </Text>
          </View>
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
            
            {/* Content type badge with custom color */}
            {contentType ? (
              <View style={[styles.typeBadge, { backgroundColor: `${contentType.color}15` }]}>
                <Text style={[styles.typeText, { color: contentType.color }]}>{contentType.type}</Text>
              </View>
            ) : null}
          </View>
          
          {/* Bottom row: Time and size */}
          <View style={styles.rightBottomRow}>
            <Text style={styles.timestamp}>
              {timeString} ({relativeTime})
            </Text>
          </View>
        </View>
        
        {/* Chevron */}
        <ChevronRight size={14} color="#6B7280" />
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
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
    alignItems: 'center',
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    minWidth: 38,
    alignItems: "center",
  },
  methodText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  middleSection: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  urlText: {
    fontSize: 12,
    color: "#E5E7EB",
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
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 3,
  },
  pendingText: {
    fontSize: 10,
    color: "#F59E0B",
    fontWeight: "600",
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 3,
  },
  errorText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "600",
  },
  durationText: {
    fontSize: 9,
    color: "#9CA3AF",
  },
  typeBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  typeText: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 9,
    color: "#6B7280",
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
    color: "#9CA3AF",
    fontFamily: "monospace",
  },
});