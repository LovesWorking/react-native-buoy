import { Query } from "@tanstack/react-query";
import { getQueryStatusLabel } from "../../utils/getQueryStatusLabel";
import { gameUIColors } from "@monorepo/shared";
import { macOSColors } from "@monorepo/shared";
import { CompactRow } from "@monorepo/shared";

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

const QueryRow: React.FC<QueryRowProps> = ({ query, isSelected, onSelect }) => {
  // Game UI status color mapping
  const getStatusHexColor = (status: string): string => {
    switch (status) {
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

  return (
    <CompactRow
      statusDotColor={getStatusHexColor(status)}
      statusLabel={status.charAt(0).toUpperCase() + status.slice(1)}
      statusSublabel={`${observerCount} observer${observerCount !== 1 ? "s" : ""}`}
      primaryText={queryHash}
      secondaryText={isDisabled ? "Disabled" : undefined}
      badgeText={observerCount}
      badgeColor={getStatusHexColor(status)}
      isSelected={isSelected}
      onPress={() => onSelect(query)}
    />
  );
};

export default QueryRow;
