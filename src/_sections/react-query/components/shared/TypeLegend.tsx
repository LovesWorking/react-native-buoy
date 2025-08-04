import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface TypeLegendProps {
  types: string[];
  activeFilter: string | null;
  onFilterChange: (type: string | null) => void;
}

// Type color mapping (same as VirtualizedDataExplorer)
export const getTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    string: "#22D3EE", // Cyan for strings
    number: "#3B82F6", // Blue for numbers
    bigint: "#8B5CF6", // Purple for bigint
    boolean: "#F59E0B", // Orange for booleans
    null: "#6B7280", // Gray for null
    undefined: "#9CA3AF", // Light gray for undefined
    function: "#A855F7", // Magenta for functions
    symbol: "#D946EF", // Hot pink for symbols
    date: "#EC4899", // Pink for dates
    error: "#EF4444", // Red for errors
    array: "#10B981", // Green for arrays
    object: "#F97316", // Orange-red for objects
  };
  return colors[type] || "#9CA3AF";
};

/**
 * TypeLegend component with filter functionality
 * Shows type badges that can be clicked to filter data by type
 *
 * Applied principles [[rule3]]:
 * - Decompose by Responsibility: Single purpose type filtering UI
 * - Extract Reusable Logic: Shared between Sentry logs and storage views
 */
export const TypeLegend: React.FC<TypeLegendProps> = ({
  types,
  activeFilter,
  onFilterChange,
}) => {
  if (types.length === 0) return null;

  const handleTypeFilter = (type: string) => {
    // Toggle filter: if already active, clear it; otherwise set it
    onFilterChange(activeFilter === type ? null : type);
  };

  return (
    <View style={styles.typeLegend}>
      {types.map((type) => {
        const color = getTypeColor(type);
        const isActive = activeFilter === type;

        return (
          <TouchableOpacity
            sentry-label="ignore devtools type legend filter"
            key={type}
            style={[
              styles.typeBadge,
              isActive && styles.typeBadgeActive,
              { borderColor: isActive ? color : "rgba(255, 255, 255, 0.1)" },
            ]}
            onPress={() => handleTypeFilter(type)}
            accessibilityLabel={`Filter by ${type} values`}
          >
            <View style={[styles.typeColor, { backgroundColor: color }]} />
            <Text style={[styles.typeName, isActive && { color: color }]}>
              {type}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  typeLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  typeColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  typeName: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
});
