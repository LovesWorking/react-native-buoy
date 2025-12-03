/**
 * ModalHeaderContent
 *
 * Memoized header content components for the HighlightUpdatesModal.
 * Extracted to prevent re-renders when parent state changes unrelated to header.
 *
 * Following the optimization guide: extract inline JSX to memoized components.
 */

import React, { memo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import {
  Activity,
  Trash2,
  Power,
  Search,
  Filter,
  X,
  Pause,
  ModalHeader,
  TabSelector,
  macOSColors,
  CopyButton,
} from "@react-buoy/shared-ui";
import { StatsDisplay } from "./StatsDisplay";

// ============================================================================
// Search Section - isolated component for search UI
// ============================================================================

interface SearchSectionProps {
  isActive: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  onSearchClose: () => void;
  searchInputRef: React.RefObject<TextInput | null>;
}

const SearchSectionInner = memo(function SearchSection({
  isActive,
  searchText,
  onSearchChange,
  onSearchClose,
}: SearchSectionProps) {
  if (!isActive) return null;

  return (
    <View
      nativeID="__rn_buoy__search-container"
      style={styles.headerSearchContainer}
    >
      <Search size={14} color={macOSColors.text.secondary} />
      <TextInput
        style={styles.headerSearchInput}
        placeholder="Search testID, nativeID, component..."
        placeholderTextColor={macOSColors.text.muted}
        value={searchText}
        onChangeText={onSearchChange}
        onSubmitEditing={onSearchClose}
        onBlur={onSearchClose}
        accessibilityLabel="Search renders"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus
      />
      {searchText.length > 0 ? (
        <TouchableOpacity
          onPress={() => {
            onSearchChange("");
            onSearchClose();
          }}
          style={styles.headerSearchClear}
        >
          <X size={14} color={macOSColors.text.secondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

export const SearchSection = SearchSectionInner;

// ============================================================================
// Header Actions - isolated component for action buttons
// ============================================================================

interface HeaderActionsProps {
  onSearchToggle: () => void;
  onFilterToggle: () => void;
  onToggleTracking: () => void;
  onToggleFreeze: () => void;
  onClear: () => void;
  copyData: string;
  isTracking: boolean;
  isFrozen: boolean;
  activeFilterCount: number;
  hasRenders: boolean;
}

const HeaderActionsInner = memo(function HeaderActions({
  onSearchToggle,
  onFilterToggle,
  onToggleTracking,
  onToggleFreeze,
  onClear,
  copyData,
  isTracking,
  isFrozen,
  activeFilterCount,
  hasRenders,
}: HeaderActionsProps) {
  return (
    <ModalHeader.Actions>
      <TouchableOpacity
        onPress={onSearchToggle}
        style={styles.headerActionButton}
      >
        <Search size={14} color={macOSColors.text.secondary} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onFilterToggle}
        style={[
          styles.headerActionButton,
          activeFilterCount > 0 && styles.activeFilterButton,
        ]}
      >
        <Filter
          size={14}
          color={
            activeFilterCount > 0
              ? macOSColors.semantic.info
              : macOSColors.text.muted
          }
        />
      </TouchableOpacity>

      <CopyButton
        value={copyData}
        size={14}
        buttonStyle={
          hasRenders
            ? styles.headerActionButton
            : styles.headerActionButtonCopyDisabled
        }
        disabled={!hasRenders}
        colors={{
          idle: hasRenders
            ? macOSColors.text.secondary
            : macOSColors.text.disabled,
        }}
      />

      {/* Freeze Frame Mode button */}
      <TouchableOpacity
        onPress={onToggleFreeze}
        style={[
          styles.headerActionButton,
          isFrozen && styles.freezeButton,
          !isTracking && styles.headerActionButtonDisabled,
        ]}
        disabled={!isTracking}
      >
        <Pause
          size={14}
          color={
            !isTracking
              ? macOSColors.text.disabled
              : isFrozen
                ? macOSColors.semantic.info
                : macOSColors.text.muted
          }
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleTracking}
        style={[
          styles.headerActionButton,
          isTracking ? styles.startButton : styles.stopButton,
        ]}
      >
        <Power
          size={14}
          color={
            isTracking
              ? macOSColors.semantic.success
              : macOSColors.semantic.error
          }
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClear}
        style={[
          styles.headerActionButton,
          !hasRenders && styles.headerActionButtonDisabled,
        ]}
        disabled={!hasRenders}
      >
        <Trash2
          size={14}
          color={
            hasRenders ? macOSColors.text.muted : macOSColors.text.disabled
          }
        />
      </TouchableOpacity>
    </ModalHeader.Actions>
  );
});

export const HeaderActions = HeaderActionsInner;

// ============================================================================
// Main List Header - complete header for main list view
// ============================================================================

interface MainListHeaderProps {
  onBack?: () => void;
  isSearchActive: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  onSearchToggle: () => void;
  onSearchClose: () => void;
  onFilterToggle: () => void;
  onToggleTracking: () => void;
  onToggleFreeze: () => void;
  onClear: () => void;
  copyData: string;
  isTracking: boolean;
  isFrozen: boolean;
  activeFilterCount: number;
  hasRenders: boolean;
  searchInputRef: React.RefObject<TextInput | null>;
}

export const MainListHeader = memo(function MainListHeader({
  onBack,
  isSearchActive,
  searchText,
  onSearchChange,
  onSearchToggle,
  onSearchClose,
  onFilterToggle,
  onToggleTracking,
  onToggleFreeze,
  onClear,
  copyData,
  isTracking,
  isFrozen,
  activeFilterCount,
  hasRenders,
  searchInputRef,
}: MainListHeaderProps) {
  return (
    <ModalHeader>
      {onBack && <ModalHeader.Navigation onBack={onBack} />}
      <ModalHeader.Content title="">
        {isSearchActive ? (
          <SearchSection
            isActive={isSearchActive}
            searchText={searchText}
            onSearchChange={onSearchChange}
            onSearchClose={onSearchClose}
            searchInputRef={searchInputRef}
          />
        ) : (
          <StatsDisplay />
        )}
      </ModalHeader.Content>
      <HeaderActions
        onSearchToggle={onSearchToggle}
        onFilterToggle={onFilterToggle}
        onToggleTracking={onToggleTracking}
        onToggleFreeze={onToggleFreeze}
        onClear={onClear}
        copyData={copyData}
        isTracking={isTracking}
        isFrozen={isFrozen}
        activeFilterCount={activeFilterCount}
        hasRenders={hasRenders}
      />
    </ModalHeader>
  );
});

// ============================================================================
// Filter View Header
// ============================================================================

interface FilterViewHeaderProps {
  onBack: () => void;
  activeTab: "filters";
  onTabChange: (tab: "filters") => void;
}

export const FilterViewHeader = memo(function FilterViewHeader({
  onBack,
  activeTab,
  onTabChange,
}: FilterViewHeaderProps) {
  const tabs = [{ key: "filters" as const, label: "Filters" }];

  return (
    <ModalHeader>
      <ModalHeader.Navigation onBack={onBack} />
      <ModalHeader.Content title="" noMargin>
        <TabSelector
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => onTabChange(tab as "filters")}
        />
      </ModalHeader.Content>
      <ModalHeader.Actions>{/* Empty for right padding */}</ModalHeader.Actions>
    </ModalHeader>
  );
});

// ============================================================================
// Detail View Header
// ============================================================================

interface DetailViewHeaderProps {
  onBack: () => void;
}

export const DetailViewHeader = memo(function DetailViewHeader({
  onBack,
}: DetailViewHeaderProps) {
  return (
    <ModalHeader>
      <ModalHeader.Navigation onBack={onBack} />
      <ModalHeader.Content title="Render Details" centered />
    </ModalHeader>
  );
});

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  headerSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerSearchInput: {
    flex: 1,
    color: macOSColors.text.primary,
    fontSize: 13,
    marginLeft: 6,
    paddingVertical: 2,
  },
  headerSearchClear: {
    marginLeft: 6,
    padding: 4,
  },
  headerActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: macOSColors.background.hover,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionButtonDisabled: {
    opacity: 0.55,
  },
  headerActionButtonCopyDisabled: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: macOSColors.background.hover,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.55,
  },
  startButton: {
    backgroundColor: macOSColors.semantic.successBackground,
    borderColor: macOSColors.semantic.success + "40",
  },
  stopButton: {
    backgroundColor: macOSColors.semantic.errorBackground,
    borderColor: macOSColors.semantic.error + "40",
  },
  activeFilterButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "40",
  },
  freezeButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "40",
  },
});
