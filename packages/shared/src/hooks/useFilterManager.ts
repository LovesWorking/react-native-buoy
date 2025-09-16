import { useState, useCallback } from "react";

export interface FilterManagerState {
  filters: Set<string>;
  showAddInput: boolean;
  newFilter: string;
}

export interface FilterManagerActions {
  setNewFilter: (value: string) => void;
  setShowAddInput: (value: boolean) => void;
  addFilter: (filter: string) => void;
  removeFilter: (filter: string) => void;
  toggleFilter: (filter: string) => void;
  clearFilters: () => void;
  hasFilter: (filter: string) => boolean;
}

export type UseFilterManagerReturn = FilterManagerState & FilterManagerActions;

/**
 * Custom hook for managing filter state and operations
 * 
 * This hook provides a complete interface for managing a set of string filters
 * with add, remove, toggle, and clear operations. It also manages UI state
 * for adding new filters through an input field.
 * 
 * @param initialFilters - Initial set of filters to start with
 * @returns Object containing filter state and management functions
 * 
 * @example
 * ```typescript
 * function FilterComponent() {
 *   const {
 *     filters,
 *     showAddInput,
 *     newFilter,
 *     addFilter,
 *     removeFilter,
 *     toggleFilter,
 *     clearFilters,
 *     setNewFilter,
 *     setShowAddInput,
 *     hasFilter
 *   } = useFilterManager(new Set(['initial-filter']));
 * 
 *   return (
 *     <div>
 *       {Array.from(filters).map(filter => (
 *         <FilterTag key={filter} onRemove={() => removeFilter(filter)}>
 *           {filter}
 *         </FilterTag>
 *       ))}
 *       <button onClick={() => addFilter('new-filter')}>Add Filter</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @performance Uses Set for O(1) filter lookups and efficient deduplication
 * @performance All operations are memoized with useCallback for stable references
 */
export function useFilterManager(
  initialFilters: Set<string> = new Set(),
): UseFilterManagerReturn {
  const [filters, setFilters] = useState<Set<string>>(initialFilters);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newFilter, setNewFilter] = useState("");

  /**
   * Add a new filter to the set
   * 
   * Trims whitespace and only adds non-empty strings. Automatically
   * clears the new filter input and hides the add input UI.
   * 
   * @param filter - The filter string to add
   */
  const addFilter = useCallback((filter: string) => {
    const trimmedFilter = filter.trim();
    if (trimmedFilter) {
      setFilters((prev) => new Set([...prev, trimmedFilter]));
      setNewFilter("");
      setShowAddInput(false);
    }
  }, []);

  /**
   * Remove a filter from the set
   * 
   * @param filter - The filter string to remove
   */
  const removeFilter = useCallback((filter: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      next.delete(filter);
      return next;
    });
  }, []);

  /**
   * Toggle a filter in the set (add if not present, remove if present)
   * 
   * @param filter - The filter string to toggle
   */
  const toggleFilter = useCallback((filter: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }, []);

  /**
   * Clear all filters and reset UI state
   * 
   * Removes all filters from the set and resets the input UI state.
   */
  const clearFilters = useCallback(() => {
    setFilters(new Set());
    setNewFilter("");
    setShowAddInput(false);
  }, []);

  /**
   * Check if a filter exists in the set
   * 
   * @param filter - The filter string to check
   * @returns True if the filter exists in the set
   */
  const hasFilter = useCallback(
    (filter: string) => {
      return filters.has(filter);
    },
    [filters],
  );

  return {
    // State
    filters,
    showAddInput,
    newFilter,
    // Actions
    setNewFilter,
    setShowAddInput,
    addFilter,
    removeFilter,
    toggleFilter,
    clearFilters,
    hasFilter,
  };
}
