import {
  Filter,
  DynamicFilterView,
  type DynamicFilterConfig,
} from "@react-buoy/shared-ui";

interface StorageFilterViewV2Props {
  ignoredPatterns: Set<string>;
  onTogglePattern: (pattern: string) => void;
  onAddPattern: (pattern: string) => void;
  availableKeys?: string[];
}

export function StorageFilterViewV2({
  ignoredPatterns,
  onTogglePattern,
  onAddPattern,
  availableKeys = [],
}: StorageFilterViewV2Props) {
  const filterConfig: DynamicFilterConfig = {
    addFilterSection: {
      enabled: true,
      placeholder: "Enter pattern (e.g., @temp)",
      title: "ACTIVE FILTERS",
      icon: Filter,
    },
    availableItemsSection: {
      enabled: true,
      title: "AVAILABLE KEYS FROM EVENTS",
      emptyMessage:
        "No keys available. Keys from storage events will appear here.",
      items: availableKeys,
    },
    howItWorksSection: {
      enabled: true,
      title: "HOW FILTERS WORK",
      description:
        "Filtered keys will not appear in the storage events list. Patterns match if the key contains the specified text.",
      examples: [
        "• @temp → filters @temp_user, @temp_data",
        "• redux → filters redux-persist:root",
        "• : → filters all keys with colons",
      ],
      icon: Filter,
    },
    onPatternToggle: onTogglePattern,
    onPatternAdd: onAddPattern,
    activePatterns: ignoredPatterns,
  };

  return <DynamicFilterView {...filterConfig} />;
}
