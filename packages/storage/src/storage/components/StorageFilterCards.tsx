import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { macOSColors } from "@react-buoy/shared-ui";

export type StorageFilterType = "all" | "missing" | "issues";
export type StorageTypeFilter = "all" | "async" | "mmkv" | "secure";

interface StorageFilterCardsProps {
  stats: {
    totalCount: number;
    requiredCount: number;
    optionalCount: number;
    presentRequiredCount: number;
    missingCount: number;
    wrongValueCount: number;
    wrongTypeCount: number;
    devToolsCount: number;
    asyncCount?: number;
    mmkvCount?: number;
    secureCount?: number;
  };
  healthPercentage: number;
  healthStatus: string;
  healthColor: string;
  activeFilter?: StorageFilterType;
  onFilterChange?: (filter: StorageFilterType) => void;
  activeStorageType?: StorageTypeFilter;
  onStorageTypeChange?: (type: StorageTypeFilter) => void;
}

export function StorageFilterCards({
  stats,
  healthPercentage,
  healthStatus,
  healthColor,
  activeFilter = "all",
  onFilterChange,
  activeStorageType = "all",
  onStorageTypeChange,
}: StorageFilterCardsProps) {
  const issuesCount = stats.wrongValueCount + stats.wrongTypeCount;

  return (
    <View style={styles.container}>
      {/* Status Filters */}
      <View style={styles.filtersRow}>
        {/* Total Keys - non-interactive display */}
        <View style={styles.filterChip}>
          <Text
            style={[styles.filterValue, { color: macOSColors.text.primary }]}
          >
            {stats.totalCount}
          </Text>
          <Text style={styles.filterLabel}>Keys</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === "all" && [
              styles.filterChipActive,
              {
                backgroundColor: macOSColors.background.hover,
                borderColor: macOSColors.border.hover,
                shadowColor: macOSColors.text.primary,
              },
            ],
          ]}
          onPress={() => onFilterChange?.("all")}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.filterValue, { color: macOSColors.text.primary }]}
          >
            {stats.presentRequiredCount + stats.optionalCount}
          </Text>
          <Text style={styles.filterLabel}>Valid</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === "missing" && [
              styles.filterChipActive,
              {
                backgroundColor: macOSColors.semantic.error + "10",
                borderColor: macOSColors.semantic.error + "30",
                shadowColor: macOSColors.semantic.error,
              },
            ],
          ]}
          onPress={() => onFilterChange?.("missing")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterValue,
              {
                color:
                  stats.missingCount > 0
                    ? macOSColors.semantic.error
                    : macOSColors.text.muted,
              },
            ]}
          >
            {stats.missingCount}
          </Text>
          <Text style={styles.filterLabel}>Missing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === "issues" && [
              styles.filterChipActive,
              {
                backgroundColor: macOSColors.semantic.warning + "10",
                borderColor: macOSColors.semantic.warning + "30",
                shadowColor: macOSColors.semantic.warning,
              },
            ],
          ]}
          onPress={() => onFilterChange?.("issues")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterValue,
              {
                color:
                  issuesCount > 0
                    ? macOSColors.semantic.warning
                    : macOSColors.text.muted,
              },
            ]}
          >
            {issuesCount}
          </Text>
          <Text style={styles.filterLabel}>Issues</Text>
        </TouchableOpacity>
      </View>

      {/* Storage Type Segments */}
      {onStorageTypeChange && (
        <View style={styles.typesRow}>
          <TouchableOpacity
            style={[
              styles.typePill,
              { borderColor: macOSColors.border.default },
              activeStorageType === "all" && [
                styles.typePillActive,
                {
                  backgroundColor: macOSColors.background.hover,
                  borderColor: macOSColors.border.hover,
                },
              ],
            ]}
            onPress={() => onStorageTypeChange?.("all")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.typePillLabel,
                activeStorageType === "all" && {
                  color: macOSColors.text.primary,
                  fontWeight: "600",
                },
              ]}
            >
              All Types
            </Text>
            <Text
              style={[
                styles.typePillValue,
                activeStorageType === "all" && {
                  color: macOSColors.text.primary,
                },
                activeStorageType !== "all" && {
                  color: macOSColors.text.muted,
                },
              ]}
            >
              {stats.totalCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typePill,
              { borderColor: macOSColors.border.default },
              activeStorageType === "async" && [
                styles.typePillActive,
                {
                  backgroundColor: macOSColors.semantic.warning + "15",
                  borderColor: macOSColors.semantic.warning + "40",
                },
              ],
            ]}
            onPress={() => onStorageTypeChange?.("async")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.typePillLabel,
                activeStorageType === "async" && {
                  color: macOSColors.semantic.warning,
                  fontWeight: "600",
                },
              ]}
            >
              Async
            </Text>
            <Text
              style={[
                styles.typePillValue,
                activeStorageType === "async"
                  ? { color: macOSColors.semantic.warning }
                  : { color: macOSColors.text.muted },
              ]}
            >
              {stats.asyncCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typePill,
              { borderColor: macOSColors.border.default },
              activeStorageType === "mmkv" && [
                styles.typePillActive,
                {
                  backgroundColor: macOSColors.semantic.info + "15",
                  borderColor: macOSColors.semantic.info + "40",
                },
              ],
            ]}
            onPress={() => onStorageTypeChange?.("mmkv")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.typePillLabel,
                activeStorageType === "mmkv" && {
                  color: macOSColors.semantic.info,
                  fontWeight: "600",
                },
              ]}
            >
              MMKV
            </Text>
            <Text
              style={[
                styles.typePillValue,
                activeStorageType === "mmkv"
                  ? { color: macOSColors.semantic.info }
                  : { color: macOSColors.text.muted },
              ]}
            >
              {stats.mmkvCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typePill,
              { borderColor: macOSColors.border.default },
              activeStorageType === "secure" && [
                styles.typePillActive,
                {
                  backgroundColor: macOSColors.semantic.success + "15",
                  borderColor: macOSColors.semantic.success + "40",
                },
              ],
            ]}
            onPress={() => onStorageTypeChange?.("secure")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.typePillLabel,
                activeStorageType === "secure" && {
                  color: macOSColors.semantic.success,
                  fontWeight: "600",
                },
              ]}
            >
              Secure
            </Text>
            <Text
              style={[
                styles.typePillValue,
                activeStorageType === "secure"
                  ? { color: macOSColors.semantic.success }
                  : { color: macOSColors.text.muted },
              ]}
            >
              {stats.secureCount || 0}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
    gap: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  titleText: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  titleDivider: {
    width: 4,
    height: 1,
    backgroundColor: macOSColors.border.default + "60",
    marginHorizontal: 4,
  },
  subtitleText: { color: macOSColors.text.muted, fontSize: 11 },
  healthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  // Health progress bar
  healthProgressBar: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: macOSColors.background.input,
    overflow: "hidden",
  },
  healthProgressFill: {
    height: 3,
    borderRadius: 1.5,
  },

  // Status filters
  filtersRow: { flexDirection: "row", gap: 10 },
  filterChip: {
    flex: 1,
    backgroundColor: macOSColors.background.input + "80",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "30",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  filterChipActive: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    transform: [{ scale: 1.005 }],
  },
  filterLabel: {
    fontSize: 9,
    color: macOSColors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "500",
    marginTop: 3,
  },
  filterValue: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "monospace",
    lineHeight: 20,
  },

  // Storage type pills
  typesRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  typePill: {
    flex: 1,
    backgroundColor: macOSColors.background.input + "80",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "30",
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  typePillActive: {
    borderWidth: 1,
    transform: [{ scale: 1.005 }],
  },
  typePillLabel: {
    fontSize: 9,
    color: macOSColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "500",
    marginBottom: 1,
  },
  typePillValue: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
    lineHeight: 14,
  },
});
