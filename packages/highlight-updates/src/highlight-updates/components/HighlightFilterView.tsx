/**
 * HighlightFilterView
 *
 * Filter configuration for tracked component renders.
 * Allows filtering by viewType, testID, nativeID, componentName, and accessibilityLabel.
 */

import React, { useCallback, useMemo } from "react";
import { Eye, Filter, Box, Hash } from "@react-buoy/shared-ui";
import { DynamicFilterView, type DynamicFilterConfig } from "@react-buoy/shared-ui";
import type { FilterConfig } from "../utils/RenderTracker";

interface HighlightFilterViewProps {
  filters: FilterConfig;
  onFilterChange: (filters: Partial<FilterConfig>) => void;
  availableProps: {
    viewTypes: string[];
    testIDs: string[];
    nativeIDs: string[];
    componentNames: string[];
    accessibilityLabels: string[];
  };
}

export function HighlightFilterView({
  filters,
  onFilterChange,
  availableProps,
}: HighlightFilterViewProps) {
  // Include pattern handlers
  const handleAddIncludeViewType = useCallback((pattern: string) => {
    const newSet = new Set(filters.includeViewType);
    newSet.add(pattern);
    onFilterChange({ includeViewType: newSet });
  }, [filters.includeViewType, onFilterChange]);

  const handleToggleIncludeViewType = useCallback((pattern: string) => {
    const newSet = new Set(filters.includeViewType);
    if (newSet.has(pattern)) {
      newSet.delete(pattern);
    } else {
      newSet.add(pattern);
    }
    onFilterChange({ includeViewType: newSet });
  }, [filters.includeViewType, onFilterChange]);

  const handleAddIncludeTestID = useCallback((pattern: string) => {
    const newSet = new Set(filters.includeTestID);
    newSet.add(pattern);
    onFilterChange({ includeTestID: newSet });
  }, [filters.includeTestID, onFilterChange]);

  const handleToggleIncludeTestID = useCallback((pattern: string) => {
    const newSet = new Set(filters.includeTestID);
    if (newSet.has(pattern)) {
      newSet.delete(pattern);
    } else {
      newSet.add(pattern);
    }
    onFilterChange({ includeTestID: newSet });
  }, [filters.includeTestID, onFilterChange]);

  const handleAddIncludeComponent = useCallback((pattern: string) => {
    const newSet = new Set(filters.includeComponent);
    newSet.add(pattern);
    onFilterChange({ includeComponent: newSet });
  }, [filters.includeComponent, onFilterChange]);

  const handleToggleIncludeComponent = useCallback((pattern: string) => {
    const newSet = new Set(filters.includeComponent);
    if (newSet.has(pattern)) {
      newSet.delete(pattern);
    } else {
      newSet.add(pattern);
    }
    onFilterChange({ includeComponent: newSet });
  }, [filters.includeComponent, onFilterChange]);

  // Exclude pattern handlers
  const handleAddExcludeViewType = useCallback((pattern: string) => {
    const newSet = new Set(filters.excludeViewType);
    newSet.add(pattern);
    onFilterChange({ excludeViewType: newSet });
  }, [filters.excludeViewType, onFilterChange]);

  const handleToggleExcludeViewType = useCallback((pattern: string) => {
    const newSet = new Set(filters.excludeViewType);
    if (newSet.has(pattern)) {
      newSet.delete(pattern);
    } else {
      newSet.add(pattern);
    }
    onFilterChange({ excludeViewType: newSet });
  }, [filters.excludeViewType, onFilterChange]);

  const handleAddExcludeTestID = useCallback((pattern: string) => {
    const newSet = new Set(filters.excludeTestID);
    newSet.add(pattern);
    onFilterChange({ excludeTestID: newSet });
  }, [filters.excludeTestID, onFilterChange]);

  const handleToggleExcludeTestID = useCallback((pattern: string) => {
    const newSet = new Set(filters.excludeTestID);
    if (newSet.has(pattern)) {
      newSet.delete(pattern);
    } else {
      newSet.add(pattern);
    }
    onFilterChange({ excludeTestID: newSet });
  }, [filters.excludeTestID, onFilterChange]);

  // Tab configurations
  const tabs: DynamicFilterConfig["tabs"] = useMemo(() => [
    {
      id: "viewType",
      label: "View Type",
      icon: Box,
      count: filters.includeViewType.size + filters.excludeViewType.size,
      content: () => (
        <DynamicFilterView
          includeOnlySection={{
            enabled: true,
            title: "INCLUDE ONLY VIEW TYPES",
            description: "Show only components matching these view types (e.g., RCTView, RCTText)",
            placeholder: "Enter view type pattern...",
            icon: Eye,
            patterns: filters.includeViewType,
            onPatternToggle: handleToggleIncludeViewType,
            onPatternAdd: handleAddIncludeViewType,
          }}
          addFilterSection={{
            enabled: true,
            title: "EXCLUDE VIEW TYPES",
            placeholder: "Enter view type to exclude...",
          }}
          activePatterns={filters.excludeViewType}
          onPatternToggle={handleToggleExcludeViewType}
          onPatternAdd={handleAddExcludeViewType}
          availableItemsSection={{
            enabled: availableProps.viewTypes.length > 0,
            title: "DETECTED VIEW TYPES",
            emptyMessage: "No view types detected yet",
            items: availableProps.viewTypes,
          }}
          howItWorksSection={{
            enabled: true,
            title: "HOW VIEW TYPE FILTERING WORKS",
            description: "View type is the native component class (e.g., RCTView, RCTText, RCTScrollView). Use patterns to match multiple types.",
            examples: [
              "• \"RCTView\" - matches View components",
              "• \"Text\" - matches RCTText",
              "• \"Scroll\" - matches ScrollView components",
            ],
          }}
        />
      ),
    },
    {
      id: "testID",
      label: "testID",
      icon: Hash,
      count: filters.includeTestID.size + filters.excludeTestID.size,
      content: () => (
        <DynamicFilterView
          includeOnlySection={{
            enabled: true,
            title: "INCLUDE ONLY testIDs",
            description: "Show only components with testID matching these patterns",
            placeholder: "Enter testID pattern...",
            icon: Eye,
            patterns: filters.includeTestID,
            onPatternToggle: handleToggleIncludeTestID,
            onPatternAdd: handleAddIncludeTestID,
          }}
          addFilterSection={{
            enabled: true,
            title: "EXCLUDE testIDs",
            placeholder: "Enter testID to exclude...",
          }}
          activePatterns={filters.excludeTestID}
          onPatternToggle={handleToggleExcludeTestID}
          onPatternAdd={handleAddExcludeTestID}
          availableItemsSection={{
            enabled: availableProps.testIDs.length > 0,
            title: "DETECTED testIDs",
            emptyMessage: "No testIDs detected yet. Add testID props to your components.",
            items: availableProps.testIDs,
          }}
          howItWorksSection={{
            enabled: true,
            title: "HOW testID FILTERING WORKS",
            description: "Filter by the testID prop on your React Native components. Great for tracking specific interactive elements.",
            examples: [
              "• \"button\" - matches button-related testIDs",
              "• \"counter\" - matches counter-display, counter-button, etc.",
            ],
          }}
        />
      ),
    },
    {
      id: "component",
      label: "Component",
      icon: Hash,
      count: filters.includeComponent.size + filters.excludeComponent.size,
      content: () => (
        <DynamicFilterView
          includeOnlySection={{
            enabled: true,
            title: "INCLUDE ONLY COMPONENTS",
            description: "Show only renders from these component names (from React fiber)",
            placeholder: "Enter component name pattern...",
            icon: Eye,
            patterns: filters.includeComponent,
            onPatternToggle: handleToggleIncludeComponent,
            onPatternAdd: handleAddIncludeComponent,
          }}
          addFilterSection={{
            enabled: true,
            title: "EXCLUDE COMPONENTS",
            placeholder: "Enter component name to exclude...",
          }}
          activePatterns={filters.excludeComponent}
          onPatternToggle={(pattern) => {
            const newSet = new Set(filters.excludeComponent);
            if (newSet.has(pattern)) {
              newSet.delete(pattern);
            } else {
              newSet.add(pattern);
            }
            onFilterChange({ excludeComponent: newSet });
          }}
          onPatternAdd={(pattern) => {
            const newSet = new Set(filters.excludeComponent);
            newSet.add(pattern);
            onFilterChange({ excludeComponent: newSet });
          }}
          availableItemsSection={{
            enabled: availableProps.componentNames.length > 0,
            title: "DETECTED COMPONENTS",
            emptyMessage: "No component names detected yet",
            items: availableProps.componentNames,
          }}
          howItWorksSection={{
            enabled: true,
            title: "HOW COMPONENT FILTERING WORKS",
            description: "Filter by the parent component name from React's fiber tree. Useful for tracking specific feature areas.",
            examples: [
              "• \"Counter\" - matches CounterDisplay, CounterButtons",
              "• \"Button\" - matches all button-related components",
            ],
          }}
        />
      ),
    },
  ], [
    filters,
    availableProps,
    handleAddIncludeViewType,
    handleToggleIncludeViewType,
    handleAddIncludeTestID,
    handleToggleIncludeTestID,
    handleAddIncludeComponent,
    handleToggleIncludeComponent,
    handleAddExcludeViewType,
    handleToggleExcludeViewType,
    handleAddExcludeTestID,
    handleToggleExcludeTestID,
    onFilterChange,
  ]);

  return (
    <DynamicFilterView
      tabs={tabs}
      activeTab="viewType"
    />
  );
}

export default HighlightFilterView;
