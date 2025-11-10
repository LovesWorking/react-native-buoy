import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import type { LucideIcon } from "../../icons";
import { Filter, Plus, Copy } from "../../icons";
import { macOSColors } from "../gameUI/constants/macOSDesignSystemColors";
import { SectionHeader } from "./SectionHeader";
import {
  FilterList,
  AddFilterInput,
  AddFilterButton,
} from "./FilterComponents";
import { useFilterManager } from "../../hooks/useFilterManager";

export interface FilterSection {
  id: string;
  title: string;
  icon?: LucideIcon;
  color?: string;
  type: "status" | "method" | "contentType" | "custom" | "patterns";
  data?: FilterOption[];
  renderCustom?: () => React.ReactNode;
  description?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  isActive?: boolean;
  value?: any;
  description?: string;
}

export interface DynamicFilterConfig {
  sections?: FilterSection[];
  addFilterSection?: {
    enabled: boolean;
    placeholder?: string;
    title?: string;
    icon?: LucideIcon;
  };
  availableItemsSection?: {
    enabled: boolean;
    title?: string;
    emptyMessage?: string;
    icon?: LucideIcon;
    items?: string[];
  };
  howItWorksSection?: {
    enabled: boolean;
    title?: string;
    description?: string;
    examples?: string[];
    icon?: LucideIcon;
  };
  previewSection?: {
    enabled: boolean;
    title?: string;
    content: () => React.ReactNode;
    icon?: LucideIcon;
    headerActions?: () => React.ReactNode;
  };
  onFilterChange?: (filterId: string, value: any) => void;
  onPatternToggle?: (pattern: string) => void;
  onPatternAdd?: (pattern: string) => void;
  activePatterns?: Set<string>;
  tabs?: {
    id: string;
    label: string;
    icon?: LucideIcon;
    count?: number;
    content: () => React.ReactNode;
  }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

interface DynamicFilterViewProps extends DynamicFilterConfig {
  className?: string;
}

export function DynamicFilterView({
  sections = [],
  addFilterSection,
  availableItemsSection,
  howItWorksSection,
  previewSection,
  onFilterChange,
  onPatternToggle,
  onPatternAdd,
  activePatterns = new Set(),
  tabs,
  activeTab,
  onTabChange,
}: DynamicFilterViewProps) {
  const filterManager = useFilterManager(activePatterns);
  const [internalActiveTab, setInternalActiveTab] = useState(
    tabs?.[0]?.id || ""
  );
  const currentActiveTab = activeTab || internalActiveTab;

  useEffect(() => {
    if (
      activePatterns.size !== filterManager.filters.size ||
      !Array.from(activePatterns).every((p) => filterManager.filters.has(p))
    ) {
      // Sync external changes
    }
  }, [activePatterns, filterManager.filters]);

  const handleAddPattern = () => {
    if (filterManager.newFilter.trim() && onPatternAdd) {
      onPatternAdd(filterManager.newFilter.trim());
      filterManager.addFilter(filterManager.newFilter);
    }
  };

  const suggestedItems =
    availableItemsSection?.items?.filter((item) => {
      return !Array.from(activePatterns).some((pattern) =>
        item.includes(pattern)
      );
    }) || [];

  const renderTabs = () => {
    if (!tabs || tabs.length === 0) return null;

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => {
              if (onTabChange) onTabChange(tab.id);
              else setInternalActiveTab(tab.id);
            }}
            style={[
              styles.tabButton,
              currentActiveTab === tab.id
                ? styles.tabButtonActive
                : styles.tabButtonInactive,
            ]}
          >
            {tab.icon && (
              <tab.icon
                size={14}
                color={
                  currentActiveTab === tab.id
                    ? macOSColors.semantic.info
                    : macOSColors.text.muted
                }
              />
            )}
            <Text
              style={[
                styles.tabButtonText,
                currentActiveTab === tab.id
                  ? styles.tabButtonTextActive
                  : styles.tabButtonTextInactive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFilterSection = (section: FilterSection) => {
    if (section.type === "custom" && section.renderCustom) {
      return section.renderCustom();
    }

    if (section.type === "patterns") {
      return null; // Handled separately
    }

    if (!section.data || section.data.length === 0) return null;

    return (
      <View key={section.id} style={styles.section}>
        <SectionHeader>
          {section.icon && (
            <SectionHeader.Icon
              icon={section.icon}
              color={section.color || macOSColors.semantic.info}
              size={12}
            />
          )}
          <SectionHeader.Title>{section.title}</SectionHeader.Title>
        </SectionHeader>
        {section.description && (
          <Text style={styles.sectionDescription}>{section.description}</Text>
        )}
        <View style={styles.filterGrid}>
          {section.data.map((option) => {
            const hasCount = option.count !== undefined;
            const countIsZero = hasCount && option.count === 0;
            const showLabel = section.type !== "method" || option.icon;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterCard,
                  option.isActive && styles.activeFilterCard,
                ]}
                onPress={() => onFilterChange?.(option.id, option.value)}
              >
                {/* Icon or Method Badge */}
                {option.icon ? (
                  <option.icon
                    size={24}
                    color={option.color}
                    style={styles.filterIcon}
                  />
                ) : section.type === "method" ? (
                  <View
                    style={[
                      styles.methodBadgeCompact,
                      {
                        backgroundColor: `${option.color}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.methodTextCompact,
                        { color: option.color },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {option.label}
                    </Text>
                  </View>
                ) : null}

                {/* Count - Prominent when >0, subtle when =0 */}
                {hasCount && (
                  <Text
                    style={[
                      countIsZero
                        ? styles.filterCountZero
                        : styles.filterCountActive,
                    ]}
                  >
                    {option.count}
                  </Text>
                )}

                {/* Label - Only show when it adds context */}
                {showLabel && (
                  <Text style={styles.filterLabelCompact}>{option.label}</Text>
                )}

                {/* Description for special cases like Quick Presets */}
                {option.description && (
                  <Text style={styles.filterDescriptionBottom}>
                    {option.description}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (tabs && currentActiveTab) {
      const activeTabData = tabs.find((tab) => tab.id === currentActiveTab);
      if (activeTabData?.content) {
        return activeTabData.content();
      }
    }

    return (
      <>
        {addFilterSection?.enabled && (
          <View style={styles.section}>
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
                  placeholder={
                    addFilterSection.placeholder || "Enter pattern..."
                  }
                  color={macOSColors.text.primary}
                />
              </View>
            )}
          </View>
        )}

        {activePatterns.size > 0 && (
          <View style={styles.activeFiltersSection}>
            <SectionHeader>
              <SectionHeader.Icon
                icon={Filter}
                color={macOSColors.semantic.info}
                size={12}
              />
              <SectionHeader.Title>
                {addFilterSection?.title || "ACTIVE FILTERS"}
              </SectionHeader.Title>
              <SectionHeader.Badge
                count={activePatterns.size}
                color={macOSColors.semantic.info}
              />
            </SectionHeader>
            <ScrollView
              style={styles.activeFiltersContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <FilterList
                filters={activePatterns}
                onRemoveFilter={onPatternToggle}
                color={macOSColors.semantic.info}
              />
            </ScrollView>
          </View>
        )}

        {sections.map(renderFilterSection)}

        {availableItemsSection?.enabled && (
          <View style={styles.availableKeysSection}>
            <SectionHeader>
              <SectionHeader.Icon
                icon={availableItemsSection.icon || Plus}
                color={macOSColors.semantic.info}
                size={12}
              />
              <SectionHeader.Title>
                {availableItemsSection.title || "AVAILABLE ITEMS"}
              </SectionHeader.Title>
              <SectionHeader.Badge
                count={suggestedItems.length}
                color={macOSColors.semantic.info}
              />
            </SectionHeader>
            <ScrollView
              style={styles.availableKeysScroll}
              horizontal={false}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEnabled={true}
            >
              {suggestedItems.length > 0 ? (
                suggestedItems.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => {
                      if (onPatternAdd) {
                        onPatternAdd(item);
                        filterManager.addFilter(item);
                      }
                    }}
                    style={styles.availableKeyItem}
                    sentry-label="ignore-touchable-opacity"
                  >
                    <Text style={styles.availableKeyText} numberOfLines={1}>
                      {item}
                    </Text>
                    <Plus size={12} color={macOSColors.semantic.info} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyStateText}>
                  {availableItemsSection.emptyMessage || "No items available"}
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        {howItWorksSection?.enabled && (
          <View style={styles.howItWorksSection}>
            <SectionHeader>
              <SectionHeader.Icon
                icon={howItWorksSection.icon || Filter}
                color={macOSColors.text.secondary}
                size={12}
              />
              <SectionHeader.Title>
                {howItWorksSection.title || "HOW FILTERS WORK"}
              </SectionHeader.Title>
            </SectionHeader>
            <Text style={styles.howItWorksText}>
              {howItWorksSection.description ||
                "Filters help you focus on relevant data by hiding unwanted items."}
            </Text>
            {howItWorksSection.examples &&
              howItWorksSection.examples.length > 0 && (
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>EXAMPLES:</Text>
                  {howItWorksSection.examples.map((example, index) => (
                    <Text key={index} style={styles.exampleItem}>
                      {example}
                    </Text>
                  ))}
                </View>
              )}
          </View>
        )}

        {previewSection?.enabled && (
          <View style={styles.previewSection}>
            <SectionHeader>
              <SectionHeader.Icon
                icon={previewSection.icon || Copy}
                color={macOSColors.semantic.info}
                size={12}
              />
              <SectionHeader.Title>
                {previewSection.title || "PREVIEW"}
              </SectionHeader.Title>
              {previewSection.headerActions && (
                <SectionHeader.Actions>
                  {previewSection.headerActions()}
                </SectionHeader.Actions>
              )}
            </SectionHeader>
            <View style={styles.previewContent}>
              {previewSection.content()}
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {renderTabs()}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        sentry-label="ignore-scrollview"
      >
        {renderContent()}
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: macOSColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  tabButtonActive: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info,
  },
  tabButtonInactive: {
    backgroundColor: macOSColors.background.hover,
    borderColor: macOSColors.border.default,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: macOSColors.semantic.info,
  },
  tabButtonTextInactive: {
    color: macOSColors.text.muted,
  },
  tabBadge: {
    backgroundColor: macOSColors.semantic.info + "40",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 9,
    color: macOSColors.semantic.info,
    fontWeight: "700",
  },
  section: {
    marginBottom: 8,
  },
  filterInputWrapper: {
    marginBottom: 4,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  filterCard: {
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    width: 68,
    minHeight: 62,
  },
  activeFilterCard: {
    backgroundColor: macOSColors.semantic.infoBackground + "14",
    borderColor: macOSColors.semantic.info,
    borderWidth: 2,
  },
  filterIcon: {
    marginBottom: 0,
  },
  filterCountActive: {
    fontSize: 14,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    marginTop: 3,
    marginBottom: 1,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  filterCountZero: {
    fontSize: 11,
    fontWeight: "500",
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    marginTop: 3,
    marginBottom: 1,
  },
  filterLabelCompact: {
    fontSize: 10,
    color: macOSColors.text.primary,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "capitalize",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  filterDescriptionBottom: {
    fontSize: 8,
    color: macOSColors.text.muted,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 11,
  },
  sectionDescription: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 14,
  },
  methodBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    minWidth: 48,
    maxWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  methodTextCompact: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: "monospace",
  },
  activeFiltersSection: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
    marginTop: 8,
    overflow: "hidden",
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    maxHeight: 200,
  },
  emptyStateText: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  availableKeysSection: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
    marginTop: 12,
    overflow: "hidden",
  },
  availableKeysScroll: {
    maxHeight: 150,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  availableKeyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.input,
    marginBottom: 6,
  },
  availableKeyText: {
    flex: 1,
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    marginRight: 8,
  },
  howItWorksSection: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
    marginTop: 12,
    overflow: "hidden",
  },
  howItWorksText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    lineHeight: 16,
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 16,
    fontFamily: "monospace",
  },
  examplesContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default + "50",
  },
  examplesTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  exampleItem: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  previewSection: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
    marginTop: 12,
    overflow: "hidden",
  },
  previewContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
});
