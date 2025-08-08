import { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { VirtualizedDataExplorer } from "./VirtualizedDataExplorer";
import { TypeLegend } from "./TypeLegend";
import { JsonValue, isPlainObject } from "../../types/types";

interface DataViewerProps {
  title: string;
  data: JsonValue;
  maxDepth?: number;
  rawMode?: boolean;
  showTypeFilter?: boolean;
  initialExpanded?: boolean;
}

/**
 * DataViewer component that combines VirtualizedDataExplorer with TypeLegend
 * Provides type filtering functionality like in Sentry event details
 *
 * Applied principles [[rule3]]:
 * - Decompose by Responsibility: Combines data viewing with type filtering
 * - Prefer Composition over Configuration: Uses existing components
 * - Extract Reusable Logic: Shared between storage and Sentry views
 */
export const DataViewer: React.FC<DataViewerProps> = ({
  title,
  data,
  maxDepth = 10,
  rawMode = true,
  showTypeFilter = true,
  initialExpanded = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Calculate visible types in the data
  const visibleTypes = useMemo(() => {
    if (!data || !showTypeFilter) return [];

    const types: string[] = [];
    const processValue = (value: JsonValue, depth = 0) => {
      if (depth > 3) return; // Limit depth for performance

      const type = Array.isArray(value)
        ? "array"
        : value === null
          ? "null"
          : typeof value;

      types.push(type);

      if (type === "object" && isPlainObject(value)) {
        Object.values(value).forEach((v) => processValue(v, depth + 1));
      } else if (Array.isArray(value)) {
        value.forEach((v: JsonValue) => processValue(v, depth + 1));
      }
    };

    processValue(data);
    return Array.from(new Set(types)).slice(0, 8); // Unique types, limit to 8
  }, [data, showTypeFilter]);

  // Get filtered data based on active filter
  const getFilteredData = useMemo(() => {
    if (!activeFilter || !data) return null;

    const filteredObject: Record<string, JsonValue> = {};
    let itemCount = 0;

    const flattenByType = (
      obj: JsonValue,
      targetType: string,
      path = "",
      depth = 0
    ) => {
      if (depth > 10 || itemCount > 100) return;

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const currentPath = path ? `${path}[${index}]` : `[${index}]`;
          const itemType = item === null ? "null" : typeof item;

          if (itemType === targetType) {
            filteredObject[currentPath] = item;
            itemCount++;
          }

          // Recurse into nested structures
          if ((itemType === "object" && item !== null) || Array.isArray(item)) {
            flattenByType(item, targetType, currentPath, depth + 1);
          }
        });
      } else if (obj && typeof obj === "object") {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          const valueType = Array.isArray(value)
            ? "array"
            : value === null
              ? "null"
              : typeof value;

          if (valueType === targetType) {
            filteredObject[currentPath] = value;
            itemCount++;
          }

          // Recurse into nested structures
          if (
            (valueType === "object" && value !== null) ||
            valueType === "array"
          ) {
            flattenByType(value, targetType, currentPath, depth + 1);
          }
        });
      }
    };

    flattenByType(data, activeFilter);
    return { filteredObject, itemCount };
  }, [activeFilter, data]);

  // Render content based on filter state
  const renderContent = () => {
    // Show filtered results if filter is active
    if (activeFilter && getFilteredData) {
      return (
        <VirtualizedDataExplorer
          title={`${activeFilter} values`}
          data={getFilteredData.filteredObject}
          maxDepth={maxDepth}
          rawMode={rawMode}
          initialExpanded={initialExpanded}
        />
      );
    }

    // Default: show all data
    return (
      <VirtualizedDataExplorer
        title={title}
        data={data}
        maxDepth={maxDepth}
        rawMode={rawMode}
        initialExpanded={initialExpanded}
      />
    );
  };

  return (
    <View style={styles.container}>
      {showTypeFilter && (
        <TypeLegend
          types={visibleTypes}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      )}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
