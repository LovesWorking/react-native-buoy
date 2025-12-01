/**
 * HighlightFilterView
 *
 * Simplified filter configuration for tracked component renders.
 * Uses a badge-based approach where users select a filter type
 * (Any, ViewType, testID, Component) then enter a value.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import { Eye, Filter, Plus, X, Box, Check, Settings } from "@react-buoy/shared-ui";
import { macOSColors, SectionHeader } from "@react-buoy/shared-ui";
import type { FilterConfig, FilterPattern, FilterType, RenderTrackerSettings, DebugLogLevel } from "../utils/RenderTracker";
import { IdentifierBadge, IDENTIFIER_CONFIG, type IdentifierType } from "./IdentifierBadge";

interface HighlightFilterViewProps {
  filters: FilterConfig;
  onFilterChange: (filters: Partial<FilterConfig>) => void;
  settings: RenderTrackerSettings;
  onSettingsChange: (settings: Partial<RenderTrackerSettings>) => void;
  availableProps: {
    viewTypes: string[];
    testIDs: string[];
    nativeIDs: string[];
    componentNames: string[];
    accessibilityLabels: string[];
  };
}

// Use shared identifier config (FilterType is a subset of IdentifierType)
const getFilterConfig = (type: FilterType) => IDENTIFIER_CONFIG[type as IdentifierType];

// Filter types available for selection (all identifier types)
const FILTER_TYPES: FilterType[] = ["any", "viewType", "testID", "nativeID", "component", "accessibilityLabel"];

// Type picker component
function TypePicker({
  onSelect,
  onCancel,
}: {
  onSelect: (type: FilterType) => void;
  onCancel: () => void;
}) {
  return (
    <View nativeID="__rn_buoy__type-picker" style={styles.typePicker}>
      <View style={styles.typePickerRow}>
        {FILTER_TYPES.map((type) => {
          const config = getFilterConfig(type);
          const IconComponent = config.icon;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeOption, { backgroundColor: config.color + "15", borderColor: config.color + "40" }]}
              onPress={() => onSelect(type)}
            >
              <IconComponent size={14} color={config.color} />
              <Text style={[styles.typeOptionText, { color: config.color }]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.typePickerCancel}>
        <X size={16} color={macOSColors.text.muted} />
      </TouchableOpacity>
    </View>
  );
}

// Pattern input with badge prefix
function PatternInput({
  type,
  onSubmit,
  onCancel,
}: {
  type: FilterType;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const config = getFilterConfig(type);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <View nativeID="__rn_buoy__pattern-input" style={styles.patternInputContainer}>
      <IdentifierBadge type={type as IdentifierType} value="" badgeOnly compact />
      <TextInput
        value={value}
        onChangeText={setValue}
        onSubmitEditing={handleSubmit}
        placeholder="Enter pattern..."
        placeholderTextColor={macOSColors.text.muted}
        style={styles.patternInput}
        autoFocus
        returnKeyType="done"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.trim() && (
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.addPatternButton, { backgroundColor: config.color + "20" }]}
        >
          <Text style={[styles.addPatternButtonText, { color: config.color }]}>Add</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <X size={16} color={macOSColors.text.muted} />
      </TouchableOpacity>
    </View>
  );
}

// Pattern chip (removable badge) - tap to remove
function PatternChip({
  pattern,
  onRemove,
}: {
  pattern: FilterPattern;
  onRemove: () => void;
}) {
  const config = getFilterConfig(pattern.type);
  return (
    <TouchableOpacity
      style={[styles.patternChip, { borderColor: config.color + "40" }]}
      onPress={onRemove}
      activeOpacity={0.7}
    >
      <View style={[styles.patternChipBadge, { backgroundColor: config.color + "20" }]}>
        <Text style={[styles.patternChipBadgeText, { color: config.color }]}>
          {config.shortLabel}
        </Text>
      </View>
      <Text style={styles.patternChipValue} numberOfLines={1}>
        {pattern.value}
      </Text>
      <X size={12} color={macOSColors.text.muted} style={styles.patternChipX} />
    </TouchableOpacity>
  );
}

// Category type including "all"
type DetectedCategory = FilterType | "all";

// Config for "all" category
const ALL_CATEGORY_CONFIG = { label: "All", shortLabel: "All", color: macOSColors.text.secondary, icon: Box };

// Category badge for horizontal scroll - always colored
function DetectedCategoryBadge({
  filterType,
  count,
  isSelected,
  onPress,
}: {
  filterType: DetectedCategory;
  count: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  // "all" has its own config
  const config = filterType === "all"
    ? ALL_CATEGORY_CONFIG
    : getFilterConfig(filterType);

  return (
    <TouchableOpacity
      style={[
        styles.categoryBadge,
        {
          backgroundColor: config.color + "15",
          borderColor: isSelected ? config.color : config.color + "40",
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      onPress={onPress}
    >
      <config.icon size={12} color={config.color} />
      <Text style={[styles.categoryBadgeText, { color: config.color }]}>
        {config.label}
      </Text>
      <View style={[styles.categoryBadgeCountBubble, { backgroundColor: config.color + "25" }]}>
        <Text style={[styles.categoryBadgeCount, { color: config.color }]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Batch size presets for the slider
const BATCH_SIZE_PRESETS = [
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: 150, label: "150" },
  { value: 250, label: "250" },
  { value: 500, label: "500" },
];

// Debug log level presets
const DEBUG_LOG_LEVEL_PRESETS: Array<{ value: DebugLogLevel; label: string; description: string }> = [
  { value: "off", label: "Off", description: "No debug logging" },
  { value: "minimal", label: "Minimal", description: "Only hook value changes" },
  { value: "verbose", label: "Verbose", description: "Component + cause + changes" },
  { value: "all", label: "All", description: "Full fiber dump" },
];

export function HighlightFilterView({
  filters,
  onFilterChange,
  settings,
  onSettingsChange,
  availableProps,
}: HighlightFilterViewProps) {
  // UI state for add inputs
  const [showIncludeTypePicker, setShowIncludeTypePicker] = useState(false);
  const [showExcludeTypePicker, setShowExcludeTypePicker] = useState(false);
  const [includeInputType, setIncludeInputType] = useState<FilterType | null>(null);
  const [excludeInputType, setExcludeInputType] = useState<FilterType | null>(null);

  // State for selected detected category (default to "all")
  const [selectedCategory, setSelectedCategory] = useState<DetectedCategory>("all");

  // State for action popup when tapping detected item
  const [actionPopupItem, setActionPopupItem] = useState<{ type: FilterType; value: string } | null>(null);

  // Get items for selected category with their filter type
  const getItemsForCategory = (category: DetectedCategory): Array<{ value: string; type: FilterType }> => {
    switch (category) {
      case "viewType":
        return availableProps.viewTypes.map(v => ({ value: v, type: "viewType" as FilterType }));
      case "testID":
        return availableProps.testIDs.map(v => ({ value: v, type: "testID" as FilterType }));
      case "nativeID":
        return availableProps.nativeIDs.map(v => ({ value: v, type: "nativeID" as FilterType }));
      case "component":
        return availableProps.componentNames.map(v => ({ value: v, type: "component" as FilterType }));
      case "accessibilityLabel":
        return availableProps.accessibilityLabels.map(v => ({ value: v, type: "accessibilityLabel" as FilterType }));
      case "all":
      default:
        // Combine all items with their types
        return [
          ...availableProps.viewTypes.map(v => ({ value: v, type: "viewType" as FilterType })),
          ...availableProps.testIDs.map(v => ({ value: v, type: "testID" as FilterType })),
          ...availableProps.nativeIDs.map(v => ({ value: v, type: "nativeID" as FilterType })),
          ...availableProps.componentNames.map(v => ({ value: v, type: "component" as FilterType })),
          ...availableProps.accessibilityLabels.map(v => ({ value: v, type: "accessibilityLabel" as FilterType })),
        ];
    }
  };

  const selectedItems = getItemsForCategory(selectedCategory);
  const totalItemCount = availableProps.viewTypes.length + availableProps.testIDs.length + availableProps.nativeIDs.length + availableProps.componentNames.length + availableProps.accessibilityLabels.length;

  // Add include pattern
  const handleAddIncludePattern = useCallback((type: FilterType, value: string) => {
    const newPatterns = [...filters.includePatterns, { type, value }];
    onFilterChange({ includePatterns: newPatterns });
    setIncludeInputType(null);
  }, [filters.includePatterns, onFilterChange]);

  // Add exclude pattern
  const handleAddExcludePattern = useCallback((type: FilterType, value: string) => {
    const newPatterns = [...filters.excludePatterns, { type, value }];
    onFilterChange({ excludePatterns: newPatterns });
    setExcludeInputType(null);
  }, [filters.excludePatterns, onFilterChange]);

  // Remove include pattern
  const handleRemoveIncludePattern = useCallback((index: number) => {
    const newPatterns = filters.includePatterns.filter((_, i) => i !== index);
    onFilterChange({ includePatterns: newPatterns });
  }, [filters.includePatterns, onFilterChange]);

  // Remove exclude pattern
  const handleRemoveExcludePattern = useCallback((index: number) => {
    const newPatterns = filters.excludePatterns.filter((_, i) => i !== index);
    onFilterChange({ excludePatterns: newPatterns });
  }, [filters.excludePatterns, onFilterChange]);

  // Show action popup for detected item
  const handleDetectedItemPress = useCallback((type: FilterType, value: string) => {
    setActionPopupItem({ type, value });
  }, []);

  // Add to include from popup
  const handlePopupInclude = useCallback(() => {
    if (actionPopupItem) {
      handleAddIncludePattern(actionPopupItem.type, actionPopupItem.value);
      setActionPopupItem(null);
    }
  }, [actionPopupItem, handleAddIncludePattern]);

  // Add to exclude from popup
  const handlePopupExclude = useCallback(() => {
    if (actionPopupItem) {
      handleAddExcludePattern(actionPopupItem.type, actionPopupItem.value);
      setActionPopupItem(null);
    }
  }, [actionPopupItem, handleAddExcludePattern]);

  return (
    <ScrollView
      nativeID="__rn_buoy__filter-view"
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Include Only Section */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Eye} color={macOSColors.semantic.success} size={12} />
          <SectionHeader.Title>INCLUDE ONLY</SectionHeader.Title>
          {filters.includePatterns.length > 0 && (
            <SectionHeader.Badge
              count={filters.includePatterns.length}
              color={macOSColors.semantic.success}
            />
          )}
        </SectionHeader>

        <Text style={styles.sectionDescription}>
          Show only components matching these patterns. If any are set, components must match at least one.
        </Text>

        {/* Active include patterns */}
        {filters.includePatterns.length > 0 && (
          <View style={styles.patternChips}>
            {filters.includePatterns.map((pattern, index) => (
              <PatternChip
                key={`${pattern.type}-${pattern.value}-${index}`}
                pattern={pattern}
                onRemove={() => handleRemoveIncludePattern(index)}
              />
            ))}
          </View>
        )}

        {/* Add include pattern UI */}
        <View style={styles.addPatternRow}>
          {showIncludeTypePicker ? (
            <TypePicker
              onSelect={(type) => {
                setShowIncludeTypePicker(false);
                setIncludeInputType(type);
              }}
              onCancel={() => setShowIncludeTypePicker(false)}
            />
          ) : includeInputType ? (
            <PatternInput
              type={includeInputType}
              onSubmit={(value) => handleAddIncludePattern(includeInputType, value)}
              onCancel={() => setIncludeInputType(null)}
            />
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { borderColor: macOSColors.semantic.success + "40" }]}
              onPress={() => setShowIncludeTypePicker(true)}
            >
              <Plus size={14} color={macOSColors.semantic.success} />
              <Text style={[styles.addButtonText, { color: macOSColors.semantic.success }]}>
                Add include pattern
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Exclude Section */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Filter} color={macOSColors.semantic.info} size={12} />
          <SectionHeader.Title>EXCLUDE</SectionHeader.Title>
          {filters.excludePatterns.length > 0 && (
            <SectionHeader.Badge
              count={filters.excludePatterns.length}
              color={macOSColors.semantic.info}
            />
          )}
        </SectionHeader>

        <Text style={styles.sectionDescription}>
          Hide components matching these patterns from the list.
        </Text>

        {/* Active exclude patterns */}
        {filters.excludePatterns.length > 0 && (
          <View style={styles.patternChips}>
            {filters.excludePatterns.map((pattern, index) => (
              <PatternChip
                key={`${pattern.type}-${pattern.value}-${index}`}
                pattern={pattern}
                onRemove={() => handleRemoveExcludePattern(index)}
              />
            ))}
          </View>
        )}

        {/* Add exclude pattern UI */}
        <View style={styles.addPatternRow}>
          {showExcludeTypePicker ? (
            <TypePicker
              onSelect={(type) => {
                setShowExcludeTypePicker(false);
                setExcludeInputType(type);
              }}
              onCancel={() => setShowExcludeTypePicker(false)}
            />
          ) : excludeInputType ? (
            <PatternInput
              type={excludeInputType}
              onSubmit={(value) => handleAddExcludePattern(excludeInputType, value)}
              onCancel={() => setExcludeInputType(null)}
            />
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { borderColor: macOSColors.semantic.info + "40" }]}
              onPress={() => setShowExcludeTypePicker(true)}
            >
              <Plus size={14} color={macOSColors.semantic.info} />
              <Text style={[styles.addButtonText, { color: macOSColors.semantic.info }]}>
                Add exclude pattern
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Detected Items Section */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Box} color={macOSColors.text.secondary} size={12} />
          <SectionHeader.Title>DETECTED ITEMS</SectionHeader.Title>
        </SectionHeader>

        <Text style={styles.sectionDescription}>
          Tap an item to quickly add it as an exclude pattern.
        </Text>

        {/* Horizontal scrollable category badges - only show badges with items */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBadgeScroll}
          contentContainerStyle={styles.categoryBadgeScrollContent}
        >
          {totalItemCount > 0 && (
            <DetectedCategoryBadge
              filterType="all"
              count={totalItemCount}
              isSelected={selectedCategory === "all"}
              onPress={() => setSelectedCategory("all")}
            />
          )}
          {availableProps.viewTypes.length > 0 && (
            <DetectedCategoryBadge
              filterType="viewType"
              count={availableProps.viewTypes.length}
              isSelected={selectedCategory === "viewType"}
              onPress={() => setSelectedCategory("viewType")}
            />
          )}
          {availableProps.testIDs.length > 0 && (
            <DetectedCategoryBadge
              filterType="testID"
              count={availableProps.testIDs.length}
              isSelected={selectedCategory === "testID"}
              onPress={() => setSelectedCategory("testID")}
            />
          )}
          {availableProps.nativeIDs.length > 0 && (
            <DetectedCategoryBadge
              filterType="nativeID"
              count={availableProps.nativeIDs.length}
              isSelected={selectedCategory === "nativeID"}
              onPress={() => setSelectedCategory("nativeID")}
            />
          )}
          {availableProps.componentNames.length > 0 && (
            <DetectedCategoryBadge
              filterType="component"
              count={availableProps.componentNames.length}
              isSelected={selectedCategory === "component"}
              onPress={() => setSelectedCategory("component")}
            />
          )}
          {availableProps.accessibilityLabels.length > 0 && (
            <DetectedCategoryBadge
              filterType="accessibilityLabel"
              count={availableProps.accessibilityLabels.length}
              isSelected={selectedCategory === "accessibilityLabel"}
              onPress={() => setSelectedCategory("accessibilityLabel")}
            />
          )}
        </ScrollView>

        {/* Items for selected category */}
        <View nativeID="__rn_buoy__detected-items" style={styles.detectedItemsContainer}>
          {selectedItems.length > 0 ? (
            <ScrollView
              style={styles.detectedItemsScroll}
              contentContainerStyle={styles.detectedItems}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {selectedItems.map((item) => {
                const itemConfig = getFilterConfig(item.type);
                return (
                  <TouchableOpacity
                    key={`${item.type}-${item.value}`}
                    style={[styles.detectedItem, { borderColor: itemConfig.color + "40" }]}
                    onPress={() => handleDetectedItemPress(item.type, item.value)}
                  >
                    {selectedCategory === "all" ? (
                      <IdentifierBadge
                        type={item.type as IdentifierType}
                        value={item.value}
                        compact
                        shortLabel
                      />
                    ) : (
                      <Text style={styles.detectedItemText} numberOfLines={1}>
                        {item.value}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>
              No items detected yet. Start tracking to see components here.
            </Text>
          )}
        </View>
      </View>

      {/* Action Popup Modal */}
      <Modal
        visible={actionPopupItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionPopupItem(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActionPopupItem(null)}
        >
          <View style={styles.actionPopup}>
            {actionPopupItem && (
              <>
                <View style={styles.actionPopupHeader}>
                  <IdentifierBadge
                    type={actionPopupItem.type as IdentifierType}
                    value={actionPopupItem.value}
                    compact
                    shortLabel
                  />
                </View>
                <View style={styles.actionPopupButtons}>
                  <TouchableOpacity
                    style={[styles.actionPopupButton, styles.actionPopupInclude]}
                    onPress={handlePopupInclude}
                  >
                    <Eye size={16} color={macOSColors.semantic.success} />
                    <Text style={[styles.actionPopupButtonText, { color: macOSColors.semantic.success }]}>
                      Include Only
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionPopupButton, styles.actionPopupExclude]}
                    onPress={handlePopupExclude}
                  >
                    <Filter size={16} color={macOSColors.semantic.info} />
                    <Text style={[styles.actionPopupButtonText, { color: macOSColors.semantic.info }]}>
                      Exclude
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.actionPopupCancel}
                  onPress={() => setActionPopupItem(null)}
                >
                  <Text style={styles.actionPopupCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Settings Section */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Settings} color={macOSColors.semantic.debug} size={12} />
          <SectionHeader.Title>SETTINGS</SectionHeader.Title>
        </SectionHeader>

        <View style={styles.settingsSection}>
          {/* Show Render Count Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Show Render Count</Text>
              <Switch
                value={settings.showRenderCount}
                onValueChange={(value) => {
                  onSettingsChange({ showRenderCount: value });
                  // If disabling render count, also disable cause tracking
                  if (!value && settings.trackRenderCauses) {
                    onSettingsChange({ trackRenderCauses: false });
                  }
                }}
                trackColor={{
                  false: macOSColors.background.input,
                  true: macOSColors.semantic.success + "80",
                }}
                thumbColor={settings.showRenderCount ? macOSColors.semantic.success : macOSColors.text.muted}
              />
            </View>
            <Text style={styles.settingDescription}>
              Display render count badge on highlights. Disabling improves performance by skipping count tracking.
            </Text>
          </View>

          {/* Track Render Causes Toggle */}
          <View style={[styles.settingItem, styles.settingItemSpaced]}>
            <View style={styles.settingHeader}>
              <Text style={[
                styles.settingLabel,
                !settings.showRenderCount && styles.settingLabelDisabled
              ]}>
                Track Render Causes
              </Text>
              <Switch
                value={settings.trackRenderCauses}
                onValueChange={(value) => onSettingsChange({ trackRenderCauses: value })}
                trackColor={{
                  false: macOSColors.background.input,
                  true: macOSColors.semantic.warning + "80",
                }}
                thumbColor={settings.trackRenderCauses ? macOSColors.semantic.warning : macOSColors.text.muted}
                disabled={!settings.showRenderCount}
              />
            </View>
            <Text style={styles.settingDescription}>
              Detect WHY components render (props, hooks, parent re-render).
              {!settings.showRenderCount && (
                <Text style={styles.settingWarning}>
                  {"\n"}Requires "Show Render Count" to be enabled.
                </Text>
              )}
            </Text>
            <Text style={styles.settingDescriptionMuted}>
              Adds ~2-5% performance overhead. Stores previous component state in memory.
            </Text>
          </View>

          {/* Enable Render History */}
          <View style={styles.settingItem}>
            <View style={styles.settingHeader}>
              <Text style={[
                styles.settingLabel,
                !settings.trackRenderCauses && styles.settingLabelDisabled
              ]}>
                Enable Render History
              </Text>
              <Switch
                value={settings.enableRenderHistory}
                onValueChange={(value) => onSettingsChange({ enableRenderHistory: value })}
                trackColor={{
                  false: macOSColors.background.input,
                  true: macOSColors.semantic.info + "80",
                }}
                thumbColor={settings.enableRenderHistory ? macOSColors.semantic.info : macOSColors.text.muted}
                disabled={!settings.trackRenderCauses}
              />
            </View>
            <Text style={styles.settingDescription}>
              Store render events for event stepping and diff visualization.
              {!settings.trackRenderCauses && (
                <Text style={styles.settingWarning}>
                  {"\n"}Requires "Track Render Causes" to be enabled.
                </Text>
              )}
            </Text>
            <Text style={styles.settingDescriptionMuted}>
              Stores up to {settings.maxRenderHistoryPerComponent} events per component.
            </Text>
          </View>

          {/* Capture Props on Render */}
          <View style={styles.settingItem}>
            <View style={styles.settingHeader}>
              <Text style={[
                styles.settingLabel,
                !settings.enableRenderHistory && styles.settingLabelDisabled
              ]}>
                Capture Props
              </Text>
              <Switch
                value={settings.capturePropsOnRender}
                onValueChange={(value) => onSettingsChange({ capturePropsOnRender: value })}
                trackColor={{
                  false: macOSColors.background.input,
                  true: "#a855f7" + "80",
                }}
                thumbColor={settings.capturePropsOnRender ? "#a855f7" : macOSColors.text.muted}
                disabled={!settings.enableRenderHistory}
              />
            </View>
            <Text style={styles.settingDescription}>
              Capture props snapshot at each render for diff visualization.
              {!settings.enableRenderHistory && (
                <Text style={styles.settingWarning}>
                  {"\n"}Requires "Enable Render History" to be enabled.
                </Text>
              )}
            </Text>
            <Text style={styles.settingDescriptionMuted}>
              Increases memory usage. Deep clones props at each render.
            </Text>
          </View>

          {/* Debug Log Level */}
          <View style={[styles.settingItem, styles.settingItemSpaced]}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>
                Debug Log Level
              </Text>
              <View style={styles.settingValue}>
                <Text style={[
                  styles.settingValueText,
                  settings.debugLogLevel !== "off" && { color: macOSColors.semantic.warning }
                ]}>
                  {DEBUG_LOG_LEVEL_PRESETS.find(p => p.value === settings.debugLogLevel)?.label || "Off"}
                </Text>
              </View>
            </View>
            <Text style={styles.settingDescription}>
              Control console logging verbosity for render cause detection.
            </Text>
            <View style={styles.batchSizePresets}>
              {DEBUG_LOG_LEVEL_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.batchSizePreset,
                    settings.debugLogLevel === preset.value && styles.batchSizePresetActive,
                    preset.value !== "off" && settings.debugLogLevel === preset.value && {
                      backgroundColor: macOSColors.semantic.warning + "30",
                      borderColor: macOSColors.semantic.warning,
                    },
                  ]}
                  onPress={() => onSettingsChange({ debugLogLevel: preset.value })}
                >
                  <Text
                    style={[
                      styles.batchSizePresetText,
                      settings.debugLogLevel === preset.value && styles.batchSizePresetTextActive,
                      preset.value !== "off" && settings.debugLogLevel === preset.value && {
                        color: macOSColors.semantic.warning,
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.settingDescriptionMuted}>
              {DEBUG_LOG_LEVEL_PRESETS.find(p => p.value === settings.debugLogLevel)?.description}
              {settings.debugLogLevel !== "off" && " • Check Metro console for logs"}
            </Text>
          </View>

          {/* Batch Size */}
          <View style={[styles.settingItem, styles.settingItemSpaced]}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Batch Size</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>{settings.batchSize}</Text>
              </View>
            </View>
            <Text style={styles.settingDescription}>
              Maximum components to highlight per render update. Higher values capture more re-renders but may impact performance on complex screens.
            </Text>
            <View style={styles.batchSizePresets}>
              {BATCH_SIZE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.batchSizePreset,
                    settings.batchSize === preset.value && styles.batchSizePresetActive,
                  ]}
                  onPress={() => onSettingsChange({ batchSize: preset.value })}
                >
                  <Text
                    style={[
                      styles.batchSizePresetText,
                      settings.batchSize === preset.value && styles.batchSizePresetTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Filter} color={macOSColors.text.muted} size={12} />
          <SectionHeader.Title>HOW FILTERS WORK</SectionHeader.Title>
        </SectionHeader>

        <View style={styles.howItWorks}>
          <Text style={styles.howItWorksText}>
            <Text style={styles.howItWorksBold}>Any:</Text> Matches against all fields{"\n"}
            <Text style={styles.howItWorksBold}>ViewType:</Text> Native component class (RCTView, RCTText){"\n"}
            <Text style={styles.howItWorksBold}>testID:</Text> Component testID prop{"\n"}
            <Text style={styles.howItWorksBold}>Component:</Text> React component name from fiber
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionDescription: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    paddingHorizontal: 16,
    paddingTop: 8,
    lineHeight: 16,
  },
  patternChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  patternChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 6,
    maxWidth: "100%",
    gap: 4,
  },
  patternChipBadge: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  patternChipBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  patternChipValue: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flexShrink: 1,
  },
  patternChipX: {
    marginLeft: 2,
  },
  addPatternRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 6,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  typePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typePickerRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: macOSColors.background.input,
    gap: 6,
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  typePickerCancel: {
    padding: 8,
  },
  patternInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.input,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    gap: 4,
  },
  patternInput: {
    flex: 1,
    fontSize: 12,
    color: macOSColors.text.primary,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  addPatternButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  addPatternButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 4,
  },
  categoryBadgeScroll: {
    marginTop: 12,
  },
  categoryBadgeScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoryBadgeCountBubble: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  categoryBadgeCount: {
    fontSize: 10,
    fontWeight: "600",
  },
  detectedItemsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  detectedItemsScroll: {
    maxHeight: 200,
  },
  detectedItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detectedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  detectedItemText: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  emptyText: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  howItWorks: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  howItWorksText: {
    fontSize: 11,
    color: macOSColors.text.muted,
    lineHeight: 18,
    fontFamily: "monospace",
  },
  howItWorksBold: {
    fontWeight: "700",
    color: macOSColors.text.secondary,
  },
  // Action popup modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  actionPopup: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    width: "100%",
    maxWidth: 300,
    overflow: "hidden",
  },
  actionPopupHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default + "50",
    alignItems: "center",
  },
  actionPopupButtons: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  actionPopupButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionPopupInclude: {
    backgroundColor: macOSColors.semantic.success + "15",
  },
  actionPopupExclude: {
    backgroundColor: macOSColors.semantic.info + "15",
  },
  actionPopupButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionPopupCancel: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default + "50",
    alignItems: "center",
  },
  actionPopupCancelText: {
    fontSize: 13,
    color: macOSColors.text.muted,
    fontWeight: "500",
  },
  // Settings styles
  settingsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  settingItem: {
    gap: 8,
  },
  settingItemSpaced: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default + "30",
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.text.primary,
  },
  settingValue: {
    backgroundColor: macOSColors.semantic.debug + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  settingValueText: {
    fontSize: 12,
    fontWeight: "700",
    color: macOSColors.semantic.debug,
    fontFamily: "monospace",
  },
  settingDescription: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    lineHeight: 16,
  },
  settingDescriptionMuted: {
    fontSize: 10,
    color: macOSColors.text.muted,
    lineHeight: 14,
    marginTop: 4,
    fontStyle: "italic",
  },
  settingLabelDisabled: {
    color: macOSColors.text.muted,
  },
  settingWarning: {
    color: macOSColors.semantic.warning,
    fontWeight: "500",
  },
  batchSizePresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  batchSizePreset: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: macOSColors.background.input,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
  },
  batchSizePresetActive: {
    backgroundColor: macOSColors.semantic.debug + "20",
    borderColor: macOSColors.semantic.debug,
  },
  batchSizePresetText: {
    fontSize: 12,
    fontWeight: "500",
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  batchSizePresetTextActive: {
    color: macOSColors.semantic.debug,
    fontWeight: "700",
  },
});

export default HighlightFilterView;
