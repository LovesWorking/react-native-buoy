import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/gameUIColors";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";

interface TypeLegendProps {
  types: string[];
  activeFilter: string | null;
  onFilterChange: (type: string | null) => void;
}

// Type color mapping using centralized theme colors
export const getTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    string: macOSColors.dataTypes.string,
    number: macOSColors.dataTypes.number,
    bigint: macOSColors.semantic.debug, // Purple for bigint
    boolean: macOSColors.dataTypes.boolean,
    null: macOSColors.dataTypes.null,
    undefined: macOSColors.dataTypes.undefined,
    function: macOSColors.dataTypes.function,
    symbol: macOSColors.semantic.error, // Pink for symbols
    date: macOSColors.semantic.error, // Pink for dates
    error: macOSColors.semantic.error, // Red for errors
    array: macOSColors.dataTypes.array,
    object: macOSColors.dataTypes.object,
  };
  return colors[type] || macOSColors.text.secondary;
};

/**
 * TypeLegend component with filter functionality
 * Shows type badges that can be clicked to filter data by type
 *
 * Applied principles [[rule3]]:
 * - Decompose by Responsibility: Single purpose type filtering UI
 * - Extract Reusable Logic: Shared between Sentry logs and storage views
 */
export const TypeLegend: FC<TypeLegendProps> = ({
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
              { borderColor: isActive ? color : macOSColors.text.primary + "1A" },
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
    backgroundColor: macOSColors.text.primary + "05",
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.hover,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeBadgeActive: {
    backgroundColor: macOSColors.background.input,
  },
  typeColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  typeName: {
    color: macOSColors.text.secondary,
    fontSize: 11,
    fontWeight: "500",
  },
});
