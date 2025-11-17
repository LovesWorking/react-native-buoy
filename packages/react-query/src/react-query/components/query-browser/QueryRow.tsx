import { Query } from "@tanstack/react-query";
import { getQueryStatusLabel } from "../../utils/getQueryStatusLabel";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { gameUIColors } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";
import { CompactRow } from "@react-buoy/shared-ui";

const getQueryText = (query: Query) => {
  if (!query?.queryKey) return "Unknown Query";
  const keys = Array.isArray(query.queryKey)
    ? query.queryKey
    : [query.queryKey];
  return (
    keys
      .filter((k) => k != null)
      .map((k) => String(k))
      .join(" › ") || "Unknown Query"
  );
};

interface QueryRowProps {
  query: Query;
  isSelected: boolean;
  onSelect: (query: Query) => void;
}

/**
 * Single row representation of a query for the list view, showing status and observer count.
 */
const QueryRow: React.FC<QueryRowProps> = ({ query, isSelected, onSelect }) => {
  // Game UI status color mapping
  const getStatusHexColor = (status: string): string => {
    switch (status) {
      case "disabled":
        return macOSColors.text.muted + "80"; // More muted for disabled
      case "fresh":
        return macOSColors.semantic.success;
      case "stale":
        return macOSColors.semantic.warning;
      case "inactive":
        return macOSColors.text.muted;
      case "fetching":
        return macOSColors.semantic.info;
      case "paused":
        return macOSColors.semantic.debug;
      default:
        return macOSColors.text.secondary;
    }
  };

  const status = getQueryStatusLabel(query);
  const observerCount = query.getObserversCount();
  const isDisabled = query.isDisabled();
  const queryHash = getQueryText(query);

  // Get last updated time - try multiple timestamp fields
  const getTimestamp = (): string => {
    // Special handling for disabled queries
    if (isDisabled) {
      return "Disabled";
    }

    // Primary: dataUpdatedAt (when data was last fetched/updated)
    if (query.state.dataUpdatedAt && query.state.dataUpdatedAt > 0) {
      return formatRelativeTime(query.state.dataUpdatedAt);
    }

    // Fallback: Check other potential timestamp fields
    // @ts-ignore - exploring state fields for debugging
    const stateAny = query.state as any;

    // Try fetchedAt or other common timestamp fields
    if (stateAny.fetchedAt && stateAny.fetchedAt > 0) {
      return formatRelativeTime(stateAny.fetchedAt);
    }

    // For queries that haven't fetched yet (but aren't disabled)
    if (query.state.dataUpdatedAt === 0) {
      return "Not fetched";
    }

    // Debug fallback - show what we have
    return `N/A (${query.state.dataUpdatedAt || 0})`;
  };

  const lastUpdated = getTimestamp();

  return (
    <CompactRow
      statusDotColor={getStatusHexColor(status)}
      statusLabel={status.charAt(0).toUpperCase() + status.slice(1)}
      statusSublabel={`${observerCount} observer${observerCount !== 1 ? "s" : ""}`}
      primaryText={queryHash}
      bottomRightText={lastUpdated}
      badgeText={observerCount}
      badgeColor={getStatusHexColor(status)}
      isSelected={isSelected}
      onPress={() => onSelect(query)}
    />
  );
};

export default QueryRow;
