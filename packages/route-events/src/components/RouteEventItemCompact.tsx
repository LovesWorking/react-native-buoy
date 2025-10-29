/**
 * RouteEventItemCompact - Compact list item for route events
 *
 * Uses CompactRow pattern matching network/storage components
 */

import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CompactRow, formatRelativeTime, macOSColors } from "@react-buoy/shared-ui";
import type { RouteChangeEvent } from "../RouteObserver";
import { RouteEventExpandedContent } from "./RouteEventExpandedContent";

export interface RouteEventItemCompactProps {
  event: RouteChangeEvent;
  visitNumber: number;
  isExpanded: boolean;
  onPress: () => void;
  onNavigate?: (pathname: string) => void;
}

// Route type for color coding
type RouteType = "home" | "dynamic" | "with-params" | "default";

// Infer route template from pathname and segments
function getRouteTemplate(pathname: string, segments: string[]): string | null {
  if (!segments || segments.length === 0) return null;

  const templateParts = segments.map((segment) => {
    // Check if this segment appears to be a dynamic parameter
    if (/^\d+$/.test(segment)) {
      return "[id]";
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      return "[id]";
    }
    return segment;
  });

  const template = "/" + templateParts.join("/");
  return template !== pathname ? template : null;
}

// Get route type for color coding
function getRouteType(event: RouteChangeEvent): RouteType {
  if (event.pathname === "/") {
    return "home";
  }

  if (getRouteTemplate(event.pathname, event.segments)) {
    return "dynamic";
  }

  if (event.params && Object.keys(event.params).length > 0) {
    return "with-params";
  }

  return "default";
}

// Get color for route type
function getRouteTypeColor(routeType: RouteType): string {
  switch (routeType) {
    case "home":
      return macOSColors.semantic.success; // Green
    case "dynamic":
      return macOSColors.semantic.debug; // Blue
    case "with-params":
      return macOSColors.semantic.warning; // Orange
    default:
      return macOSColors.border.default; // Gray
  }
}

// Get status label (route type name)
function getStatusLabel(routeType: RouteType): string {
  switch (routeType) {
    case "home":
      return "Home";
    case "dynamic":
      return "Dynamic";
    case "with-params":
      return "Params";
    default:
      return "Static";
  }
}

// Get secondary text (param count + route type)
function getSecondaryText(event: RouteChangeEvent, routeType: RouteType): string | undefined {
  const hasParams = event.params && Object.keys(event.params).length > 0;

  if (!hasParams) {
    return undefined;
  }

  const paramCount = Object.keys(event.params).length;
  const paramText = `${paramCount} param${paramCount !== 1 ? 's' : ''}`;

  return `${paramText} • ${getStatusLabel(routeType)}`;
}

export function RouteEventItemCompact({
  event,
  visitNumber,
  isExpanded,
  onPress,
  onNavigate,
}: RouteEventItemCompactProps) {
  const routeType = useMemo(() => getRouteType(event), [event]);
  const routeTemplate = useMemo(() => getRouteTemplate(event.pathname, event.segments), [event.pathname, event.segments]);
  const statusColor = useMemo(() => getRouteTypeColor(routeType), [routeType]);
  const statusLabel = useMemo(() => getStatusLabel(routeType), [routeType]);
  const secondaryText = useMemo(() => getSecondaryText(event, routeType), [event, routeType]);
  const timeLabel = useMemo(() => formatRelativeTime(new Date(event.timestamp)), [event.timestamp]);

  const expandedContent = useMemo(() => {
    if (!isExpanded) return undefined;

    return (
      <RouteEventExpandedContent
        event={event}
        visitNumber={visitNumber}
        routeTemplate={routeTemplate}
      />
    );
  }, [isExpanded, event, visitNumber, routeTemplate]);

  const customBadge = useMemo(() => {
    if (!onNavigate) {
      return (
        <Text style={styles.timeText}>{timeLabel}</Text>
      );
    }

    return (
      <View style={styles.badgeContainer}>
        <Text style={styles.timeText}>{timeLabel}</Text>
        <TouchableOpacity
          style={styles.goButton}
          onPress={(e) => {
            e.stopPropagation();
            onNavigate(event.pathname);
          }}
        >
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
      </View>
    );
  }, [timeLabel, onNavigate, event.pathname]);

  return (
    <CompactRow
      statusDotColor={statusColor}
      statusLabel={statusLabel}
      primaryText={event.pathname}
      secondaryText={secondaryText}
      customBadge={customBadge}
      showChevron
      expandedContent={expandedContent}
      isExpanded={isExpanded}
      expandedGlowColor={statusColor}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  timeText: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },

  goButton: {
    backgroundColor: macOSColors.semantic.info,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  goButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "monospace",
  },
});
