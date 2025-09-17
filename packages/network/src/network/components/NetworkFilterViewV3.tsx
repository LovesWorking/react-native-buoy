import {
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  FileJson,
  FileText,
  Image,
  Film,
  Music,
  Filter,
} from "rn-better-dev-tools/icons";
import type { NetworkEvent } from "../types";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";
import { CompactFilterChips, type FilterChipGroup } from "@/rn-better-dev-tools/src/shared/ui/components/CompactFilterChips";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { SectionHeader } from "@/rn-better-dev-tools/src/shared/ui/components/SectionHeader";
import { FilterList, AddFilterInput, AddFilterButton } from "@/rn-better-dev-tools/src/shared/ui/components/FilterComponents";
import { useFilterManager } from "@/rn-better-dev-tools/src/shared/hooks/useFilterManager";
import { useMemo } from "react";

interface NetworkFilter {
  status?: "all" | "success" | "error" | "pending";
  method?: string[];
  contentType?: string[];
  searchText?: string;
}

interface NetworkFilterViewV3Props {
  events: NetworkEvent[];
  filter: NetworkFilter;
  onFilterChange: (filter: NetworkFilter) => void;
  ignoredPatterns?: Set<string>;
  onTogglePattern?: (pattern: string) => void;
  onAddPattern?: (pattern: string) => void;
}

function getContentType(event: NetworkEvent): { type: string; color: string } {
  const headers = event.responseHeaders || event.requestHeaders;
  const contentType = headers?.["content-type"] || headers?.["Content-Type"] || "";

  if (contentType.includes("json")) return { type: "JSON", color: macOSColors.semantic.info };
  if (contentType.includes("xml")) return { type: "XML", color: macOSColors.semantic.success };
  if (contentType.includes("html")) return { type: "HTML", color: macOSColors.semantic.warning };
  if (contentType.includes("text")) return { type: "TEXT", color: macOSColors.semantic.success };
  if (contentType.includes("image")) return { type: "IMAGE", color: macOSColors.semantic.error };
  if (contentType.includes("video")) return { type: "VIDEO", color: macOSColors.semantic.error };
  if (contentType.includes("audio")) return { type: "AUDIO", color: macOSColors.semantic.debug };
  if (contentType.includes("form")) return { type: "FORM", color: macOSColors.semantic.info };
  return { type: "OTHER", color: macOSColors.text.muted };
}

