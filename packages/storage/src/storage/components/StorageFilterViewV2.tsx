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
      placeholder: "Enter key pattern to hide...",
      title: "ACTIVE FILTERS",
      icon: Filter,
    },
    availableItemsSection: {
      enabled: true,
      title: "AVAILABLE STORAGE KEYS",
      emptyMessage:
        "No storage keys available. Keys will appear here once loaded.",
      items: availableKeys,
    },
    howItWorksSection: {
      enabled: true,
      title: "HOW STORAGE FILTERS WORK",
      description:
        "Patterns hide matching storage keys from the list. Filters match if the storage key contains the provided text.",
      examples: [
        "• react_buoy → hides keys containing react_buoy",
        "• @temp → hides @temp_user, @temp_data",
        "• redux → hides redux-persist:root",
        "• : → hides all keys with colons",
      ],
      icon: Filter,
    },
    onPatternToggle: onTogglePattern,
    onPatternAdd: onAddPattern,
    activePatterns: ignoredPatterns,
  };

  return <DynamicFilterView {...filterConfig} />;
}
