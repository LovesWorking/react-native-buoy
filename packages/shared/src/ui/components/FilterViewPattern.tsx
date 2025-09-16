import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from "react-native";
import { useState } from "react";
import { Plus } from "../../icons";
import { gameUIColors } from "../gameUI/constants/gameUIColors";
import { useFilterManager } from "../../hooks/useFilterManager";
import {
  FilterSection,
  AddFilterInput,
  AddFilterButton,
  FilterList,
} from "./FilterComponents";
import type { ReactNode } from "react";
import type { LucideIcon } from "../../icons";

export interface FilterViewPatternProps {
  patterns: Set<string>;
  availableItems: string[];
  onTogglePattern: (pattern: string) => void;
  onAddPattern: (pattern: string) => void;
  icon?: LucideIcon;
  iconColor?: string;
  placeholder?: string;
  emptyText?: string;
  suggestionsTitle?: string;
  type: string;
}

export function FilterViewPattern({
  patterns,
  availableItems,
  onTogglePattern,
  onAddPattern,
  icon: Icon,
  iconColor = gameUIColors.network,
  placeholder = "Enter pattern",
  emptyText = "No patterns configured",
  suggestionsTitle = "AVAILABLE ITEMS",
  type,
}: FilterViewPatternProps) {
  const filterManager = useFilterManager(patterns);

  const suggestedItems = availableItems.filter((item) => !patterns.has(item));

  const handleAddPattern = () => {
    if (filterManager.newFilter.trim()) {
      onAddPattern(filterManager.newFilter.trim());
      filterManager.addFilter(filterManager.newFilter);
    }
  };

  return (
    <View style={styles.container}>
      <FilterSection style={styles.filterSectionOverrides}>
        {!filterManager.showAddInput ? (
          <AddFilterButton
            onPress={() => filterManager.setShowAddInput(true)}
            color={iconColor}
          />
        ) : (
          <AddFilterInput
            value={filterManager.newFilter}
            onChange={filterManager.setNewFilter}
            onSubmit={handleAddPattern}
            onCancel={() => {
              filterManager.setShowAddInput(false);
              filterManager.setNewFilter("");
            }}
            placeholder={placeholder}
            color={gameUIColors.primaryLight}
          />
        )}

        {suggestedItems.length > 0 ? (
          <View
            style={[
              styles.suggestedContainer,
              !filterManager.showAddInput && { marginTop: 12 },
            ]}
          >
            <Text style={styles.suggestedTitle}>{suggestionsTitle}</Text>
            <ScrollView
              style={styles.suggestedScroll}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {suggestedItems.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    if (filterManager.showAddInput) {
                      filterManager.setNewFilter(item);
                    } else {
                      onTogglePattern(item);
                    }
                  }}
                  style={styles.suggestedItem}
                >
                  {Icon && <Icon size={14} color="#9CA3AF" />}
                  <Text style={styles.suggestedText} numberOfLines={1}>
                    {item}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (filterManager.showAddInput) {
                        filterManager.setNewFilter(item);
                      } else {
                        onTogglePattern(item);
                      }
                    }}
                    style={styles.addIconButton}
                  >
                    <Plus size={16} color="#8B5CF6" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          availableItems.length === 0 && (
            <View style={[styles.suggestedContainer, { marginTop: 12 }]}>
              <Text style={styles.suggestedTitle}>
                NO {type.toUpperCase()} AVAILABLE
              </Text>
              <Text style={styles.emptyText}>
                Make some requests to see {type} here
              </Text>
            </View>
          )
        )}

        {patterns.size > 0 ? (
          <FilterList
            filters={patterns}
            onRemoveFilter={onTogglePattern}
            color={iconColor}
          />
        ) : (
          <Text style={styles.emptyText}>{emptyText}</Text>
        )}
      </FilterSection>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSectionOverrides: {
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: "transparent",
  },
  suggestedContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  suggestedTitle: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  suggestedScroll: {
    maxHeight: 250,
  },
  suggestedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  suggestedText: {
    flex: 1,
    fontSize: 12,
    color: "#E5E7EB",
    fontFamily: "monospace",
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    padding: 12,
    textAlign: "center",
  },
  addIconButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
});