export function NetworkFilterViewV3({
  events,
  filter,
  onFilterChange,
  ignoredPatterns = new Set(),
  onTogglePattern = () => {},
  onAddPattern = () => {},
}: NetworkFilterViewV3Props) {
  const filterManager = useFilterManager(ignoredPatterns);

  // Calculate counts
  const statusCounts = {
    all: events.length,
    success: events.filter((e) => e.status && e.status >= 200 && e.status < 300).length,
    error: events.filter((e) => e.error || (e.status && e.status >= 400)).length,
    pending: events.filter((e) => !e.status && !e.error).length,
  };

  const methodCounts = events.reduce((acc, event) => {
    acc[event.method] = (acc[event.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contentTypeCounts = events.reduce((acc, event) => {
    const { type } = getContentType(event);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return CheckCircle;
      case "error": return XCircle;
      case "pending": return Clock;
      default: return Globe;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "JSON": return FileJson;
      case "HTML":
      case "XML":
      case "TEXT": return FileText;
      case "IMAGE": return Image;
      case "VIDEO": return Film;
      case "AUDIO": return Music;
      default: return Globe;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return macOSColors.semantic.success;
      case "POST": return macOSColors.semantic.info;
      case "PUT": return macOSColors.semantic.warning;
      case "DELETE": return macOSColors.semantic.error;
      case "PATCH": return macOSColors.semantic.success;
      default: return macOSColors.text.muted;
    }
  };

  const handleChipPress = (groupId: string, chipId: string, value: any) => {
    if (groupId === "status") {
      if (value === "all") {
        onFilterChange({ ...filter, status: undefined });
      } else {
        onFilterChange({ ...filter, status: value });
      }
    } else if (groupId === "method") {
      const currentMethods = filter.method || [];
      if (currentMethods.includes(value)) {
        const newMethods = currentMethods.filter((m) => m !== value);
        onFilterChange({
          ...filter,
          method: newMethods.length > 0 ? newMethods : undefined,
        });
      } else {
        onFilterChange({ ...filter, method: [value] });
      }
    } else if (groupId === "contentType") {
      const currentTypes = filter.contentType || [];
      if (currentTypes.includes(value)) {
        const newTypes = currentTypes.filter((t) => t !== value);
        onFilterChange({
          ...filter,
          contentType: newTypes.length > 0 ? newTypes : undefined,
        });
      } else {
        onFilterChange({ ...filter, contentType: [value] });
      }
    }
  };

  const handleAddPattern = () => {
    if (filterManager.newFilter.trim() && onAddPattern) {
      onAddPattern(filterManager.newFilter.trim());
      filterManager.addFilter(filterManager.newFilter);
    }
  };

  const filterGroups: FilterChipGroup[] = [
    {
      id: "status",
      title: "Status",
      chips: (["all", "success", "error", "pending"] as const).map(status => ({
        id: `status-${status}`,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count: statusCounts[status],
        icon: getStatusIcon(status),
        color: status === "success" ? macOSColors.semantic.success :
               status === "error" ? macOSColors.semantic.error :
               status === "pending" ? macOSColors.semantic.warning :
               macOSColors.semantic.info,
        isActive: filter.status === status || (!filter.status && status === "all"),
        value: status,
      })),
    },
    ...(Object.keys(methodCounts).length > 0 ? [{
      id: "method",
      title: "Method",
      chips: Object.entries(methodCounts).map(([method, count]) => ({
        id: `method-${method}`,
        label: method,
        count,
        color: getMethodColor(method),
        isActive: filter.method?.includes(method),
        value: method,
      })),
      multiSelect: true,
    }] : []),
    ...(Object.keys(contentTypeCounts).length > 0 ? [{
      id: "contentType",
      title: "Content",
      chips: Object.entries(contentTypeCounts).map(([type, count]) => ({
        id: `contentType-${type}`,
        label: type,
        count,
        icon: getContentTypeIcon(type),
        color: getContentType(events.find(e => getContentType(e).type === type) || events[0]).color,
        isActive: filter.contentType?.includes(type),
        value: type,
      })),
      multiSelect: true,
    }] : []),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Filter Chips */}
        <View style={styles.chipsSection}>
          <CompactFilterChips groups={filterGroups} onChipPress={handleChipPress} />
        </View>

        {/* Pattern Filters */}
        <View style={styles.patternSection}>
          {!filterManager.showAddInput ? (
            <AddFilterButton
              onPress={() => filterManager.setShowAddInput(true)}
              color={macOSColors.semantic.info}
            />
          ) : (
            <View style={styles.filterInputWrapper}>
              <AddFilterInput
                value={filterManager.newFilter}
                onChange={filterManager.setNewFilter}
                onSubmit={handleAddPattern}
                onCancel={() => {
                  filterManager.setShowAddInput(false);
                  filterManager.setNewFilter("");
                }}
                placeholder="Enter URL pattern..."
                color={macOSColors.text.primary}
              />
            </View>
          )}
        </View>

        {/* Active Patterns */}
        {ignoredPatterns.size > 0 && (
          <View style={styles.activePatterns}>
            <SectionHeader>
              <SectionHeader.Icon icon={Filter} color={macOSColors.semantic.info} size={12} />
              <SectionHeader.Title>ACTIVE PATTERNS</SectionHeader.Title>
              <SectionHeader.Badge count={ignoredPatterns.size} color={macOSColors.semantic.info} />
            </SectionHeader>
            <View style={styles.patternsList}>
              <FilterList
                filters={ignoredPatterns}
                onRemoveFilter={onTogglePattern}
                color={macOSColors.semantic.info}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  chipsSection: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
    marginBottom: 8,
  },
  patternSection: {
    marginBottom: 8,
  },
  filterInputWrapper: {
    marginBottom: 4,
  },
  activePatterns: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
    overflow: "hidden",
  },
  patternsList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    maxHeight: 150,
  },
});