import { Query, Mutation } from "@tanstack/react-query";
import { ModalHeader, macOSColors } from "@react-buoy/shared-ui";
import { TabSelector } from "@react-buoy/shared-ui";
import { Search, X, Filter } from "@react-buoy/shared-ui";
import { useState, useRef, useEffect } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";

interface ReactQueryModalHeaderProps {
  selectedQuery?: Query;
  selectedMutation?: Mutation;
  activeTab: "queries" | "mutations";
  onTabChange: (tab: "queries" | "mutations") => void;
  onBack: () => void;
  searchText?: string;
  onSearchChange?: (text: string) => void;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
}

/**
 * Shared header for all React Query modals. Handles tab switching when browsing and presents
 * breadcrumbs when a specific query or mutation is selected.
 */
export function ReactQueryModalHeader({
  selectedQuery,
  selectedMutation,
  activeTab,
  onTabChange,
  onBack,
  searchText = "",
  onSearchChange,
  onFilterPress,
  hasActiveFilters = false,
}: ReactQueryModalHeaderProps) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Auto-focus search input when search becomes active
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive);
    if (isSearchActive && onSearchChange) {
      onSearchChange("");
    }
  };

  const handleSearch = (text: string) => {
    if (onSearchChange) {
      onSearchChange(text);
    }
  };
  // Simple function to get query display text
  const getQueryText = (query: Query) => {
    if (!query?.queryKey) return "Unknown Query";
    const keys = Array.isArray(query.queryKey)
      ? query.queryKey
      : [query.queryKey];
    return (
      keys
        .filter((k) => k != null)
        .map((k) => String(k))
        .join(" › ") || "Unknown Query"
    );
  };

  const getItemText = (item: Query | Mutation) => {
    if ("queryKey" in item) {
      return getQueryText(item);
    } else {
      return item.options.mutationKey
        ? (Array.isArray(item.options.mutationKey)
            ? item.options.mutationKey
            : [item.options.mutationKey]
          )
            .filter((k) => k != null)
            .map((k) => String(k))
            .join(" › ") || `Mutation #${item.mutationId}`
        : `Mutation #${item.mutationId}`;
    }
  };

  const tabs = [
    { key: "queries" as const, label: "Queries" },
    { key: "mutations" as const, label: "Mutations" },
  ];

  // Show details view when an item is selected
  if (selectedQuery || selectedMutation) {
    return (
      <ModalHeader>
        <ModalHeader.Navigation onBack={onBack} />
        <ModalHeader.Content
          title={getItemText(selectedQuery ?? selectedMutation!)}
        />
      </ModalHeader>
    );
  }

  // Show browser view with tabs when no item is selected
  return (
    <ModalHeader>
      <ModalHeader.Content title="" noMargin>
        {isSearchActive ? (
          <View style={styles.headerSearchContainer}>
            <Search size={14} color={macOSColors.text.secondary} />
            <TextInput
              ref={searchInputRef}
              style={styles.headerSearchInput}
              placeholder="Search query keys..."
              placeholderTextColor={macOSColors.text.muted}
              value={searchText}
              onChangeText={handleSearch}
              onSubmitEditing={() => setIsSearchActive(false)}
              onBlur={() => setIsSearchActive(false)}
              sentry-label="ignore react query search header"
              accessibilityLabel="Search queries and mutations"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchText.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  handleSearch("");
                  setIsSearchActive(false);
                }}
                sentry-label="ignore clear search header"
                style={styles.headerSearchClear}
              >
                <X size={14} color={macOSColors.text.secondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tab) => onTabChange(tab as "queries" | "mutations")}
          />
        )}
      </ModalHeader.Content>
      <ModalHeader.Actions>
        <TouchableOpacity
          sentry-label="ignore open search"
          onPress={handleSearchToggle}
          style={styles.headerActionButton}
        >
          <Search size={14} color={macOSColors.text.secondary} />
        </TouchableOpacity>
        {onFilterPress && (
          <TouchableOpacity
            sentry-label="ignore open filter"
            onPress={onFilterPress}
            style={[
              styles.headerActionButton,
              hasActiveFilters && styles.activeFilterButton,
            ]}
          >
            <Filter
              size={14}
              color={
                hasActiveFilters
                  ? macOSColors.semantic.info
                  : macOSColors.text.secondary
              }
            />
          </TouchableOpacity>
        )}
      </ModalHeader.Actions>
    </ModalHeader>
  );
}

const styles = StyleSheet.create({
  headerSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  headerSearchInput: {
    flex: 1,
    color: macOSColors.text.primary,
    fontSize: 13,
    fontFamily: "monospace",
    padding: 0,
    margin: 0,
    minHeight: 18,
  },
  headerSearchClear: {
    padding: 2,
  },
  headerActionButton: {
    padding: 6,
    borderRadius: 4,
  },
  activeFilterButton: {
    backgroundColor: macOSColors.semantic.infoBackground + "33",
  },
});
