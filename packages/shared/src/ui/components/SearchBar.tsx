import { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Search, X, Filter, Clock } from "rn-better-dev-tools/icons";
import { gameUIColors } from "../gameUI";

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  showFilters?: boolean;
  onFilterPress?: () => void;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?:
    | "done"
    | "go"
    | "next"
    | "search"
    | "send"
    | "default"
    | "emergency-call"
    | "google"
    | "join"
    | "route"
    | "yahoo";
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  suggestions = [],
  recentSearches = [],
  showFilters = false,
  onFilterPress,
  style,
  containerStyle,
  autoFocus = false,
  onSubmitEditing,
  returnKeyType,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    onChange("");
    onClear?.();
  };

  const handleSuggestionPress = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase())
  );

  const shouldShowSuggestions =
    isFocused &&
    (filteredSuggestions.length > 0 ||
      (value === "" && recentSearches.length > 0));

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
        <Search size={16} color={gameUIColors.secondary} />

        <TextInput
          style={[styles.input, style]}
          placeholder={placeholder}
          placeholderTextColor={gameUIColors.tertiary}
          value={value}
          onChangeText={onChange}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Clear any existing timeout
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
            }
            // Set new timeout with proper cleanup
            blurTimeoutRef.current = setTimeout(() => {
              setShowSuggestions(false);
              blurTimeoutRef.current = null;
            }, 200);
          }}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
        />

        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={14} color={gameUIColors.secondary} />
          </TouchableOpacity>
        )}

        {showFilters && (
          <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
            <Filter size={14} color={gameUIColors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {shouldShowSuggestions && showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {value === "" && recentSearches.length > 0 && (
            <>
              <Text style={styles.suggestionsTitle}>Recent</Text>
              {recentSearches.slice(0, 5).map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(search)}
                >
                  <Clock size={12} color={gameUIColors.tertiary} />
                  <Text style={styles.suggestionText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {filteredSuggestions.length > 0 && (
            <>
              {value !== "" && (
                <Text style={styles.suggestionsTitle}>Suggestions</Text>
              )}
              {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Search size={12} color={gameUIColors.tertiary} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

interface QuickSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  style?: TextStyle;
}

SearchBar.Quick = function QuickSearch({
  onSearch,
  placeholder = "Quick search...",
  style,
}: QuickSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setQuery("");
    }
  };

  return (
    <SearchBar
      value={query}
      onChange={setQuery}
      placeholder={placeholder}
      onSubmitEditing={handleSubmit}
      returnKeyType="search"
      style={style}
    />
  );
};

interface WithFiltersProps extends Omit<SearchBarProps, "showFilters"> {
  onFilterPress: () => void;
  filterCount?: number;
}

SearchBar.WithFilters = function WithFilters({
  filterCount,
  ...props
}: WithFiltersProps) {
  return (
    <View style={styles.withFiltersContainer}>
      <SearchBar {...props} showFilters />
      {filterCount !== undefined && filterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{filterCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 100,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchBarFocused: {
    borderColor: gameUIColors.primary + "40",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: gameUIColors.text,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: gameUIColors.primary + "20",
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 4,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: gameUIColors.secondary,
    textTransform: "uppercase",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: gameUIColors.text,
  },
  withFiltersContainer: {
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: gameUIColors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
