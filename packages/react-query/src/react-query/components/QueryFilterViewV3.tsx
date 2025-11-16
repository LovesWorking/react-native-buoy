import { useMemo } from "react";
import { Query } from "@tanstack/react-query";
import {
  DynamicFilterView,
  DynamicFilterConfig,
  macOSColors,
} from "@react-buoy/shared-ui";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Globe,
  Zap,
  Filter,
} from "@react-buoy/shared-ui";
import { getQueryStatusLabel } from "../utils/getQueryStatusLabel";

interface QueryFilterViewV3Props {
  queries: Query[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  ignoredPatterns: Set<string>;
  onPatternToggle: (pattern: string) => void;
}

/**
 * Comprehensive filter control panel for React Query DevTools matching the Network DevTools
 * filter UI pattern. Provides status filtering and query key pattern-based filtering.
 */
export function QueryFilterViewV3({
  queries,
  activeFilter,
  onFilterChange,
  ignoredPatterns,
  onPatternToggle,
}: QueryFilterViewV3Props) {
  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      all: queries.length,
      disabled: 0,
      fresh: 0,
      stale: 0,
      fetching: 0,
      paused: 0,
      inactive: 0,
      error: 0,
    };

    queries.forEach((query) => {
      const status = getQueryStatusLabel(query);
      if (status === "disabled") counts.disabled++;
      else if (status === "fresh") counts.fresh++;
      else if (status === "stale") counts.stale++;
      else if (status === "fetching") counts.fetching++;
      else if (status === "paused") counts.paused++;
      else if (status === "inactive") counts.inactive++;

      if (query.state.error) counts.error++;
    });

    return counts;
  }, [queries]);

  // Extract available query keys (excluding numeric-only keys)
  const availableQueryKeys = useMemo(() => {
    const keys = new Set<string>();
    queries.forEach((query) => {
      if (!query?.queryKey) return;
      const queryKeys = Array.isArray(query.queryKey)
        ? query.queryKey
        : [query.queryKey];
      queryKeys.forEach((key) => {
        if (key != null) {
          const keyStr = String(key);
          // Skip if key is purely numeric (likely a dynamic ID)
          if (!/^\d+$/.test(keyStr)) {
            keys.add(keyStr);
          }
        }
      });
    });
    return Array.from(keys).sort().slice(0, 50); // Limit to 50
  }, [queries]);

  // Convert available query keys to suggestion items (just strings)
  const suggestionItems = useMemo(() => {
    return availableQueryKeys;
  }, [availableQueryKeys]);

  // Build the filter configuration
  const filterConfig: DynamicFilterConfig = useMemo(() => {
    return {
      sections: [
        // Status section - radio button style
        {
          id: "status",
          title: "Status",
          type: "status",
          data: [
            {
              id: "status::all",
              label: "All",
              count: statusCounts.all,
              icon: Globe,
              color: macOSColors.semantic.info,
              isActive: !activeFilter || activeFilter === "all",
            },
            {
              id: "status::disabled",
              label: "Disabled",
              count: statusCounts.disabled,
              icon: XCircle,
              color: macOSColors.text.muted,
              isActive: activeFilter === "disabled",
            },
            {
              id: "status::fresh",
              label: "Fresh",
              count: statusCounts.fresh,
              icon: Zap,
              color: macOSColors.semantic.success,
              isActive: activeFilter === "fresh",
            },
            {
              id: "status::stale",
              label: "Stale",
              count: statusCounts.stale,
              icon: Clock,
              color: macOSColors.semantic.warning,
              isActive: activeFilter === "stale",
            },
            {
              id: "status::fetching",
              label: "Fetching",
              count: statusCounts.fetching,
              icon: RefreshCw,
              color: macOSColors.semantic.info,
              isActive: activeFilter === "fetching",
            },
            {
              id: "status::paused",
              label: "Paused",
              count: statusCounts.paused,
              icon: Clock,
              color: macOSColors.text.muted,
              isActive: activeFilter === "paused",
            },
            {
              id: "status::inactive",
              label: "Inactive",
              count: statusCounts.inactive,
              icon: Clock,
              color: macOSColors.text.secondary,
              isActive: activeFilter === "inactive",
            },
            {
              id: "status::error",
              label: "Error",
              count: statusCounts.error,
              icon: XCircle,
              color: macOSColors.semantic.error,
              isActive: activeFilter === "error",
            },
          ],
        },
      ],
      addFilterSection: {
        enabled: true,
        placeholder: "Enter query key pattern...",
        title: "ACTIVE FILTERS",
        icon: Filter,
      },
      availableItemsSection: {
        enabled: true,
        title: "AVAILABLE QUERY KEYS",
        emptyMessage: "No queries found. Query keys will appear here once queries are active.",
        items: suggestionItems,
      },
      howItWorksSection: {
        enabled: true,
        title: "HOW QUERY FILTERS WORK",
        description:
          "Patterns hide matching queries from the query list. Type a pattern or click an available query key to add it to your filters.",
        examples: [
          "• todos → filters any query whose key contains 'todos'",
          "• user-profile → filters queries containing 'user-profile'",
          "• api → filters any query key containing 'api'",
          "Filters are case-insensitive and match partial query keys.",
        ],
      },
      activePatterns: ignoredPatterns,
    };
  }, [statusCounts, activeFilter, ignoredPatterns, suggestionItems]);

  // Handle filter item clicks
  const handleFilterSelect = (itemId: string) => {
    const [section, value] = itemId.split("::");

    if (section === "status") {
      // Status filters are mutually exclusive
      if (value === "all" || activeFilter === value) {
        onFilterChange(null);
      } else {
        onFilterChange(value);
      }
    } else if (section === "suggestion") {
      // Toggle pattern
      onPatternToggle(value);
    }
  };

  return (
    <DynamicFilterView
      {...filterConfig}
      onFilterChange={handleFilterSelect}
      onPatternToggle={onPatternToggle}
      onPatternAdd={onPatternToggle}
    />
  );
}
