import { RequiredStorageKey } from "../types";
import { GameUIStorageBrowser } from "./GameUIStorageBrowser";
import { MutableRefObject } from "react";

interface StorageBrowserModeProps {
  requiredStorageKeys?: RequiredStorageKey[]; // Configuration for required keys
  showFilters?: boolean;
  ignoredPatterns?: Set<string>;
  onTogglePattern?: (pattern: string) => void;
  onAddPattern?: (pattern: string) => void;
  searchQuery?: string;
  storageDataRef?: MutableRefObject<any[]>;
}

/**
 * Storage browser mode component
 * Displays storage keys with game UI styled interface
 */
export function StorageBrowserMode({
  requiredStorageKeys = [],
  showFilters = false,
  ignoredPatterns = new Set(),
  onTogglePattern,
  onAddPattern,
  searchQuery = "",
  storageDataRef,
}: StorageBrowserModeProps) {
  return (
    <GameUIStorageBrowser
      requiredStorageKeys={requiredStorageKeys}
      showFilters={showFilters}
      ignoredPatterns={ignoredPatterns}
      onTogglePattern={onTogglePattern}
      onAddPattern={onAddPattern}
      searchQuery={searchQuery}
      storageDataRef={storageDataRef}
    />
  );
}
